import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Icon } from '@synapse/ui';
import { useUIStore } from '../../store/uiStore.js';
import { useGraph } from '../../hooks/useGraph.js';
import type { EditorMode, LayoutAlgorithm } from '../../types/index.js';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  onAddNode?: () => void;
  onExport?: (format: 'png' | 'svg' | 'json') => void;
  onImportMarkdown?: () => void;
  onOpenTemplates?: () => void;
  onOpenAI?: () => void;
  onOpenAnalytics?: () => void;
  onOpenSettings?: () => void;
  onOpenLearning?: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

const LAYOUT_OPTIONS: Array<{ id: LayoutAlgorithm; label: string; icon: React.ReactNode }> = [
  { id: 'force', label: 'Force-Directed', icon: <Icon name="force-layout" size={14} /> },
  { id: 'circular', label: 'Circular', icon: <Icon name="circle-layout" size={14} /> },
  { id: 'hierarchical', label: 'Hierarchical', icon: <Icon name="hierarchy" size={14} /> },
  { id: 'grid', label: 'Grid', icon: <Icon name="grid" size={14} /> },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  onExport,
  onImportMarkdown,
  onOpenTemplates,
  onOpenAI,
  onOpenAnalytics,
  onOpenSettings,
  onOpenLearning,
}) => {
  const uiStore = useUIStore();
  const graph = useGraph();
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const mode = uiStore.mode;

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setShowLayoutMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Skip if modifiers are held (those are handled in GraphPage)
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) graph.redo();
            else graph.undo();
            break;
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
        case 'escape':
          uiStore.setMode('select');
          break;
        case 'n':
          uiStore.setMode('add-node');
          break;
        case 'e':
          uiStore.setMode('add-edge');
          break;
        case 'delete':
        case 'backspace': {
          const selNodes = Array.from(uiStore.selectedNodeIds);
          if (selNodes.length > 0) {
            for (const id of selNodes) graph.removeNode(id);
            uiStore.deselectAll();
          } else if (uiStore.selectedEdgeId) {
            graph.removeEdge(uiStore.selectedEdgeId);
            uiStore.deselectAll();
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [uiStore, graph]);

  const setMode = useCallback(
    (m: EditorMode) => {
      uiStore.setMode(m);
    },
    [uiStore],
  );

  const handleLayout = useCallback(
    (alg: LayoutAlgorithm) => {
      setShowLayoutMenu(false);
      graph.applyLayout(alg, window.innerWidth - 300, window.innerHeight - 100);
    },
    [graph],
  );

  const canUndo = graph.canUndo;
  const canRedo = graph.canRedo;

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Graph tools">
      {/* Logo */}
      <div className={styles.logo} title="Synapse">
        <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="8" fill="#6366f1" />
          <circle cx="14" cy="18" r="5" fill="#3b82f6" opacity="0.8" />
          <circle cx="50" cy="18" r="5" fill="#22c55e" opacity="0.8" />
          <circle cx="14" cy="46" r="5" fill="#eab308" opacity="0.8" />
          <circle cx="50" cy="46" r="5" fill="#a855f7" opacity="0.8" />
          <line x1="19" y1="22" x2="26" y2="28" stroke="#4a5568" strokeWidth="2" />
          <line x1="45" y1="22" x2="38" y2="28" stroke="#4a5568" strokeWidth="2" />
          <line x1="19" y1="43" x2="26" y2="37" stroke="#4a5568" strokeWidth="2" />
          <line x1="45" y1="43" x2="38" y2="37" stroke="#4a5568" strokeWidth="2" />
        </svg>
      </div>

      <div className={styles.divider} />

      {/* Mode tools */}
      <div className={styles.toolGroup}>
        <button
          className={`${styles.toolBtn} ${mode === 'select' ? styles.active : ''}`}
          onClick={() => setMode('select')}
          data-tooltip="Select (V)"
          aria-label="Select tool"
          aria-pressed={mode === 'select'}
        >
          <Icon name="cursor" size={16} />
        </button>

        <button
          className={`${styles.toolBtn} ${mode === 'add-node' ? styles.active : ''}`}
          onClick={() => {
            setMode('add-node');
            onAddNode?.();
          }}
          data-tooltip="Add Node (N)"
          aria-label="Add node tool"
          aria-pressed={mode === 'add-node'}
        >
          <Icon name="plus-node" size={16} />
        </button>

        <button
          className={`${styles.toolBtn} ${mode === 'add-edge' ? styles.active : ''}`}
          onClick={() => setMode('add-edge')}
          data-tooltip="Add Edge (E)"
          aria-label="Add edge tool"
          aria-pressed={mode === 'add-edge'}
        >
          <Icon name="plus-edge" size={16} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* View tools */}
      <div className={styles.toolGroup}>
        <button
          className={styles.toolBtn}
          onClick={() => uiStore.setView({ zoom: Math.min(5, uiStore.view.zoom * 1.2) })}
          data-tooltip="Zoom In"
          aria-label="Zoom in"
        >
          <Icon name="zoom-in" size={16} />
        </button>

        <button
          className={styles.toolBtn}
          onClick={() => uiStore.setView({ zoom: Math.max(0.05, uiStore.view.zoom / 1.2) })}
          data-tooltip="Zoom Out"
          aria-label="Zoom out"
        >
          <Icon name="zoom-out" size={16} />
        </button>

        <button
          className={styles.toolBtn}
          onClick={() => uiStore.resetView()}
          data-tooltip="Reset View"
          aria-label="Reset view"
        >
          <Icon name="zoom-fit" size={16} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* History */}
      <div className={styles.toolGroup}>
        <button
          className={styles.toolBtn}
          onClick={graph.undo}
          disabled={!canUndo}
          data-tooltip="Undo (⌘Z)"
          aria-label="Undo"
        >
          <Icon name="undo" size={16} />
        </button>

        <button
          className={styles.toolBtn}
          onClick={graph.redo}
          disabled={!canRedo}
          data-tooltip="Redo (⌘⇧Z)"
          aria-label="Redo"
        >
          <Icon name="redo" size={16} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Layout */}
      <div className={styles.menuWrapper} ref={layoutMenuRef}>
        <button
          className={`${styles.toolBtn} ${showLayoutMenu ? styles.active : ''}`}
          onClick={() => setShowLayoutMenu((v) => !v)}
          data-tooltip="Layout"
          aria-label="Layout algorithms"
          aria-expanded={showLayoutMenu}
        >
          <Icon name="layout" size={16} />
        </button>

        {showLayoutMenu && (
          <div className={styles.layoutMenu}>
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={styles.layoutMenuItem}
                onClick={() => handleLayout(opt.id)}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* Templates */}
      <button
        className={styles.toolBtn}
        onClick={onOpenTemplates}
        data-tooltip="Templates (T)"
        aria-label="Templates"
        title="Templates (T)"
      >
        <TemplateIcon />
      </button>

      {/* AI Suggestions */}
      <button
        className={styles.toolBtn}
        onClick={onOpenAI}
        data-tooltip="AI Suggestions (A)"
        aria-label="AI Suggestions"
        title="AI Suggestions (A)"
      >
        <SparkleIcon />
      </button>

      {/* Analytics */}
      <button
        className={styles.toolBtn}
        onClick={onOpenAnalytics}
        data-tooltip="Analytics"
        aria-label="Analytics"
        title="Analytics"
      >
        <AnalyticsIcon />
      </button>

      {/* Study / Learning */}
      <button
        className={styles.toolBtn}
        onClick={onOpenLearning}
        data-tooltip="Study Mode (L)"
        aria-label="Learning mode"
        title="Study Mode (L)"
      >
        <StudyIcon />
      </button>

      <div className={styles.spacer} />

      {/* Import Markdown */}
      <button
        className={styles.toolBtn}
        onClick={onImportMarkdown}
        data-tooltip="Import Markdown"
        aria-label="Import from Markdown"
        title="Import Markdown files"
      >
        <ImportIcon />
      </button>

      {/* Export */}
      <div className={styles.menuWrapper} ref={exportMenuRef}>
        <button
          className={`${styles.toolBtn} ${showExportMenu ? styles.active : ''}`}
          onClick={() => setShowExportMenu((v) => !v)}
          data-tooltip="Export"
          aria-label="Export graph"
          aria-expanded={showExportMenu}
        >
          <Icon name="export" size={16} />
        </button>

        {showExportMenu && (
          <div className={styles.exportMenu}>
            <button
              className={styles.exportMenuItem}
              onClick={() => { setShowExportMenu(false); onExport?.('png'); }}
            >
              <Icon name="image" size={14} /> Export PNG
            </button>
            <button
              className={styles.exportMenuItem}
              onClick={() => { setShowExportMenu(false); onExport?.('svg'); }}
            >
              <Icon name="file-json" size={14} /> Export SVG
            </button>
            <button
              className={styles.exportMenuItem}
              onClick={() => { setShowExportMenu(false); onExport?.('json'); }}
            >
              <Icon name="file-json" size={14} /> Export JSON
            </button>
          </div>
        )}
      </div>

      {/* Settings */}
      <button
        className={styles.toolBtn}
        onClick={onOpenSettings}
        data-tooltip="Settings (,)"
        aria-label="Settings"
        title="Settings (,)"
      >
        <Icon name="settings" size={16} />
      </button>
    </div>
  );
};

// ── Inline SVG icons for new features ────────────────────────────────────────

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.5l-6.2 4.4 2.4-7.2L2 9.2h7.6z" />
  </svg>
);

const TemplateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
  </svg>
);

const StudyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    <line x1="9" y1="7" x2="15" y2="7" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </svg>
);

const ImportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 16V4M8 12l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20h16" strokeLinecap="round" />
  </svg>
);
