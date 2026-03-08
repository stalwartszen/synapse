import type { GraphNode, NodeType } from '@synapse/core';

// ─── Collaboration ────────────────────────────────────────────────────────────

export interface CollaborationUser {
  id: string;
  name: string;
  color: string; // hex
  avatar: string | undefined;
  cursor: { x: number; y: number } | undefined; // world coordinates
  selectedNodeId: string | undefined;
  isActive: boolean;
  joinedAt: number;
  lastSeenAt: number;
}

// ─── UI / View state ─────────────────────────────────────────────────────────

export type EditorMode = 'select' | 'add-node' | 'add-edge';
export type LayoutAlgorithm = 'force' | 'circular' | 'hierarchical' | 'grid';

export interface GraphView {
  zoom: number;         // scale factor
  panX: number;         // world offset x
  panY: number;         // world offset y
}

export interface CanvasSize {
  width: number;
  height: number;
}

// ─── Node editing ─────────────────────────────────────────────────────────────

export interface NodeEditorState {
  isOpen: boolean;
  nodeId: string | null;
  mode: 'create' | 'edit';
  initialData?: Partial<GraphNode>;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export type ExportFormat = 'png' | 'svg' | 'json';

// ─── Notifications ────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ─── WebSocket messages ───────────────────────────────────────────────────────

export type WSMessageType =
  | 'join'
  | 'leave'
  | 'cursor-move'
  | 'node-add'
  | 'node-update'
  | 'node-remove'
  | 'edge-add'
  | 'edge-remove'
  | 'user-select'
  | 'ping'
  | 'pong'
  | 'sync-request'
  | 'sync-response';

export interface WSMessage {
  type: WSMessageType;
  userId: string;
  graphId: string;
  payload: unknown;
  timestamp: number;
}

// ─── Graph metadata ───────────────────────────────────────────────────────────

export interface GraphMetadata {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  nodeCount: number;
  edgeCount: number;
  createdAt: number;
  updatedAt: number;
  collaborators: string[];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  nodeId: string;
  label: string;
  type: NodeType;
  matchedField: 'label' | 'content' | 'tag';
  snippet?: string;
}

// ─── Sidebar panels ───────────────────────────────────────────────────────────

export type SidebarPanel = 'nodes' | 'search' | 'properties' | 'clusters' | 'analytics';
