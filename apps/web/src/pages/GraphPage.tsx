import React, { useCallback, useRef, useEffect } from 'react';
import { GraphCanvas } from '../components/Graph/GraphCanvas.js';
import { Toolbar } from '../components/Toolbar/Toolbar.js';
import { Sidebar } from '../components/Sidebar/Sidebar.js';
import { NodeEditor } from '../components/NodeEditor/NodeEditor.js';
import { CollaborationPanel } from '../components/CollaborationPanel/CollaborationPanel.js';
import { CommandPalette } from '../components/CommandPalette/CommandPalette.js';
import { Minimap } from '../components/Minimap/Minimap.js';
import { LearningMode } from '../components/LearningMode/LearningMode.js';
import { Templates } from '../components/Templates/Templates.js';
import { AISuggestions } from '../components/AISuggestions/AISuggestions.js';
import { Settings } from '../components/Settings/Settings.js';
import { AnalyticsPanel } from '../components/AnalyticsPanel/AnalyticsPanel.js';
import { useGraph } from '../hooks/useGraph.js';
import { useUIStore } from '../store/uiStore.js';
import { useCollaboration } from '../hooks/useCollaboration.js';
import { exportAsPNG, exportAsSVG, exportAsJSON } from '../utils/export.js';
import { importFromMarkdown } from '../utils/import.js';
import { getApiKey } from '../services/aiService.js';
import type { AppRoute } from '../App.js';
import type { NodeEditorData } from '../components/NodeEditor/NodeEditor.js';
import type { NodeType, EdgeType } from '@synapse/core';

interface GraphPageProps {
  graphId?: string;
  onNavigate: (route: AppRoute, graphId?: string) => void;
}

