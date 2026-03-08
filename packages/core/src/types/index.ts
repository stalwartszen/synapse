/**
 * Core types for Synapse knowledge graph platform
 */

export type NodeType = 'concept' | 'resource' | 'question' | 'insight' | 'custom';

export type EdgeType =
  | 'relates-to'
  | 'depends-on'
  | 'causes'
  | 'contradicts'
  | 'supports'
  | 'custom';

export interface Position {
  x: number;
  y: number;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  content?: string; // markdown
  tags?: string[];
  metadata?: Record<string, unknown>;
  position: Position;
  createdAt: number;
  updatedAt: number;
}

export interface GraphEdge {
  id: string;
  type: EdgeType;
  source: string; // node id
  target: string; // node id
  label?: string;
  weight?: number; // 0-1
  bidirectional?: boolean;
  metadata?: Record<string, unknown>;
}

export interface Graph {
  id: string;
  name: string;
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  createdAt: number;
  updatedAt: number;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  density: number;
  averageDegree: number;
  connectedComponents: number;
}

export interface LayoutOptions {
  width: number;
  height: number;
  iterations?: number;
  gravity?: number;
  repulsion?: number;
  attraction?: number;
  damping?: number;
}

export interface PathResult {
  path: string[]; // node ids
  distance: number;
}

export interface ClusterResult {
  clusters: Map<string, string[]>; // cluster id -> node ids
  modularity: number;
}

export type GraphEvent =
  | { type: 'node:added'; node: GraphNode }
  | { type: 'node:removed'; nodeId: string }
  | { type: 'node:updated'; node: GraphNode }
  | { type: 'edge:added'; edge: GraphEdge }
  | { type: 'edge:removed'; edgeId: string }
  | { type: 'graph:cleared' };

export type GraphEventListener = (event: GraphEvent) => void;
