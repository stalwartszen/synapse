import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Graph, GraphNode, GraphEdge, NodeType, EdgeType } from '@synapse/core';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function cloneGraph(graph: Graph): Graph {
  return {
    ...graph,
    nodes: new Map(Array.from(graph.nodes.entries()).map(([k, v]) => [k, { ...v }])),
    edges: new Map(Array.from(graph.edges.entries()).map(([k, v]) => [k, { ...v }])),
  };
}

function createEmptyGraph(id?: string, name?: string): Graph {
  return {
    id: id ?? generateId('graph'),
    name: name ?? 'Untitled Graph',
    nodes: new Map(),
    edges: new Map(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const MAX_HISTORY = 50;

interface GraphState {
  graph: Graph;
  history: Graph[];
  historyIndex: number;
  isDirty: boolean;

  // Mutations
  initGraph: (id?: string, name?: string) => void;
  loadGraph: (graph: Graph) => void;

  addNode: (
    data: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => string;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<Omit<GraphNode, 'id' | 'createdAt'>>) => void;

  addEdge: (data: Omit<GraphEdge, 'id'> & { id?: string }) => string | null;
  removeEdge: (id: string) => void;
  updateEdge: (id: string, updates: Partial<Omit<GraphEdge, 'id'>>) => void;

  undo: () => void;
  redo: () => void;
  clearGraph: () => void;
  renameGraph: (name: string) => void;
  markClean: () => void;

  // Selectors
  getNode: (id: string) => GraphNode | undefined;
  getEdge: (id: string) => GraphEdge | undefined;
  getAllNodes: () => GraphNode[];
  getAllEdges: () => GraphEdge[];
  getEdgesForNode: (nodeId: string) => GraphEdge[];
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useGraphStore = create<GraphState>()(
  subscribeWithSelector((set, get) => {
    const pushHistory = (prevGraph: Graph) => {
      const { history, historyIndex } = get();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(cloneGraph(prevGraph));
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    };

    const initialGraph = createEmptyGraph();

    return {
      graph: initialGraph,
      history: [cloneGraph(initialGraph)],
      historyIndex: 0,
      isDirty: false,

      initGraph: (id, name) => {
        const graph = createEmptyGraph(id, name);
        set({
          graph,
          history: [cloneGraph(graph)],
          historyIndex: 0,
          isDirty: false,
        });
      },

      loadGraph: (graph) => {
        set({
          graph: cloneGraph(graph),
          history: [cloneGraph(graph)],
          historyIndex: 0,
          isDirty: false,
        });
      },

      addNode: (data) => {
        const state = get();
        const historyUpdate = pushHistory(state.graph);
        const now = Date.now();
        const id = data.id ?? generateId('node');
        const node: GraphNode = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        };
        const newNodes = new Map(state.graph.nodes);
        newNodes.set(id, node);
        set({
          graph: { ...state.graph, nodes: newNodes, updatedAt: now },
          isDirty: true,
          ...historyUpdate,
        });
        return id;
      },

      removeNode: (id) => {
        const state = get();
        const historyUpdate = pushHistory(state.graph);
        const newNodes = new Map(state.graph.nodes);
        newNodes.delete(id);
        // Remove connected edges
        const newEdges = new Map(
          Array.from(state.graph.edges.entries()).filter(
            ([, e]) => e.source !== id && e.target !== id,
          ),
        );
        set({
          graph: { ...state.graph, nodes: newNodes, edges: newEdges, updatedAt: Date.now() },
          isDirty: true,
          ...historyUpdate,
        });
      },

      updateNode: (id, updates) => {
        const state = get();
        const existing = state.graph.nodes.get(id);
        if (!existing) return;
        const historyUpdate = pushHistory(state.graph);
        const updated: GraphNode = { ...existing, ...updates, id, updatedAt: Date.now() };
        const newNodes = new Map(state.graph.nodes);
        newNodes.set(id, updated);
        set({
          graph: { ...state.graph, nodes: newNodes, updatedAt: Date.now() },
          isDirty: true,
          ...historyUpdate,
        });
      },

      addEdge: (data) => {
        const state = get();
        if (!state.graph.nodes.has(data.source) || !state.graph.nodes.has(data.target)) {
          return null;
        }
        const historyUpdate = pushHistory(state.graph);
        const id = data.id ?? generateId('edge');
        const edge: GraphEdge = { ...data, id };
        const newEdges = new Map(state.graph.edges);
        newEdges.set(id, edge);
        set({
          graph: { ...state.graph, edges: newEdges, updatedAt: Date.now() },
          isDirty: true,
          ...historyUpdate,
        });
        return id;
      },

      removeEdge: (id) => {
        const state = get();
        const historyUpdate = pushHistory(state.graph);
        const newEdges = new Map(state.graph.edges);
        newEdges.delete(id);
        set({
          graph: { ...state.graph, edges: newEdges, updatedAt: Date.now() },
          isDirty: true,
          ...historyUpdate,
        });
      },

      updateEdge: (id, updates) => {
        const state = get();
        const existing = state.graph.edges.get(id);
        if (!existing) return;
        const historyUpdate = pushHistory(state.graph);
        const updated: GraphEdge = { ...existing, ...updates, id };
        const newEdges = new Map(state.graph.edges);
        newEdges.set(id, updated);
        set({
          graph: { ...state.graph, edges: newEdges, updatedAt: Date.now() },
          isDirty: true,
          ...historyUpdate,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;
        const prevIndex = historyIndex - 1;
        const prevGraph = history[prevIndex];
        if (!prevGraph) return;
        set({ graph: cloneGraph(prevGraph), historyIndex: prevIndex, isDirty: true });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;
        const nextIndex = historyIndex + 1;
        const nextGraph = history[nextIndex];
        if (!nextGraph) return;
        set({ graph: cloneGraph(nextGraph), historyIndex: nextIndex, isDirty: true });
      },

      clearGraph: () => {
        const state = get();
        const historyUpdate = pushHistory(state.graph);
        const cleared: Graph = {
          ...state.graph,
          nodes: new Map(),
          edges: new Map(),
          updatedAt: Date.now(),
        };
        set({ graph: cleared, isDirty: true, ...historyUpdate });
      },

      renameGraph: (name) => {
        const state = get();
        set({ graph: { ...state.graph, name, updatedAt: Date.now() }, isDirty: true });
      },

      markClean: () => set({ isDirty: false }),

      getNode: (id) => get().graph.nodes.get(id),
      getEdge: (id) => get().graph.edges.get(id),
      getAllNodes: () => Array.from(get().graph.nodes.values()),
      getAllEdges: () => Array.from(get().graph.edges.values()),
      getEdgesForNode: (nodeId) =>
        Array.from(get().graph.edges.values()).filter(
          (e) => e.source === nodeId || e.target === nodeId,
        ),
      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    };
  }),
);

// Seed the store with example nodes for development
export function seedExampleGraph(): void {
  const store = useGraphStore.getState();
  store.initGraph(undefined, 'Knowledge Base');

  const n1 = store.addNode({
    type: 'concept' as NodeType,
    label: 'Artificial Intelligence',
    content: '# Artificial Intelligence\n\nThe simulation of human intelligence in machines.',
    tags: ['ai', 'technology'],
    position: { x: 400, y: 300 },
  });

  const n2 = store.addNode({
    type: 'concept' as NodeType,
    label: 'Machine Learning',
    content: '# Machine Learning\n\nA subset of AI that enables learning from data.',
    tags: ['ai', 'ml'],
    position: { x: 650, y: 200 },
  });

  const n3 = store.addNode({
    type: 'resource' as NodeType,
    label: 'Neural Networks',
    content: '# Neural Networks\n\nComputational models inspired by biological neurons.',
    tags: ['ai', 'ml', 'dl'],
    position: { x: 650, y: 420 },
  });

  const n4 = store.addNode({
    type: 'question' as NodeType,
    label: 'Can AI be conscious?',
    content: '# Can AI be conscious?\n\nA philosophical question about artificial general intelligence.',
    tags: ['philosophy', 'ai'],
    position: { x: 150, y: 200 },
  });

  const n5 = store.addNode({
    type: 'insight' as NodeType,
    label: 'Emergent Behavior',
    content: '# Emergent Behavior\n\nComplex patterns arising from simple rules in large systems.',
    tags: ['complexity', 'ai'],
    position: { x: 150, y: 420 },
  });

  store.addEdge({ type: 'depends-on' as EdgeType, source: n2, target: n1, label: 'subset of' });
  store.addEdge({ type: 'depends-on' as EdgeType, source: n3, target: n2, label: 'uses' });
  store.addEdge({ type: 'relates-to' as EdgeType, source: n4, target: n1 });
  store.addEdge({ type: 'causes' as EdgeType, source: n3, target: n5, label: 'leads to' });
  store.addEdge({ type: 'supports' as EdgeType, source: n5, target: n4, label: 'evidence for' });

  store.markClean();
}