export const GraphPage: React.FC<GraphPageProps> = ({ graphId, onNavigate }) => {
  const graphHook = useGraph();
  const uiStore = useUIStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Collaboration
  useCollaboration({
    graphId: graphId ?? graphHook.graph.id,
    userName: 'You',
    enabled: Boolean(import.meta.env['VITE_WS_URL']),
  });

  const nodes = graphHook.nodes;
  const edges = graphHook.edges;

  // ── Global keyboard shortcuts ──────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Cmd+K: command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        uiStore.setCommandPaletteOpen(true);
        return;
      }

      // Single-key shortcuts (no modifier)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 'l':
          uiStore.setLearningModeOpen(true);
          break;
        case 't':
          uiStore.setTemplatesOpen(true);
          break;
        case 'm':
          uiStore.toggleMinimap();
          break;
        case ',':
          uiStore.setSettingsOpen(true);
          break;
        case 'a': {
          if (getApiKey()) {
            uiStore.setAISuggestionsOpen(true);
          } else {
            uiStore.setSettingsOpen(true);
          }
          break;
        }
        case 'f': {
          // Focus mode: toggle on selected node
          const selIds = Array.from(uiStore.selectedNodeIds);
          if (selIds.length > 0) {
            const currentFocus = uiStore.focusNodeId;
            const firstSel = selIds[0]!;
            uiStore.setFocusNode(currentFocus === firstSel ? null : firstSel);
          } else {
            uiStore.setFocusNode(null);
          }
          break;
        }
        case 'escape': {
          uiStore.setCommandPaletteOpen(false);
          uiStore.setFocusNode(null);
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [uiStore]);

  // ── Node editor handlers ──────────────────────────────────────────────────

  const handleNodeEditorSave = useCallback(
    (data: NodeEditorData) => {
      const { nodeEditor } = uiStore;
      if (nodeEditor.mode === 'create') {
        const canvasEl = canvasRef.current;
        const width = canvasEl?.getBoundingClientRect().width ?? window.innerWidth - 300;
        const height = canvasEl?.getBoundingClientRect().height ?? window.innerHeight;
        const view = uiStore.view;

        const worldX = (width / 2 - view.panX) / view.zoom;
        const worldY = (height / 2 - view.panY) / view.zoom;

        const id = graphHook.addNode({
          type: data.type as NodeType,
          label: data.label,
          content: data.content,
          tags: data.tags,
          position: { x: worldX + (Math.random() - 0.5) * 60, y: worldY + (Math.random() - 0.5) * 60 },
        });
        uiStore.selectNode(id);
        uiStore.setSidebarPanel('properties');
        uiStore.setSidebarOpen(true);
      } else if (nodeEditor.mode === 'edit' && nodeEditor.nodeId) {
        graphHook.updateNode(nodeEditor.nodeId, {
          label: data.label,
          type: data.type as NodeType,
          content: data.content,
          tags: data.tags,
        });
      }
      uiStore.closeNodeEditor();
      uiStore.showToast(
        nodeEditor.mode === 'create' ? 'Node created' : 'Node updated',
        'success',
      );
    },
    [graphHook, uiStore],
  );

  // ── Canvas event handlers ─────────────────────────────────────────────────

  const handleCanvasClick = useCallback(
    (_worldX: number, _worldY: number) => {
      if (uiStore.mode === 'add-node') {
        uiStore.openNodeEditor(undefined, 'create');
      }
    },
    [uiStore],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      uiStore.selectNode(nodeId);
      uiStore.setSidebarPanel('properties');
      if (!uiStore.sidebarOpen) uiStore.setSidebarOpen(true);
    },
    [uiStore],
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      uiStore.openNodeEditor(nodeId, 'edit');
    },
    [uiStore],
  );

  const handleEdgeCreate = useCallback(
    (sourceId: string, targetId: string) => {
      const id = graphHook.connectNodes(sourceId, targetId, 'relates-to' as EdgeType);
      if (id) {
        uiStore.showToast('Edge created', 'success');
      }
    },
    [graphHook, uiStore],
  );

  const handleNodeDragEnd = useCallback(
    (nodeId: string, x: number, y: number) => {
      graphHook.updateNode(nodeId, { position: { x, y } });
    },
    [graphHook],
  );

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = useCallback(
    (format: 'png' | 'svg' | 'json') => {
      const canvas = canvasRef.current;
      switch (format) {
        case 'png':
          if (canvas) exportAsPNG(canvas, `${graphHook.graph.name}.png`);
          break;
        case 'svg': {
          const view = uiStore.view;
          const w = canvas?.getBoundingClientRect().width ?? 1200;
          const h = canvas?.getBoundingClientRect().height ?? 800;
          exportAsSVG(graphHook.graph, view, w, h, `${graphHook.graph.name}.svg`);
          break;
        }
        case 'json':
          exportAsJSON(graphHook.graph, `${graphHook.graph.name}.json`);
          break;
      }
      uiStore.showToast(`Exported as ${format.toUpperCase()}`, 'success');
    },
    [graphHook, uiStore],
  );

  // ── Import Markdown ───────────────────────────────────────────────────────

  const handleImportMarkdown = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files ?? []);
      if (files.length === 0) return;

      try {
        const fileData = await Promise.all(
          files.map(async (f) => ({ content: await f.text(), filename: f.name })),
        );

        const view = uiStore.view;
        const canvasEl = canvasRef.current;
        const w = canvasEl?.getBoundingClientRect().width ?? window.innerWidth - 300;
        const h = canvasEl?.getBoundingClientRect().height ?? window.innerHeight;
        const centerX = (w / 2 - view.panX) / view.zoom;
        const centerY = (h / 2 - view.panY) / view.zoom;

        const { nodes: importedNodes, edges: importedEdges } = importFromMarkdown(
          fileData,
          centerX,
          centerY,
        );

        const idMap = new Map<string, string>();
        for (const node of importedNodes) {
          const newId = graphHook.addNode({
            type: node.type as NodeType,
            label: node.label,
            content: node.content,
            tags: node.tags,
            position: node.position,
          });
          idMap.set(node.id, newId);
        }

        for (const edge of importedEdges) {
          const src = idMap.get(edge.source);
          const tgt = idMap.get(edge.target);
          if (src && tgt) {
            graphHook.connectNodes(src, tgt, edge.type as EdgeType);
          }
        }

        uiStore.showToast(
          `Imported ${importedNodes.length} nodes from ${files.length} file${files.length !== 1 ? 's' : ''}`,
          'success',
        );
      } catch {
        uiStore.showToast('Failed to import markdown files', 'error');
      }
    };

    input.click();
  }, [graphHook, uiStore]);

  // ── Run layout ────────────────────────────────────────────────────────────

  const handleRunLayout = useCallback(
    (alg: string) => {
      const w = canvasRef.current?.getBoundingClientRect().width ?? window.innerWidth - 340;
      const h = canvasRef.current?.getBoundingClientRect().height ?? window.innerHeight - 48;
      graphHook.applyLayout(alg as Parameters<typeof graphHook.applyLayout>[0], w, h);
    },
    [graphHook],
  );

  // ── Node editor initial data ───────────────────────────────────────────────

  const editorInitialData = (() => {
    const { nodeEditor } = uiStore;
    if (nodeEditor.mode === 'edit' && nodeEditor.nodeId) {
      const node = graphHook.getNode(nodeEditor.nodeId);
      if (node) {
        return {
          label: node.label,
          type: node.type,
          content: node.content ?? '',
          tags: node.tags ?? [],
        };
      }
    }
    return undefined;
  })();

  // ── Sidebar node actions ──────────────────────────────────────────────────

  const handleSidebarNodeEdit = useCallback(
    (nodeId: string) => uiStore.openNodeEditor(nodeId, 'edit'),
    [uiStore],
  );

  const handleSidebarNodeDelete = useCallback(
    (nodeId: string) => {
      graphHook.removeNode(nodeId);
      uiStore.deselectAll();
      uiStore.showToast('Node deleted', 'info');
    },
    [graphHook, uiStore],
  );

  // ── Canvas dimensions for minimap ─────────────────────────────────────────

  const canvasWrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
  const canvasW = canvasWrapperRect?.width ?? window.innerWidth - 340;
  const canvasH = canvasWrapperRect?.height ?? window.innerHeight - 48;

  return (
    <div style={pageStyles.container}>
      {/* Left toolbar */}
      <Toolbar
        onExport={handleExport}
        onImportMarkdown={handleImportMarkdown}
        onOpenTemplates={() => uiStore.setTemplatesOpen(true)}
        onOpenAI={() => uiStore.setAISuggestionsOpen(true)}
        onOpenAnalytics={() => uiStore.setAnalyticsOpen(true)}
        onOpenSettings={() => uiStore.setSettingsOpen(true)}
        onOpenLearning={() => uiStore.setLearningModeOpen(true)}
      />

      {/* Canvas area */}
      <div style={pageStyles.canvasArea}>
        {/* Graph name bar */}
        <div style={pageStyles.topBar}>
          <button
            style={pageStyles.backBtn}
            onClick={() => onNavigate('home')}
            title="Back to home"
          >
            ← Home
          </button>
          <span style={pageStyles.graphName}>{graphHook.graph.name}</span>
          <div style={{ flex: 1 }} />
          {uiStore.focusNodeId && (
            <span style={pageStyles.focusBadge}>
              Focus Mode — press F or Escape to exit
            </span>
          )}
          {graphHook.isDirty && (
            <span style={pageStyles.dirtyBadge}>Unsaved</span>
          )}
          <button
            style={pageStyles.cmdBtn}
            onClick={() => uiStore.setCommandPaletteOpen(true)}
            title="Command Palette (⌘K)"
          >
            ⌘K
          </button>
        </div>

        {/* Canvas */}
        <div style={pageStyles.canvasWrapper} ref={canvasWrapperRef}>
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onCanvasClick={handleCanvasClick}
            onEdgeCreate={handleEdgeCreate}
            onNodeDragEnd={handleNodeDragEnd}
          />
          <CollaborationPanel />

          {/* Minimap */}
          <Minimap
            nodes={nodes}
            canvasWidth={canvasW}
            canvasHeight={canvasH}
            visible={uiStore.minimapVisible}
          />

          {/* Analytics panel (floating) */}
          {uiStore.analyticsOpen && (
            <AnalyticsPanel onClose={() => uiStore.setAnalyticsOpen(false)} />
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <Sidebar
        onNodeSelect={handleNodeClick}
        onNodeEdit={handleSidebarNodeEdit}
        onNodeDelete={handleSidebarNodeDelete}
      />

      {/* Node editor slide-over */}
      {uiStore.nodeEditor.isOpen && (
        <NodeEditor
          mode={uiStore.nodeEditor.mode}
          initialData={editorInitialData}
          onSave={handleNodeEditorSave}
          onCancel={uiStore.closeNodeEditor}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={uiStore.commandPaletteOpen}
        onClose={() => uiStore.setCommandPaletteOpen(false)}
        onOpenTemplates={() => uiStore.setTemplatesOpen(true)}
        onOpenSettings={() => uiStore.setSettingsOpen(true)}
        onOpenLearning={() => uiStore.setLearningModeOpen(true)}
        onOpenAnalytics={() => uiStore.setAnalyticsOpen(true)}
        onExport={handleExport}
        onRunLayout={handleRunLayout}
      />

      {/* Learning Mode */}
      {uiStore.learningModeOpen && (
        <LearningMode onClose={() => uiStore.setLearningModeOpen(false)} />
      )}

      {/* Templates */}
      {uiStore.templatesOpen && (
        <Templates onClose={() => uiStore.setTemplatesOpen(false)} />
      )}

      {/* AI Suggestions */}
      {uiStore.aiSuggestionsOpen && (
        <AISuggestions
          onClose={() => uiStore.setAISuggestionsOpen(false)}
          onOpenSettings={() => { uiStore.setAISuggestionsOpen(false); uiStore.setSettingsOpen(true); }}
        />
      )}

      {/* Settings */}
      {uiStore.settingsOpen && (
        <Settings onClose={() => uiStore.setSettingsOpen(false)} />
      )}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

// ─── Toast notifications ──────────────────────────────────────────────────────

const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  const TOAST_COLORS: Record<string, string> = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#eab308',
    info: '#3b82f6',
  };

  return (
    <div style={toastStyles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} style={toastStyles.toast}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: TOAST_COLORS[toast.type] ?? '#3b82f6',
              flexShrink: 0,
            }}
          />
          <span style={toastStyles.message}>{toast.message}</span>
          <button style={toastStyles.dismiss} onClick={() => dismissToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100dvh',
    overflow: 'hidden',
    background: '#0f1117',
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 16px',
    background: '#161b27',
    borderBottom: '1px solid #1e2535',
    flexShrink: 0,
    zIndex: 10,
  },
  backBtn: {
    padding: '4px 10px',
    background: 'transparent',
    border: '1px solid #2d3748',
    borderRadius: 6,
    color: '#94a3b8',
    fontSize: 12,
    cursor: 'pointer',
  },
  graphName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f1f5f9',
  },
  dirtyBadge: {
    fontSize: 11,
    color: '#eab308',
    background: 'rgba(234, 179, 8, 0.1)',
    padding: '2px 8px',
    borderRadius: 9999,
    border: '1px solid rgba(234, 179, 8, 0.2)',
  },
  focusBadge: {
    fontSize: 11,
    color: '#a855f7',
    background: 'rgba(168, 85, 247, 0.1)',
    padding: '2px 10px',
    borderRadius: 9999,
    border: '1px solid rgba(168, 85, 247, 0.2)',
  },
  cmdBtn: {
    padding: '3px 8px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 6,
    color: '#6366f1',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 600,
  },
  canvasWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
};

const toastStyles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 500,
    pointerEvents: 'none',
    alignItems: 'center',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#252d3d',
    border: '1px solid #2d3748',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    pointerEvents: 'all',
    minWidth: 200,
    maxWidth: 360,
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: '#f1f5f9',
  },
  dismiss: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 16,
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
  },
};
