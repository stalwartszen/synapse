import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUIStore } from '../../store/uiStore.js';
import { useGraph } from '../../hooks/useGraph.js';
import styles from './CommandPalette.module.css';

interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  group: 'commands' | 'nodes';
  action: () => void;
  icon: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTemplates: () => void;
  onOpenSettings: () => void;
  onOpenLearning: () => void;
  onOpenAnalytics: () => void;
  onExport: (format: 'png' | 'svg' | 'json') => void;
  onRunLayout: (alg: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenTemplates,
  onOpenSettings,
  onOpenLearning,
  onOpenAnalytics,
  onExport,
  onRunLayout,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const uiStore = useUIStore();
  const graph = useGraph();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const nodeCommands: Command[] = useMemo(() => {
    return graph.nodes.map((node) => ({
      id: `node:${node.id}`,
      label: node.label,
      description: node.type,
      group: 'nodes' as const,
      icon: NODE_ICONS[node.type] ?? '●',
      action: () => {
        uiStore.selectNode(node.id);
        uiStore.setSidebarPanel('properties');
        uiStore.setSidebarOpen(true);
        onClose();
      },
    }));
  }, [graph.nodes, uiStore, onClose]);

  const staticCommands: Command[] = useMemo(() => [
    {
      id: 'cmd:add-node',
      label: 'Add Node',
      shortcut: 'N',
      group: 'commands',
      icon: '+',
      action: () => { uiStore.setMode('add-node'); uiStore.openNodeEditor(undefined, 'create'); onClose(); },
    },
    {
      id: 'cmd:layout-force',
      label: 'Layout: Force-Directed',
      group: 'commands',
      icon: '⟳',
      action: () => { onRunLayout('force'); onClose(); },
    },
    {
      id: 'cmd:layout-circular',
      label: 'Layout: Circular',
      group: 'commands',
      icon: '○',
      action: () => { onRunLayout('circular'); onClose(); },
    },
    {
      id: 'cmd:layout-hierarchical',
      label: 'Layout: Hierarchical',
      group: 'commands',
      icon: '⊤',
      action: () => { onRunLayout('hierarchical'); onClose(); },
    },
    {
      id: 'cmd:layout-grid',
      label: 'Layout: Grid',
      group: 'commands',
      icon: '⊞',
      action: () => { onRunLayout('grid'); onClose(); },
    },
    {
      id: 'cmd:export-png',
      label: 'Export PNG',
      group: 'commands',
      icon: '↓',
      action: () => { onExport('png'); onClose(); },
    },
    {
      id: 'cmd:export-json',
      label: 'Export JSON',
      group: 'commands',
      icon: '↓',
      action: () => { onExport('json'); onClose(); },
    },
    {
      id: 'cmd:learning',
      label: 'Enter Learning Mode',
      shortcut: 'L',
      group: 'commands',
      icon: '📖',
      action: () => { onOpenLearning(); onClose(); },
    },
    {
      id: 'cmd:templates',
      label: 'New from Template',
      shortcut: 'T',
      group: 'commands',
      icon: '⊡',
      action: () => { onOpenTemplates(); onClose(); },
    },
    {
      id: 'cmd:analytics',
      label: 'View Analytics',
      group: 'commands',
      icon: '📊',
      action: () => { onOpenAnalytics(); onClose(); },
    },
    {
      id: 'cmd:fit-view',
      label: 'Fit to View',
      group: 'commands',
      icon: '⤢',
      action: () => { uiStore.resetView(); onClose(); },
    },
    {
      id: 'cmd:clear',
      label: 'Clear Graph',
      group: 'commands',
      icon: '✕',
      action: () => { graph.clearGraph(); onClose(); },
    },
    {
      id: 'cmd:settings',
      label: 'Open Settings',
      shortcut: ',',
      group: 'commands',
      icon: '⚙',
      action: () => { onOpenSettings(); onClose(); },
    },
    {
      id: 'cmd:undo',
      label: 'Undo',
      shortcut: '⌘Z',
      group: 'commands',
      icon: '↩',
      action: () => { graph.undo(); onClose(); },
    },
    {
      id: 'cmd:redo',
      label: 'Redo',
      shortcut: '⌘⇧Z',
      group: 'commands',
      icon: '↪',
      action: () => { graph.redo(); onClose(); },
    },
  ], [uiStore, graph, onClose, onRunLayout, onExport, onOpenLearning, onOpenTemplates, onOpenAnalytics, onOpenSettings]);

  const allCommands = useMemo(() => [...staticCommands, ...nodeCommands], [staticCommands, nodeCommands]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allCommands.slice(0, 20);
    return allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q),
    ).slice(0, 20);
  }, [query, allCommands]);

  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    for (const cmd of filtered) {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group]!.push(cmd);
    }
    return groups;
  }, [filtered]);

  const flatFiltered = filtered;

  const execute = useCallback(
    (cmd: Command) => {
      cmd.action();
    },
    [],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = flatFiltered[selectedIndex];
        if (cmd) execute(cmd);
      }
    },
    [flatFiltered, selectedIndex, onClose, execute],
  );

  // Scroll selected item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const item = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.palette} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className={styles.inputRow}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search nodes or run a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className={styles.escBadge}>ESC</kbd>
        </div>

        <div className={styles.list} ref={listRef}>
          {flatFiltered.length === 0 && (
            <div className={styles.empty}>No results for "{query}"</div>
          )}

          {(['commands', 'nodes'] as const).map((group) => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group}>
                <div className={styles.groupHeader}>
                  {group === 'commands' ? 'Commands' : 'Nodes'}
                </div>
                {items.map((cmd) => {
                  const idx = globalIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                      data-index={idx}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className={styles.icon}>{cmd.icon}</span>
                      <span className={styles.label}>{cmd.label}</span>
                      {cmd.description && (
                        <span className={styles.description}>{cmd.description}</span>
                      )}
                      {cmd.shortcut && (
                        <kbd className={styles.shortcut}>{cmd.shortcut}</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const NODE_ICONS: Record<string, string> = {
  concept: '💡',
  resource: '📚',
  question: '?',
  insight: '★',
  custom: '●',
};
