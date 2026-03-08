import React, { useMemo, useCallback } from 'react';
import { useGraph } from '../../hooks/useGraph.js';
import { useUIStore } from '../../store/uiStore.js';
import {
  computeDegree,
  findOrphans,
  getConnectedComponents,
  getNodeTypeBreakdown,
  getTopNodesByDegree,
  getAverageDegree,
} from '../../utils/analytics.js';
import styles from './AnalyticsPanel.module.css';

interface AnalyticsPanelProps {
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  concept: '#3b82f6',
  resource: '#22c55e',
  question: '#eab308',
  insight: '#a855f7',
  custom: '#f97316',
};

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ onClose }) => {
  const graph = useGraph();
  const uiStore = useUIStore();

  const analytics = useMemo(() => {
    const g = graph.graph;
    const degrees = computeDegree(g);
    const orphanIds = findOrphans(g);
    const components = getConnectedComponents(g);
    const typeBreakdown = getNodeTypeBreakdown(g);
    const topNodes = getTopNodesByDegree(g, 5);
    const avgDegree = getAverageDegree(g);

    const maxDegree = Math.max(...Array.from(degrees.values()), 1);
    const biggestComponent = components.reduce((max, c) => (c.size > max ? c.size : max), 0);

    return {
      nodeCount: g.nodes.size,
      edgeCount: g.edges.size,
      avgDegree: avgDegree.toFixed(2),
      componentCount: components.length,
      biggestComponent,
      orphanIds,
      orphanNodes: orphanIds.map((id) => g.nodes.get(id)).filter(Boolean),
      typeBreakdown,
      topNodes,
      maxDegree,
    };
  }, [graph.graph]);

  const handleOrphanClick = useCallback(
    (nodeId: string) => {
      uiStore.selectNode(nodeId);
      uiStore.setSidebarPanel('properties');
      uiStore.setSidebarOpen(true);
    },
    [uiStore],
  );

  const totalTypes = Object.values(analytics.typeBreakdown).reduce((s, c) => s + c, 0) || 1;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Graph Analytics</span>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div className={styles.content}>
        {/* Overview */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Overview</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{analytics.nodeCount}</div>
              <div className={styles.statLabel}>Nodes</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{analytics.edgeCount}</div>
              <div className={styles.statLabel}>Edges</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{analytics.componentCount}</div>
              <div className={styles.statLabel}>Components</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{analytics.avgDegree}</div>
              <div className={styles.statLabel}>Avg Degree</div>
            </div>
          </div>
        </section>

        {/* Top nodes by degree */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Most Connected Nodes</h3>
          {analytics.topNodes.length === 0 ? (
            <p className={styles.empty}>No nodes yet</p>
          ) : (
            <div className={styles.barList}>
              {analytics.topNodes.map(({ node, degree }) => {
                const pct = analytics.maxDegree > 0 ? (degree / analytics.maxDegree) * 100 : 0;
                const color = TYPE_COLORS[node.type] ?? '#6366f1';
                return (
                  <div
                    key={node.id}
                    className={styles.barRow}
                    onClick={() => handleOrphanClick(node.id)}
                    title={`${node.label} — degree ${degree}`}
                  >
                    <span className={styles.barLabel}>{node.label}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.bar}
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className={styles.barValue}>{degree}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Orphan nodes */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Orphan Nodes
            <span className={styles.badge}>{analytics.orphanIds.length}</span>
          </h3>
          {analytics.orphanIds.length === 0 ? (
            <p className={styles.good}>All nodes are connected!</p>
          ) : (
            <div className={styles.orphanList}>
              {analytics.orphanNodes.map((node) => {
                if (!node) return null;
                const color = TYPE_COLORS[node.type] ?? '#6366f1';
                return (
                  <button
                    key={node.id}
                    className={styles.orphanItem}
                    onClick={() => handleOrphanClick(node.id)}
                  >
                    <span className={styles.dot} style={{ background: color }} />
                    <span className={styles.orphanLabel}>{node.label}</span>
                    <span className={styles.orphanType}>{node.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Clusters */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Connected Components</h3>
          <div className={styles.clusterInfo}>
            <div className={styles.clusterStat}>
              <span className={styles.clusterLabel}>Total components</span>
              <span className={styles.clusterVal}>{analytics.componentCount}</span>
            </div>
            <div className={styles.clusterStat}>
              <span className={styles.clusterLabel}>Largest component</span>
              <span className={styles.clusterVal}>{analytics.biggestComponent} nodes</span>
            </div>
            <div className={styles.clusterStat}>
              <span className={styles.clusterLabel}>Isolated nodes</span>
              <span className={styles.clusterVal}>{analytics.orphanIds.length}</span>
            </div>
          </div>
        </section>

        {/* Node type breakdown */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Node Types</h3>
          <div className={styles.typeList}>
            {Object.entries(analytics.typeBreakdown).map(([type, count]) => {
              if (count === 0) return null;
              const pct = (count / totalTypes) * 100;
              const color = TYPE_COLORS[type] ?? '#6366f1';
              return (
                <div key={type} className={styles.typeRow}>
                  <span className={styles.typeDot} style={{ background: color }} />
                  <span className={styles.typeLabel}>{type}</span>
                  <div className={styles.typeBarTrack}>
                    <div
                      className={styles.typeBar}
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className={styles.typeCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
