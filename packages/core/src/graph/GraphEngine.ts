import type {
  Graph,
  GraphNode,
  GraphEdge,
  GraphStats,
  GraphEvent,
  GraphEventListener,
  NodeType,
  EdgeType,
} from '../types/index.js';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Core graph engine: manages nodes, edges, adjacency, and emits change events.
 */
export class GraphEngine {
  private graph: Graph;
  private adjacency: Map<string, Set<string>>; // nodeId -> set of neighbor nodeIds
  private listeners: GraphEventListener[] = [];

  constructor(graphData?: Partial<Pick<Graph, 'id' | 'name'>>) {
    this.graph = {
      id: graphData?.id ?? generateId('graph'),
      name: graphData?.name ?? 'Untitled Graph',
      nodes: new Map(),
      edges: new Map(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.adjacency = new Map();
  }

  // ─── Event system ───────────────────────────────────────────────────────────

  on(listener: GraphEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: GraphEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  // ─── Graph access ────────────────────────────────────────────────────────────

  getGraph(): Readonly<Graph> {
    return this.graph;
  }

  getNode(id: string): GraphNode | undefined {
    return this.graph.nodes.get(id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.graph.edges.get(id);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.graph.nodes.values());
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.graph.edges.values());
  }

  // ─── Node operations ─────────────────────────────────────────────────────────

  addNode(
    data: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): GraphNode {
    const now = Date.now();
    const node: GraphNode = {
      ...data,
      id: data.id ?? generateId('node'),
      createdAt: now,
      updatedAt: now,
    };

    this.graph.nodes.set(node.id, node);
    this.adjacency.set(node.id, new Set());
    this.graph.updatedAt = now;
    this.emit({ type: 'node:added', node });
    return node;
  }

  removeNode(id: string): boolean {
    if (!this.graph.nodes.has(id)) return false;

    // Remove all edges connected to this node
    const edgesToRemove: string[] = [];
    for (const [edgeId, edge] of this.graph.edges) {
      if (edge.source === id || edge.target === id) {
        edgesToRemove.push(edgeId);
      }
    }
    for (const edgeId of edgesToRemove) {
      this.removeEdge(edgeId);
    }

    this.graph.nodes.delete(id);
    this.adjacency.delete(id);
    this.graph.updatedAt = Date.now();
    this.emit({ type: 'node:removed', nodeId: id });
    return true;
  }

  updateNode(id: string, updates: Partial<Omit<GraphNode, 'id' | 'createdAt'>>): GraphNode | null {
    const existing = this.graph.nodes.get(id);
    if (!existing) return null;

    const updated: GraphNode = {
      ...existing,
      ...updates,
      id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };

    this.graph.nodes.set(id, updated);
    this.graph.updatedAt = Date.now();
    this.emit({ type: 'node:updated', node: updated });
    return updated;
  }

  // ─── Edge operations ─────────────────────────────────────────────────────────

  addEdge(data: Omit<GraphEdge, 'id'> & { id?: string }): GraphEdge | null {
    if (!this.graph.nodes.has(data.source)) {
      console.warn(`[GraphEngine] addEdge: source node "${data.source}" not found`);
      return null;
    }
    if (!this.graph.nodes.has(data.target)) {
      console.warn(`[GraphEngine] addEdge: target node "${data.target}" not found`);
      return null;
    }

    const edge: GraphEdge = {
      ...data,
      id: data.id ?? generateId('edge'),
    };

    this.graph.edges.set(edge.id, edge);

    // Update adjacency
    this.adjacency.get(edge.source)?.add(edge.target);
    this.adjacency.get(edge.target)?.add(edge.source);

    this.graph.updatedAt = Date.now();
    this.emit({ type: 'edge:added', edge });
    return edge;
  }

  removeEdge(id: string): boolean {
    const edge = this.graph.edges.get(id);
    if (!edge) return false;

    this.graph.edges.delete(id);

    // Update adjacency (only remove if no other edges connect these nodes)
    const stillConnected = Array.from(this.graph.edges.values()).some(
      (e) =>
        (e.source === edge.source && e.target === edge.target) ||
        (e.source === edge.target && e.target === edge.source),
    );
    if (!stillConnected) {
      this.adjacency.get(edge.source)?.delete(edge.target);
      this.adjacency.get(edge.target)?.delete(edge.source);
    }

    this.graph.updatedAt = Date.now();
    this.emit({ type: 'edge:removed', edgeId: id });
    return true;
  }

  // ─── Graph queries ────────────────────────────────────────────────────────────

  getNeighbors(nodeId: string): GraphNode[] {
    const neighborIds = this.adjacency.get(nodeId);
    if (!neighborIds) return [];
    const result: GraphNode[] = [];
    for (const id of neighborIds) {
      const node = this.graph.nodes.get(id);
      if (node) result.push(node);
    }
    return result;
  }

  getEdgesForNode(nodeId: string): GraphEdge[] {
    return Array.from(this.graph.edges.values()).filter(
      (e) => e.source === nodeId || e.target === nodeId,
    );
  }

  getEdgesBetween(sourceId: string, targetId: string): GraphEdge[] {
    return Array.from(this.graph.edges.values()).filter(
      (e) =>
        (e.source === sourceId && e.target === targetId) ||
        (e.source === targetId && e.target === sourceId),
    );
  }

  getDegree(nodeId: string): number {
    return this.adjacency.get(nodeId)?.size ?? 0;
  }

  getInDegree(nodeId: string): number {
    let count = 0;
    for (const edge of this.graph.edges.values()) {
      if (edge.target === nodeId) count++;
    }
    return count;
  }

  getOutDegree(nodeId: string): number {
    let count = 0;
    for (const edge of this.graph.edges.values()) {
      if (edge.source === nodeId) count++;
    }
    return count;
  }

  hasEdge(sourceId: string, targetId: string): boolean {
    for (const edge of this.graph.edges.values()) {
      if (
        (edge.source === sourceId && edge.target === targetId) ||
        (edge.bidirectional && edge.source === targetId && edge.target === sourceId)
      ) {
        return true;
      }
    }
    return false;
  }

  // ─── Search ────────────────────────────────────────────────────────────────────

  findNodes(predicate: (node: GraphNode) => boolean): GraphNode[] {
    return Array.from(this.graph.nodes.values()).filter(predicate);
  }

  findNodesByType(type: NodeType): GraphNode[] {
    return this.findNodes((n) => n.type === type);
  }

  findEdgesByType(type: EdgeType): GraphEdge[] {
    return Array.from(this.graph.edges.values()).filter((e) => e.type === type);
  }

  searchByLabel(query: string): GraphNode[] {
    const lower = query.toLowerCase();
    return this.findNodes((n) => n.label.toLowerCase().includes(lower));
  }

  searchByTag(tag: string): GraphNode[] {
    return this.findNodes((n) => n.tags?.includes(tag) ?? false);
  }

  // ─── Statistics ───────────────────────────────────────────────────────────────

  getStats(): GraphStats {
    const nodeCount = this.graph.nodes.size;
    const edgeCount = this.graph.edges.size;
    const maxEdges = nodeCount * (nodeCount - 1);
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;
    const averageDegree = nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0;
    const connectedComponents = this.countConnectedComponents();

    return { nodeCount, edgeCount, density, averageDegree, connectedComponents };
  }

  private countConnectedComponents(): number {
    const visited = new Set<string>();
    let components = 0;

    for (const nodeId of this.graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.bfsVisit(nodeId, visited);
        components++;
      }
    }
    return components;
  }

  private bfsVisit(startId: string, visited: Set<string>): void {
    const queue: string[] = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.adjacency.get(current);
      if (!neighbors) continue;
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  // ─── Serialization ────────────────────────────────────────────────────────────

  toJSON(): object {
    return {
      id: this.graph.id,
      name: this.graph.name,
      nodes: Array.from(this.graph.nodes.values()),
      edges: Array.from(this.graph.edges.values()),
      createdAt: this.graph.createdAt,
      updatedAt: this.graph.updatedAt,
    };
  }

  static fromJSON(data: {
    id: string;
    name: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    createdAt: number;
    updatedAt: number;
  }): GraphEngine {
    const engine = new GraphEngine({ id: data.id, name: data.name });
    engine.graph.createdAt = data.createdAt;
    engine.graph.updatedAt = data.updatedAt;

    for (const node of data.nodes) {
      engine.graph.nodes.set(node.id, node);
      engine.adjacency.set(node.id, new Set());
    }
    for (const edge of data.edges) {
      engine.graph.edges.set(edge.id, edge);
      engine.adjacency.get(edge.source)?.add(edge.target);
      engine.adjacency.get(edge.target)?.add(edge.source);
    }

    return engine;
  }

  clear(): void {
    this.graph.nodes.clear();
    this.graph.edges.clear();
    this.adjacency.clear();
    this.graph.updatedAt = Date.now();
    this.emit({ type: 'graph:cleared' });
  }
}
