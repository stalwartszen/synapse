import React, { useState, useMemo } from 'react';
import { Icon } from '@synapse/ui';
import { useUIStore } from '../../store/uiStore.js';
import { useGraph } from '../../hooks/useGraph.js';
import type { GraphNode, GraphEdge } from '@synapse/core';
import styles from './Sidebar.module.css';

const NODE_COLORS: Record<string, string> = {
  concept: '#3b82f6',
  resource: '#22c55e',
  question: '#eab308',
  insight: '#a855f7',
  custom: '#f97316',
};

interface SidebarProps {
  onNodeSelect?: (nodeId: string) => void;
  onNodeEdit?: (nodeId: string) => void;
  onNodeDelete?: (nodeId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
}) => {
  const uiStore = useUIStore();
  const graph = useGraph();
  const [searchQuery, setSearchQuery] = useState('');

  const isCollapsed = !uiStore.sidebarOpen;
  const activePanel = uiStore.sidebarPanel;

  const nodes = graph.nodes;

  const selectedNodeId = Array.from(uiStore.selectedNodeIds)[0] ?? null;
  const selectedNode = selectedNodeId ? graph.getNode(selectedNodeId) : null;
  const selectedEdgeId = uiStore.selectedEdgeId;
  const selectedEdge = selectedEdgeId ? graph.getEdge(selectedEdgeId) : null;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [nodes, searchQuery]);

  const nodeEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return graph.getEdgesForNode(selectedNodeId);
  }, [selectedNodeId, graph]);

  if (isCollapsed) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <button
          className={`${styles.tab} ${activePanel === 'nodes' ? styles.activeTab : ''}`}
          onClick={() => uiStore.setSidebarPanel('nodes')}
          title="Node list"
        >
          <Icon name="brain" size={12} />
          Nodes
        </button>
        <button
          className={`${styles.tab} ${activePanel === 'search' ? styles.activeTab : ''}`}
          onClick={() => uiStore.setSidebarPanel('search')}
          title="Search"
        >
          <Icon name="search" size={12} />
          Search
        </button>
        <button
          className={`${styles.tab} ${activePanel === 'properties' ? styles.activeTab : ''}`}
          onClick={() => uiStore.setSidebarPanel('properties')}
          title="Properties"
        >
          <Icon name="settings" size={12} />
          Info
        </button>
      </div>

      <div className={styles.content}>
        {activePanel === 'nodes' && (
          <NodeListPanel
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelect={(id) => {
              uiStore.selectNode(id);
              onNodeSelect?.(id);
            }}
          />
        )}

        {activePanel === 'search' && (
          <SearchPanel
            query={searchQuery}
            onQueryChange={setSearchQuery}
            results={searchResults}
            onResultClick={(id) => {
              uiStore.selectNode(id);
              uiStore.setSidebarPanel('properties');
              onNodeSelect?.(id);
            }}
          />
        )}

        {activePanel === 'properties' && (
          <PropertiesPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            nodeEdges={nodeEdges}
            allNodes={nodes}
            onEdit={(id) => onNodeEdit?.(id)}
            onDelete={(id) => onNodeDelete?.(id)}
          />
        )}
      </div>
    </aside>
  );
};

// ─── Node list ─────────────────────────────────────────────────────────────────

const NodeListPanel: React.FC<{
  nodes: GraphNode[];
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
}> = ({ nodes, selectedNodeId, onSelect }) => (
  <div className={styles.nodesPanel}>
    {nodes.length === 0 ? (
      <div className={styles.noResults}>No nodes yet</div>
    ) : (
      nodes.map((node) => (
        <button
          key={node.id}
          className={`${styles.nodeItem} ${selectedNodeId === node.id ? styles.selectedNode : ''}`}
          onClick={() => onSelect(node.id)}
        >
          <span
            className={styles.nodeDot}
            style={{ background: NODE_COLORS[node.type] ?? '#6366f1' }}
          />
          <span className={styles.nodeItemLabel}>{node.label}</span>
          <span className={styles.nodeItemType}>{node.type}</span>
        </button>
      ))
    )}
  </div>
);

// ─── Search ────────────────────────────────────────────────────────────────────

const SearchPanel: React.FC<{
  query: string;
  onQueryChange: (q: string) => void;
  results: GraphNode[];
  onResultClick: (id: string) => void;
}> = ({ query, onQueryChange, results, onResultClick }) => (
  <div className={styles.searchPanel}>
    <input
      type="search"
      className={styles.searchInput}
      placeholder="Search nodes…"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      autoFocus
    />
    <div className={styles.searchResults}>
      {query.trim() && results.length === 0 && (
        <div className={styles.noResults}>No results for "{query}"</div>
      )}
      {results.map((node) => (
        <button
          key={node.id}
          className={styles.searchResult}
          onClick={() => onResultClick(node.id)}
        >
          <span
            className={styles.nodeDot}
            style={{ background: NODE_COLORS[node.type] ?? '#6366f1' }}
          />
          <span className={styles.resultLabel}>{node.label}</span>
          <span className={styles.nodeItemType}>{node.type}</span>
        </button>
      ))}
    </div>
  </div>
);

