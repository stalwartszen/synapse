import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { EditorMode, GraphView, NodeEditorState, SidebarPanel, Toast, ToastType } from '../types/index.js';

interface UIState {
  // Canvas view
  view: GraphView;
  setView: (view: Partial<GraphView>) => void;
  resetView: () => void;

  // Editor mode
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;

  // Selection
  selectedNodeIds: Set<string>;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  edgeDrawSource: string | null; // nodeId when drawing an edge

  selectNode: (id: string, addToSelection?: boolean) => void;
  selectEdge: (id: string) => void;
  deselectAll: () => void;
  setHoveredNode: (id: string | null) => void;
  setEdgeDrawSource: (id: string | null) => void;

  // Node editor
  nodeEditor: NodeEditorState;
  openNodeEditor: (nodeId?: string, mode?: 'create' | 'edit') => void;
  closeNodeEditor: () => void;

  // Sidebar
  sidebarOpen: boolean;
  sidebarPanel: SidebarPanel;
  setSidebarOpen: (open: boolean) => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  toggleSidebar: () => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Loading
  isLayoutRunning: boolean;
  setLayoutRunning: (v: boolean) => void;

  // Focus mode
  focusNodeId: string | null;
  setFocusNode: (id: string | null) => void;

  // Minimap visibility
  minimapVisible: boolean;
  toggleMinimap: () => void;

  // Modal states
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  learningModeOpen: boolean;
  setLearningModeOpen: (open: boolean) => void;
  templatesOpen: boolean;
  setTemplatesOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  aiSuggestionsOpen: boolean;
  setAISuggestionsOpen: (open: boolean) => void;
  analyticsOpen: boolean;
  setAnalyticsOpen: (open: boolean) => void;
}

const DEFAULT_VIEW: GraphView = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

function generateToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    // ── Canvas view ──────────────────────────────────────────────────────────

    view: { ...DEFAULT_VIEW },

    setView: (partial) =>
      set((state) => ({ view: { ...state.view, ...partial } })),

    resetView: () => set({ view: { ...DEFAULT_VIEW } }),

    // ── Editor mode ───────────────────────────────────────────────────────────

    mode: 'select',

    setMode: (mode) => {
      const state = get();
      // Clear edge-draw state when switching modes
      if (mode !== 'add-edge' && state.edgeDrawSource !== null) {
        set({ mode, edgeDrawSource: null });
      } else {
        set({ mode });
      }
    },

    // ── Selection ─────────────────────────────────────────────────────────────

    selectedNodeIds: new Set(),
    selectedEdgeId: null,
    hoveredNodeId: null,
    edgeDrawSource: null,

    selectNode: (id, addToSelection = false) => {
      set((state) => {
        if (addToSelection) {
          const newSet = new Set(state.selectedNodeIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedNodeIds: newSet, selectedEdgeId: null };
        }
        return { selectedNodeIds: new Set([id]), selectedEdgeId: null };
      });
    },

    selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeIds: new Set() }),

    deselectAll: () =>
      set({ selectedNodeIds: new Set(), selectedEdgeId: null, edgeDrawSource: null }),

    setHoveredNode: (id) => set({ hoveredNodeId: id }),

    setEdgeDrawSource: (id) => set({ edgeDrawSource: id }),

    // ── Node editor ───────────────────────────────────────────────────────────

    nodeEditor: {
      isOpen: false,
      nodeId: null,
      mode: 'create',
    },

    openNodeEditor: (nodeId, mode = nodeId ? 'edit' : 'create') => {
      set({
        nodeEditor: {
          isOpen: true,
          nodeId: nodeId ?? null,
          mode,
        },
      });
    },

    closeNodeEditor: () =>
      set((state) => ({
        nodeEditor: { ...state.nodeEditor, isOpen: false },
      })),

    // ── Sidebar ───────────────────────────────────────────────────────────────

    sidebarOpen: true,
    sidebarPanel: 'nodes',

    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    setSidebarPanel: (panel) => set({ sidebarPanel: panel, sidebarOpen: true }),

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    // ── Toasts ────────────────────────────────────────────────────────────────

    toasts: [],

    showToast: (message, type = 'info', duration = 4000) => {
      const id = generateToastId();
      const toast: Toast = { id, message, type, duration };
      set((state) => ({ toasts: [...state.toasts, toast] }));

      if (duration > 0) {
        setTimeout(() => {
          get().dismissToast(id);
        }, duration);
      }
    },

    dismissToast: (id) =>
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    // ── Loading ───────────────────────────────────────────────────────────────

    isLayoutRunning: false,
    setLayoutRunning: (v) => set({ isLayoutRunning: v }),

    // ── Focus mode ────────────────────────────────────────────────────────────

    focusNodeId: null,
    setFocusNode: (id) => set({ focusNodeId: id }),

    // ── Minimap ───────────────────────────────────────────────────────────────

    minimapVisible: true,
    toggleMinimap: () => set((state) => ({ minimapVisible: !state.minimapVisible })),

    // ── Modals ────────────────────────────────────────────────────────────────

    commandPaletteOpen: false,
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

    learningModeOpen: false,
    setLearningModeOpen: (open) => set({ learningModeOpen: open }),

    templatesOpen: false,
    setTemplatesOpen: (open) => set({ templatesOpen: open }),

    settingsOpen: false,
    setSettingsOpen: (open) => set({ settingsOpen: open }),

    aiSuggestionsOpen: false,
    setAISuggestionsOpen: (open) => set({ aiSuggestionsOpen: open }),

    analyticsOpen: false,
    setAnalyticsOpen: (open) => set({ analyticsOpen: open }),
  })),
);
