import React, { useCallback } from 'react';
import { useGraph } from '../../hooks/useGraph.js';
import { useUIStore } from '../../store/uiStore.js';
import { templates } from '../../data/templates.js';
import type { NodeType, EdgeType } from '@synapse/core';
import styles from './Templates.module.css';

interface TemplatesProps {
  onClose: () => void;
}

export const Templates: React.FC<TemplatesProps> = ({ onClose }) => {
  const graph = useGraph();
  const uiStore = useUIStore();

  const handleSelect = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      // Calculate center of current view
      const canvasW = window.innerWidth - 340; // approx canvas width
      const canvasH = window.innerHeight - 48;
      const view = uiStore.view;
      const centerX = (canvasW / 2 - view.panX) / view.zoom;
      const centerY = (canvasH / 2 - view.panY) / view.zoom;

      const { nodes, edges } = template.create(centerX, centerY);

      // Add nodes
      const idMap = new Map<string, string>();
      for (const node of nodes) {
        const newId = graph.addNode({
          type: node.type as NodeType,
          label: node.label,
          content: node.content,
          tags: node.tags,
          position: node.position,
        });
        idMap.set(node.id, newId);
      }

      // Add edges (with remapped IDs)
      for (const edge of edges) {
        const realSource = idMap.get(edge.source);
        const realTarget = idMap.get(edge.target);
        if (realSource && realTarget) {
          const edgeId = graph.connectNodes(realSource, realTarget, edge.type as EdgeType);
          if (edgeId && edge.label) {
            graph.updateEdge(edgeId, { label: edge.label });
          }
        }
      }

      uiStore.showToast(`Template "${template.name}" added`, 'success');
      onClose();
    },
    [graph, uiStore, onClose],
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Templates</h2>
            <p className={styles.subtitle}>Choose a starting template to add to your graph</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.grid}>
          {templates.map((template) => (
            <button
              key={template.id}
              className={styles.templateCard}
              onClick={() => handleSelect(template.id)}
            >
              <div className={styles.templateIcon}>{template.icon}</div>
              <div className={styles.templateInfo}>
                <div className={styles.templateName}>{template.name}</div>
                <div className={styles.templateDesc}>{template.description}</div>
                <div className={styles.templateMeta}>{template.nodeCount} nodes</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