// ─── Properties ────────────────────────────────────────────────────────────────

const PropertiesPanel: React.FC<{
  selectedNode: GraphNode | null | undefined;
  selectedEdge: GraphEdge | null | undefined;
  nodeEdges: GraphEdge[];
  allNodes: GraphNode[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ selectedNode, selectedEdge, nodeEdges, allNodes, onEdit, onDelete }) => {
  if (!selectedNode && !selectedEdge) {
    return (
      <div className={styles.propertiesPanel}>
        <div className={styles.emptyProperties}>
          <Icon name="cursor" size={20} />
          <p style={{ marginTop: 8 }}>Select a node or edge to see its properties</p>
        </div>
      </div>
    );
  }

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  if (selectedNode) {
    const color = NODE_COLORS[selectedNode.type] ?? '#6366f1';
    return (
      <div className={styles.propertiesPanel}>
        <div className={styles.propertyGroup}>
          <div className={styles.propertyLabel}>Label</div>
          <div className={styles.propertyValue} style={{ color: '#f1f5f9', fontWeight: 500 }}>
            {selectedNode.label}
          </div>
        </div>

        <div className={styles.propertyGroup}>
          <div className={styles.propertyLabel}>Type</div>
          <span
            className={styles.propBadge}
            style={{
              background: `${color}20`,
              color,
              border: `1px solid ${color}40`,
            }}
          >
            {selectedNode.type}
          </span>
        </div>

        {selectedNode.tags && selectedNode.tags.length > 0 && (
          <div className={styles.propertyGroup}>
            <div className={styles.propertyLabel}>Tags</div>
            <div>
              {selectedNode.tags.map((tag) => (
                <span
                  key={tag}
                  className={styles.propBadge}
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border-default)',
                  }}
                >
                  # {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedNode.content && (
          <div className={styles.propertyGroup}>
            <div className={styles.propertyLabel}>Content</div>
            <div className={styles.propertyValue} style={{ fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
              {selectedNode.content.slice(0, 300)}
              {selectedNode.content.length > 300 ? '…' : ''}
            </div>
          </div>
        )}

        {nodeEdges.length > 0 && (
          <div className={styles.propertyGroup}>
            <div className={styles.propertyLabel}>Connections ({nodeEdges.length})</div>
            <div className={styles.edgesSection}>
              {nodeEdges.slice(0, 8).map((edge) => {
                const other = edge.source === selectedNode.id
                  ? nodeMap.get(edge.target)
                  : nodeMap.get(edge.source);
                const dir = edge.source === selectedNode.id ? '→' : '←';
                return (
                  <div key={edge.id} className={styles.edgeEntry}>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>{dir}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {other?.label ?? 'Unknown'}
                    </span>
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}>{edge.type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.actionRow}>
          <button className={styles.actionBtn} onClick={() => onEdit(selectedNode.id)}>
            <Icon name="edit" size={12} /> Edit
          </button>
          <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => onDelete(selectedNode.id)}>
            <Icon name="trash" size={12} /> Delete
          </button>
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    const source = nodeMap.get(selectedEdge.source);
    const target = nodeMap.get(selectedEdge.target);
    return (
      <div className={styles.propertiesPanel}>
        <div className={styles.propertyGroup}>
          <div className={styles.propertyLabel}>Edge Type</div>
          <div className={styles.propertyValue}>{selectedEdge.type}</div>
        </div>
        <div className={styles.propertyGroup}>
          <div className={styles.propertyLabel}>From</div>
          <div className={styles.propertyValue}>{source?.label ?? selectedEdge.source}</div>
        </div>
        <div className={styles.propertyGroup}>
          <div className={styles.propertyLabel}>To</div>
          <div className={styles.propertyValue}>{target?.label ?? selectedEdge.target}</div>
        </div>
        {selectedEdge.label && (
          <div className={styles.propertyGroup}>
            <div className={styles.propertyLabel}>Label</div>
            <div className={styles.propertyValue}>{selectedEdge.label}</div>
          </div>
        )}
        {selectedEdge.weight !== undefined && (
          <div className={styles.propertyGroup}>
            <div className={styles.propertyLabel}>Weight</div>
            <div className={styles.propertyValue}>{selectedEdge.weight.toFixed(2)}</div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
