import type { WSMessage, WSMessageType } from '../types/index.js';
import { useCollaborationStore } from '../store/collaborationStore.js';
import { useGraphStore } from '../store/graphStore.js';
import type { GraphNode, GraphEdge } from '@synapse/core';

type MessageHandler = (payload: unknown, message: WSMessage) => void;

interface WSServiceOptions {
  url: string;
  graphId: string;
  userId: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket service for real-time collaboration.
 * Handles connection lifecycle, reconnection, heartbeat, and message routing.
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private options: WSServiceOptions;
  private handlers = new Map<WSMessageType, MessageHandler[]>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(options: WSServiceOptions) {
    this.options = {
      reconnectDelay: 2000,
      maxReconnectAttempts: 10,
      ...options,
    };
  }

  // ─── Connection lifecycle ────────────────────────────────────────────────────

  connect(): void {
    if (this.destroyed) return;

    const collabStore = useCollaborationStore.getState();
    collabStore.setConnecting(true);
    collabStore.setConnectionError(null);

    try {
      this.ws = new WebSocket(this.options.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect';
      collabStore.setConnectionError(msg);
      collabStore.setConnecting(false);
    }
  }

  disconnect(): void {
    this.destroyed = true;
    this.stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ─── Sending ──────────────────────────────────────────────────────────────────

  send(type: WSMessageType, payload: unknown): void {
    if (!this.isConnected || !this.ws) return;

    const message: WSMessage = {
      type,
      userId: this.options.userId,
      graphId: this.options.graphId,
      payload,
      timestamp: Date.now(),
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch {
      console.warn('[WebSocketService] Failed to send message', type);
    }
  }

  // Convenience methods
  sendCursorMove(x: number, y: number): void {
    this.send('cursor-move', { x, y });
  }

  sendNodeAdd(node: GraphNode): void {
    this.send('node-add', node);
  }

  sendNodeUpdate(nodeId: string, updates: Partial<GraphNode>): void {
    this.send('node-update', { nodeId, updates });
  }

  sendNodeRemove(nodeId: string): void {
    this.send('node-remove', { nodeId });
  }

  sendEdgeAdd(edge: GraphEdge): void {
    this.send('edge-add', edge);
  }

  sendEdgeRemove(edgeId: string): void {
    this.send('edge-remove', { edgeId });
  }

  sendUserSelect(nodeId: string | null): void {
    this.send('user-select', { nodeId });
  }

  requestSync(): void {
    this.send('sync-request', {});
  }

  // ─── Handler registration ─────────────────────────────────────────────────────

  on(type: WSMessageType, handler: MessageHandler): () => void {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler);
    this.handlers.set(type, existing);

    return () => {
      const current = this.handlers.get(type) ?? [];
      this.handlers.set(type, current.filter((h) => h !== handler));
    };
  }

  // ─── Event handlers ───────────────────────────────────────────────────────────

  private handleOpen(): void {
    const collabStore = useCollaborationStore.getState();
    collabStore.setConnected(true);
    collabStore.resetReconnectAttempts();

    // Announce ourselves
    const localUser = collabStore.localUser;
    this.send('join', {
      user: localUser,
      graphId: this.options.graphId,
    });

    // Request latest graph state
    this.requestSync();
    this.startPing();
  }

  private handleMessage(event: MessageEvent): void {
    let message: WSMessage;
    try {
      message = JSON.parse(event.data as string) as WSMessage;
    } catch {
      console.warn('[WebSocketService] Failed to parse message');
      return;
    }

    // Don't process our own messages reflected back
    if (message.userId === this.options.userId && message.type !== 'pong') return;

    this.routeMessage(message);
  }

  private routeMessage(message: WSMessage): void {
    const collabStore = useCollaborationStore.getState();
    const graphStore = useGraphStore.getState();

    switch (message.type) {
      case 'join': {
        const payload = message.payload as { user: { id: string; name: string; color: string } };
        collabStore.addRemoteUser({
          ...payload.user,
          avatar: undefined,
          cursor: undefined,
          selectedNodeId: undefined,
          isActive: true,
          joinedAt: message.timestamp,
          lastSeenAt: message.timestamp,
        });
        break;
      }

      case 'leave': {
        collabStore.removeRemoteUser(message.userId);
        break;
      }

      case 'cursor-move': {
        const payload = message.payload as { x: number; y: number };
        collabStore.updateRemoteUserCursor(message.userId, payload.x, payload.y);
        break;
      }

      case 'node-add': {
        const node = message.payload as GraphNode;
        if (!graphStore.graph.nodes.has(node.id)) {
          graphStore.addNode(node);
        }
        break;
      }

      case 'node-update': {
        const { nodeId, updates } = message.payload as {
          nodeId: string;
          updates: Partial<GraphNode>;
        };
        graphStore.updateNode(nodeId, updates);
        break;
      }

      case 'node-remove': {
        const { nodeId } = message.payload as { nodeId: string };
        graphStore.removeNode(nodeId);
        break;
      }

      case 'edge-add': {
        const edge = message.payload as GraphEdge;
        if (!graphStore.graph.edges.has(edge.id)) {
          graphStore.addEdge(edge);
        }
        break;
      }

      case 'edge-remove': {
        const { edgeId } = message.payload as { edgeId: string };
        graphStore.removeEdge(edgeId);
        break;
      }

      case 'user-select': {
        const { nodeId } = message.payload as { nodeId: string | null };
        collabStore.updateRemoteUserSelection(message.userId, nodeId ?? undefined);
        break;
      }

      case 'pong': {
        // heartbeat OK
        break;
      }

      case 'sync-response': {
        // Server sends full graph state on join
        const payload = message.payload as {
          nodes: GraphNode[];
          edges: GraphEdge[];
        };
        if (payload.nodes && payload.edges) {
          // Load the authoritative state
          const graph = useGraphStore.getState().graph;
          const newNodes = new Map(graph.nodes);
          const newEdges = new Map(graph.edges);
          for (const node of payload.nodes) newNodes.set(node.id, node);
          for (const edge of payload.edges) newEdges.set(edge.id, edge);
          graphStore.loadGraph({ ...graph, nodes: newNodes, edges: newEdges });
        }
        break;
      }
    }

    // Fire registered handlers
    const handlers = this.handlers.get(message.type) ?? [];
    for (const handler of handlers) {
      handler(message.payload, message);
    }
  }

  private handleClose(event: CloseEvent): void {
    const collabStore = useCollaborationStore.getState();
    collabStore.setConnected(false);
    collabStore.clearRemoteUsers();
    this.stopPing();

    if (!this.destroyed && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleError(): void {
    useCollaborationStore.getState().setConnectionError('WebSocket connection error');
  }

  // ─── Reconnection ──────────────────────────────────────────────────────────────

  private scheduleReconnect(): void {
    const collabStore = useCollaborationStore.getState();
    const max = this.options.maxReconnectAttempts ?? 10;

    if (collabStore.reconnectAttempts >= max) {
      collabStore.setConnectionError(`Max reconnect attempts (${max}) reached`);
      return;
    }

    collabStore.incrementReconnectAttempts();
    const delay = Math.min(
      (this.options.reconnectDelay ?? 2000) * Math.pow(1.5, collabStore.reconnectAttempts),
      30000,
    );

    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) this.connect();
    }, delay);
  }

  // ─── Heartbeat ────────────────────────────────────────────────────────────────

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send('ping', {});
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export function getWSService(): WebSocketService | null {
  return wsService;
}

export function createWSService(options: WSServiceOptions): WebSocketService {
  wsService?.disconnect();
  wsService = new WebSocketService(options);
  return wsService;
}

export function destroyWSService(): void {
  wsService?.disconnect();
  wsService = null;
}
