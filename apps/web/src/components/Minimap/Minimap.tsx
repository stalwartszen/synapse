import React, { useRef, useEffect, useCallback } from 'react';
import { useUIStore } from '../../store/uiStore.js';
import type { GraphNode } from '@synapse/core';
import type { GraphView } from '../../types/index.js';
import styles from './Minimap.module.css';

const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 120;
const PADDING = 16;

const NODE_COLORS: Record<string, string> = {
  concept: '#3b82f6',
  resource: '#22c55e',
  question: '#eab308',
  insight: '#a855f7',
  custom: '#f97316',
};

interface MinimapProps {
  nodes: GraphNode[];
  canvasWidth: number;
  canvasHeight: number;
  visible: boolean;
}

export const Minimap: React.FC<MinimapProps> = ({ nodes, canvasWidth, canvasHeight, visible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiStore = useUIStore();
  const view = uiStore.view;
  const isDragging = useRef(false);

  const getGraphBounds = useCallback(() => {
    if (nodes.length === 0) {
      return { minX: -200, minY: -150, maxX: 200, maxY: 150 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
    }
    // Add padding around bounds
    const pw = Math.max(80, (maxX - minX) * 0.15);
    const ph = Math.max(60, (maxY - minY) * 0.15);
    return { minX: minX - pw, minY: minY - ph, maxX: maxX + pw, maxY: maxY + ph };
  }, [nodes]);

  const worldToMinimap = useCallback(
    (wx: number, wy: number, bounds: ReturnType<typeof getGraphBounds>) => {
      const graphW = bounds.maxX - bounds.minX || 1;
      const graphH = bounds.maxY - bounds.minY || 1;
      return {
        x: ((wx - bounds.minX) / graphW) * (MINIMAP_WIDTH - PADDING * 2) + PADDING,
        y: ((wy - bounds.minY) / graphH) * (MINIMAP_HEIGHT - PADDING * 2) + PADDING,
      };
    },
    [],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Background
    ctx.fillStyle = 'rgba(15, 17, 23, 0.92)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT, 8);
    } else {
      ctx.rect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    }
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const bounds = getGraphBounds();

    // Draw nodes as dots
    for (const node of nodes) {
      const { x, y } = worldToMinimap(node.position.x, node.position.y, bounds);
      const color = NODE_COLORS[node.type] ?? '#6366f1';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Draw viewport rectangle
    // The viewport in world coords is the visible area
    const vpMinX = (0 - view.panX) / view.zoom;
    const vpMinY = (0 - view.panY) / view.zoom;
    const vpMaxX = (canvasWidth - view.panX) / view.zoom;
    const vpMaxY = (canvasHeight - view.panY) / view.zoom;

    const vpTopLeft = worldToMinimap(vpMinX, vpMinY, bounds);
    const vpBottomRight = worldToMinimap(vpMaxX, vpMaxY, bounds);

    const vpW = vpBottomRight.x - vpTopLeft.x;
    const vpH = vpBottomRight.y - vpTopLeft.y;

    // Clamp to minimap
    const rx = Math.max(PADDING, Math.min(vpTopLeft.x, MINIMAP_WIDTH - PADDING));
    const ry = Math.max(PADDING, Math.min(vpTopLeft.y, MINIMAP_HEIGHT - PADDING));
    const rw = Math.min(vpW, MINIMAP_WIDTH - PADDING - rx);
    const rh = Math.min(vpH, MINIMAP_HEIGHT - PADDING - ry);

    if (rw > 0 && rh > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.fill();
      ctx.stroke();
    }

    // Label
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${nodes.length} nodes`, MINIMAP_WIDTH - 6, MINIMAP_HEIGHT - 4);
  }, [nodes, view, canvasWidth, canvasHeight, getGraphBounds, worldToMinimap]);

  useEffect(() => {
    render();
  }, [render]);

  const minimapToWorld = useCallback(
    (mx: number, my: number, bounds: ReturnType<typeof getGraphBounds>) => {
      const graphW = bounds.maxX - bounds.minX || 1;
      const graphH = bounds.maxY - bounds.minY || 1;
      return {
        x: ((mx - PADDING) / (MINIMAP_WIDTH - PADDING * 2)) * graphW + bounds.minX,
        y: ((my - PADDING) / (MINIMAP_HEIGHT - PADDING * 2)) * graphH + bounds.minY,
      };
    },
    [],
  );

  const navigateToPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const bounds = getGraphBounds();
      const world = minimapToWorld(mx, my, bounds);

      // Center the view on this world point
      uiStore.setView({
        panX: canvasWidth / 2 - world.x * view.zoom,
        panY: canvasHeight / 2 - world.y * view.zoom,
      });
    },
    [getGraphBounds, minimapToWorld, uiStore, canvasWidth, canvasHeight, view.zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      navigateToPoint(e.clientX, e.clientY);
    },
    [navigateToPoint],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      navigateToPoint(e.clientX, e.clientY);
    },
    [navigateToPoint],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        title="Minimap — click or drag to navigate"
      />
    </div>
  );
};
