import { useCallback } from 'react';
import { useGraphStore } from '../store/graphStore.js';
import { useUIStore } from '../store/uiStore.js';
import { getWSService } from '../services/websocket.js';
import type { GraphNode, GraphEdge, NodeType, EdgeType } from '@synapse/core';
import { fruchtermanReingold, circularLayout, hierarchicalLayout, gridLayout } from '@synapse/core';
import type { LayoutAlgorithm } from '../types/index.js';

/**
 * Hook that provides graph operations with WebSocket sync and undo/redo.
 */
export function useGraph() {
  const graphStore = useGraphStore();
  const uiStore = useUIStore();
  const ws = getWSService();

  const addNode = useCallback(
    (data: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const id = graphStore.addNode(data);
      const node = graphStore.getNode(id);
      if (node && ws) ws.sendNodeAdd(node);
      return id;
    },
    [graphStore, ws],
  );

  const removeNode = useCallback(
    (id: string): void => {
      graphStore.removeNode(id);
      if (ws) ws.sendNodeRemove(id);
      // Clear selection if removed
      if (uiStore.selectedNodeIds.has(id)) {
        uiStore.deselectAll();
      }
    },
    [graphStore, ws, uiStore],
  );

  const updateNode = useCallback(
    (id: string, updates: Partial<Omit<GraphNode, 'id' | 'createdAt'>>): void => {
      graphStore.updateNode(id, updates);
      if (ws) ws.sendNodeUpdate(id, updates);
    },
    [graphStore, ws],
  );

  const addEdge = useCallback(
    (data: Omit<GraphEdge, 'id'>): string | null => {
      const id = graphStore.addEdge(data);
      if (id) {
        const edge = graphStore.getEdge(id);
        if (edge && ws) ws.sendEdgeAdd(edge);
      }
      return id;
    },
    [graphStore, ws],
  );

  const removeEdge = useCallback(
    (id: string): void => {
      graphStore.removeEdge(id);
      if (ws) ws.sendEdgeRemove(id);
      if (uiStore.selectedEdgeId === id) {
        uiStore.deselectAll();
      }
    },
    [graphStore, ws, uiStore],
  );

  const updateEdge = useCallback(
    (id: string, updates: Partial<Omit<GraphEdge, 'id'>>): void => {
      graphStore.updateEdge(id, updates);
    },
    [graphStore],
  );

  const addNodeAtPosition = useCallback(
    (
      x: number,
      y: number,
      type: NodeType = 'concept',
      label = 'New Node',
    ): string => {
      return addNode({ type, label, position: { x, y } });
    },
    [addNode],
  );

  const connectNodes = useCallback(
    (sourceId: string, targetId: string, type: EdgeType = 'relates-to'): string | null => {
      // Avoid self-loops
      if (sourceId === targetId) return null;
      return addEdge({ type, source: sourceId, target: targetId });
    },
    [addEdge],
  );

  const applyLayout = useCallback(
    (algorithm: LayoutAlgorithm, canvasWidth: number, canvasHeight: number): void => {
      const nodes = graphStore.getAllNodes();
      const edges = graphStore.getAllEdges();
      const options = { width: canvasWidth, height: canvasHeight, iterations: 200 };

      uiStore.setLayoutRunning(true);

      // Run layout in next tick to allow UI to update
      requestAnimationFrame(() => {
        let positions: Map<string, { x: number; y: number }>;

        switch (algorithm) {
          case 'force':
            positions = fruchtermanReingold(nodes, edges, options);
            break;
          case 'circular':
            positions = circularLayout(nodes, options);
            break;
          case 'hierarchical':
            positions = hierarchicalLayout(nodes, edges, options);
            break;
          case 'grid':
            positions = gridLayout(nodes, options);
            break;
          default:
            positions = fruchtermanReingold(nodes, edges, options);
        }

        // Batch update positions
        for (const node of nodes) {
          const pos = positions.get(node.id);
          if (pos) {
            graphStore.updateNode(node.id, { position: pos });
          }
        }

        uiStore.setLayoutRunning(false);
        uiStore.showToast(`Applied ${algorithm} layout`, 'success');
      });
    },
    [graphStore, uiStore],
  );

  const duplicateNode = useCallback(
    (nodeId: string): string | null => {
      const node = graphStore.getNode(nodeId);
      if (!node) return null;
      return addNode({
        ...node,
        label: `${node.label} (copy)`,
        position: { x: node.position.x + 50, y: node.position.y + 50 },
      });
    },
    [graphStore, addNode],
  );

  return {
    graph: graphStore.graph,
    nodes: graphStore.getAllNodes(),
    edges: graphStore.getAllEdges(),
    isDirty: graphStore.isDirty,
    canUndo: graphStore.canUndo(),
    canRedo: graphStore.canRedo(),

    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    updateEdge,
    addNodeAtPosition,
    connectNodes,
    applyLayout,
    duplicateNode,

    undo: graphStore.undo,
    redo: graphStore.redo,
    clearGraph: graphStore.clearGraph,
    renameGraph: graphStore.renameGraph,
    loadGraph: graphStore.loadGraph,
    initGraph: graphStore.initGraph,

    getNode: graphStore.getNode,
    getEdge: graphStore.getEdge,
    getEdgesForNode: graphStore.getEdgesForNode,
  };
}
