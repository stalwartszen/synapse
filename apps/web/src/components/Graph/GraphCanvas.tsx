import React, { useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '../../store/uiStore.js';
import { useCollaborationStore } from '../../store/collaborationStore.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import {
  hitTestNode,
  hitTestEdge,
  screenToWorld,
  edgeEndpoint,
  drawArrowhead,
  NODE_RADIUS,
} from '../../utils/canvas.js';
import type { GraphNode, GraphEdge } from '@synapse/core';
import type { CollaborationUser } from '../../types/index.js';
import styles from './GraphCanvas.module.css';

const NODE_COLORS: Record<string, string> = {
  concept: '#3b82f6',
  resource: '#22c55e',
  question: '#eab308',
  insight: '#a855f7',
  custom: '#f97316',
};

const EDGE_COLORS: Record<string, string> = {
  'relates-to': '#64748b',
  'depends-on': '#f97316',
  causes: '#ef4444',
  contradicts: '#ec4899',
  supports: '#22c55e',
  custom: '#a855f7',
};

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onCanvasClick?: (worldX: number, worldY: number) => void;
  onEdgeClick?: (edgeId: string) => void;
  onNodeDragEnd?: (nodeId: string, x: number, y: number) => void;
  onEdgeCreate?: (sourceId: string, targetId: string) => void;
  className?: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onNodeClick,
  onNodeDoubleClick,
  onCanvasClick,
  onEdgeClick,
  onNodeDragEnd,
  onEdgeCreate,
}) => {
  const uiStore = useUIStore();
  const collabStore = useCollaborationStore();
  const isLayoutRunning = useUIStore((s) => s.isLayoutRunning);
  const focusNodeId = useUIStore((s) => s.focusNodeId);

  const { canvasRef, canvasSize, view, startPan, updatePan, endPan, startNodeDrag,
    getNodeDragPosition, endNodeDrag, isDraggingNode, requestRender } =
    useCanvas({
      nodes,
      onDragEnd: onNodeDragEnd,
    });

  // Live position map for smooth dragging without store updates
  const livePositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Compute focus neighbors
  const focusNeighborIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!focusNodeId) {
      focusNeighborIds.current = new Set();
      return;
    }
    const neighbors = new Set<string>();
    for (const edge of edges) {
      if (edge.source === focusNodeId) neighbors.add(edge.target);
      if (edge.target === focusNodeId) neighbors.add(edge.source);
    }
    focusNeighborIds.current = neighbors;
  }, [focusNodeId, edges]);

  // Compute degree for node size scaling
  const degreeMap = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const m = new Map<string, number>();
    for (const n of nodes) m.set(n.id, 0);
    for (const e of edges) {
      m.set(e.source, (m.get(e.source) ?? 0) + 1);
      m.set(e.target, (m.get(e.target) ?? 0) + 1);
    }
    degreeMap.current = m;
  }, [nodes, edges]);

  // ── Rendering ─────────────────────────────────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const { zoom, panX, panY } = view;

    ctx.clearRect(0, 0, width, height);

    // Background grid
    drawGrid(ctx, width, height, view);

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Build position map
    const posMap = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
      const live = livePositions.current.get(node.id);
      posMap.set(node.id, live ?? node.position);
    }

    const hasFocus = !!focusNodeId;
    const neighbors = focusNeighborIds.current;

    // Draw edges
    // Track edge pairs to detect parallel edges (for curvature)
    const edgePairCounts = new Map<string, number>();
    const edgePairIndexes = new Map<string, number>();

    for (const edge of edges) {
      const pairKey = [edge.source, edge.target].sort().join(':');
      edgePairCounts.set(pairKey, (edgePairCounts.get(pairKey) ?? 0) + 1);
    }

    for (const edge of edges) {
      const sourcePos = posMap.get(edge.source);
      const targetPos = posMap.get(edge.target);
      if (!sourcePos || !targetPos) continue;

      const isSelected = uiStore.selectedEdgeId === edge.id;
      let edgeAlpha = 1;

      if (hasFocus) {
        const edgeTouches = edge.source === focusNodeId || edge.target === focusNodeId;
        edgeAlpha = edgeTouches ? 1 : 0.05;
      }

      const pairKey = [edge.source, edge.target].sort().join(':');
      const pairCount = edgePairCounts.get(pairKey) ?? 1;
      const pairIdx = edgePairIndexes.get(pairKey) ?? 0;
      edgePairIndexes.set(pairKey, pairIdx + 1);

      const curvature = pairCount > 1 ? (pairIdx - (pairCount - 1) / 2) * 30 : 0;

      ctx.globalAlpha = edgeAlpha;
      drawEdge(ctx, edge, sourcePos, targetPos, isSelected, curvature);
      ctx.globalAlpha = 1;
    }

    // Draw edge-in-progress
    if (uiStore.mode === 'add-edge' && uiStore.edgeDrawSource) {
      const sourcePos = posMap.get(uiStore.edgeDrawSource);
      if (sourcePos && lastMouseWorldPos.current) {
        drawTentativeEdge(ctx, sourcePos, lastMouseWorldPos.current);
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const pos = posMap.get(node.id) ?? node.position;
      const isSelected = uiStore.selectedNodeIds.has(node.id);
      const isHovered = uiStore.hoveredNodeId === node.id;
      const remoteUserColor = getRemoteSelectionColor(node.id, collabStore.remoteUsers);
      const degree = degreeMap.current.get(node.id) ?? 0;

      let nodeAlpha = 1;
      if (hasFocus) {
        if (node.id === focusNodeId) {
          nodeAlpha = 1;
        } else if (neighbors.has(node.id)) {
          nodeAlpha = 1;
        } else {
          nodeAlpha = 0.2;
        }
      }

      ctx.globalAlpha = nodeAlpha;
      drawNode(ctx, node, pos, isSelected, isHovered, remoteUserColor, degree);
      ctx.globalAlpha = 1;
    }

    // Draw collaborator cursors
    for (const user of collabStore.remoteUsers.values()) {
      if (user.cursor) {
        drawCollaboratorCursor(ctx, user);
      }
    }

    ctx.restore();
  }, [canvasRef, canvasSize, view, nodes, edges, uiStore, collabStore, focusNodeId]);

  // Re-render whenever dependencies change
  useEffect(() => {
    requestRender(render);
  }, [render, requestRender]);

  // ── Mouse state ───────────────────────────────────────────────────────────

  const lastMouseWorldPos = useRef<{ x: number; y: number } | null>(null);
  const mouseDownNodeId = useRef<string | null>(null);
  const mouseDownTime = useRef<number>(0);
  const hasDragged = useRef(false);
  const isPanningRef = useRef(false);

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const hitNodeId = hitTestNode(sx, sy, nodes, view);
      mouseDownNodeId.current = hitNodeId;
      mouseDownTime.current = Date.now();
      hasDragged.current = false;

      if (uiStore.mode === 'add-edge') {
        if (hitNodeId) {
          if (!uiStore.edgeDrawSource) {
            uiStore.setEdgeDrawSource(hitNodeId);
          } else {
            // Complete edge
            const source = uiStore.edgeDrawSource;
            const target = hitNodeId;
            uiStore.setEdgeDrawSource(null);
            if (source !== target && onEdgeCreate) {
              onEdgeCreate(source, target);
            }
          }
        }
        return;
      }

      if (hitNodeId) {
        const node = nodes.find((n) => n.id === hitNodeId);
        if (node) {
          startNodeDrag(hitNodeId, e.clientX, e.clientY, node.position, rect);
        }
      } else {
        // Start panning
        isPanningRef.current = true;
        startPan(e.clientX, e.clientY);
      }
    },
    [canvasRef, nodes, view, uiStore, startNodeDrag, startPan, onEdgeCreate],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy, view);
      lastMouseWorldPos.current = world;

      if (isPanningRef.current) {
        updatePan(e.clientX, e.clientY);
        hasDragged.current = true;
        return;
      }

      if (isDraggingNode()) {
        hasDragged.current = true;
        const pos = getNodeDragPosition(e.clientX, e.clientY, rect);
        if (pos) {
          // Grid snap when Shift is held
          let snapX = pos.x;
          let snapY = pos.y;
          if (e.shiftKey) {
            const GRID = 40;
            snapX = Math.round(pos.x / GRID) * GRID;
            snapY = Math.round(pos.y / GRID) * GRID;
          }
          livePositions.current.set(pos.nodeId, { x: snapX, y: snapY });
        }
        requestRender(render);
        return;
      }

      // Hover test
      const hitNodeId = hitTestNode(sx, sy, nodes, view);
      uiStore.setHoveredNode(hitNodeId);

      // Redraw for tentative edge or hover
      if (uiStore.mode === 'add-edge' && uiStore.edgeDrawSource) {
        requestRender(render);
      }
    },
    [canvasRef, view, isDraggingNode, getNodeDragPosition, updatePan, nodes, uiStore, requestRender, render],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      if (isPanningRef.current) {
        isPanningRef.current = false;
        endPan();
        return;
      }

      if (isDraggingNode()) {
        endNodeDrag(e.clientX, e.clientY, rect);
        livePositions.current.clear();
        requestRender(render);
        return;
      }

      if (hasDragged.current) return;

      // Click handling
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy, view);

      const hitNodeId = hitTestNode(sx, sy, nodes, view);

      if (hitNodeId) {
        if (uiStore.mode === 'select') {
          uiStore.selectNode(hitNodeId, e.metaKey || e.ctrlKey || e.shiftKey);
          onNodeClick?.(hitNodeId);
        }
      } else {
        // Try edge
        const edgeHits = edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          return {
            id: edge.id,
            sourcePos: sourceNode?.position ?? { x: 0, y: 0 },
            targetPos: targetNode?.position ?? { x: 0, y: 0 },
          };
        });
        const hitEdgeId = hitTestEdge(sx, sy, edgeHits, view);

        if (hitEdgeId) {
          uiStore.selectEdge(hitEdgeId);
          onEdgeClick?.(hitEdgeId);
        } else {
          if (uiStore.mode === 'add-node') {
            onCanvasClick?.(world.x, world.y);
          } else {
            uiStore.deselectAll();
            onCanvasClick?.(world.x, world.y);
          }
        }
      }
    },
    [canvasRef, view, nodes, edges, uiStore, isDraggingNode, endNodeDrag, endPan, onNodeClick, onEdgeClick, onCanvasClick, requestRender, render],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const hitNodeId = hitTestNode(sx, sy, nodes, view);
      if (hitNodeId) {
        onNodeDoubleClick?.(hitNodeId);
      }
    },
    [canvasRef, nodes, view, onNodeDoubleClick],
  );

  const handleMouseLeave = useCallback(() => {
    uiStore.setHoveredNode(null);
    if (isPanningRef.current) {
      isPanningRef.current = false;
      endPan();
    }
  }, [uiStore, endPan]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // ── Cursor style ──────────────────────────────────────────────────────────

  const getCursorClass = () => {
    if (isPanningRef.current) return styles.panning;
    if (uiStore.mode === 'add-node') return styles.modeAddNode;
    if (uiStore.mode === 'add-edge') return styles.modeAddEdge;
    return '';
  };

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${getCursorClass()}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {nodes.length === 0 && (
        <div className={styles.emptyHint}>
          <h3>Empty Graph</h3>
          <p>Press <strong>N</strong> to add a node, or use <strong>T</strong> to pick a template</p>
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>Press <strong>⌘K</strong> for commands</p>
        </div>
      )}

      {isLayoutRunning && (
        <div className={styles.layoutOverlay}>
          <div className={styles.layoutSpinner}>
            <div className={styles.spinner} />
            <span>Applying layout…</span>
          </div>
        </div>
      )}

      <div className={styles.stats}>
        <span className={styles.statItem}>
          Nodes: <span className={styles.statValue}>{nodes.length}</span>
        </span>
        <span className={styles.statItem}>
          Edges: <span className={styles.statValue}>{edges.length}</span>
        </span>
        <span className={styles.statItem}>
          Zoom: <span className={styles.statValue}>{Math.round(view.zoom * 100)}%</span>
        </span>
      </div>
    </div>
  );
};

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: { zoom: number; panX: number; panY: number },
): void {
  const gridSpacing = 40 * view.zoom;
  if (gridSpacing < 8) return;

  const offsetX = view.panX % gridSpacing;
  const offsetY = view.panY % gridSpacing;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = offsetX; x < width; x += gridSpacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = offsetY; y < height; y += gridSpacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

function getNodeRadius(degree: number): number {
  // Scale node radius by degree: min 24, max 60
  const minR = 24;
  const maxR = 60;
  const capped = Math.min(degree, 10);
  return minR + (maxR - minR) * (capped / 10);
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  edge: GraphEdge,
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  isSelected: boolean,
  curvature: number = 0,
): void {
  const color = isSelected ? '#38bdf8' : (EDGE_COLORS[edge.type] ?? '#64748b');
  const weight = edge.weight ?? 1;
  const lineWidth = isSelected ? 2.5 : Math.max(0.8, Math.min(3, 1.5 * weight));

  const start = edgeEndpoint(sourcePos, targetPos, NODE_RADIUS + 2);
  const end = edgeEndpoint(targetPos, sourcePos, NODE_RADIUS + 8);

  ctx.beginPath();

  if (Math.abs(curvature) > 0.5) {
    // Curved edge for parallel edges
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const cpx = mx - (dy / len) * curvature;
    const cpy = my + (dx / len) * curvature;
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(cpx, cpy, end.x, end.y);
  } else {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = (ctx.globalAlpha ?? 1) * (isSelected ? 1 : 0.7);

  if (edge.bidirectional) {
    ctx.setLineDash([6, 3]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = ctx.globalAlpha / (isSelected ? 1 : 0.7);

  // Arrowhead
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  ctx.fillStyle = color;
  drawArrowhead(ctx, end, { x: dx, y: dy }, 9);

  // Edge label
  if (edge.label) {
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(edge.label, mx, my - 4);
  }
}

function drawTentativeEdge(
  ctx: CanvasRenderingContext2D,
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
): void {
  ctx.beginPath();
  ctx.moveTo(sourcePos.x, sourcePos.y);
  ctx.lineTo(targetPos.x, targetPos.y);
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: GraphNode,
  pos: { x: number; y: number },
  isSelected: boolean,
  isHovered: boolean,
  remoteUserColor: string | null,
  degree: number = 0,
): void {
  const color = NODE_COLORS[node.type] ?? '#6366f1';
  const r = getNodeRadius(degree);

  // Selection / remote user ring
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (remoteUserColor) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = remoteUserColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (isHovered) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Shadow / glow
  ctx.shadowColor = color;
  ctx.shadowBlur = isSelected || isHovered ? 20 : 10;

  // Fill
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
  ctx.fillStyle = `${color}22`;
  ctx.fill();

  // Stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? 2.5 : 1.8;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // Type icon inside node
  drawNodeIcon(ctx, node.type, pos, r);

  // Label (below node or inside depending on size)
  const maxLen = r > 35 ? 16 : 12;
  const label = node.label.length > maxLen ? node.label.slice(0, maxLen - 1) + '…' : node.label;
  ctx.font = `${Math.max(10, Math.min(13, 8 + degree))}px sans-serif`;
  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, pos.x, pos.y + r + 4);

  // Type indicator dot
  const dotR = 4;
  ctx.beginPath();
  ctx.arc(pos.x + r - dotR - 2, pos.y - r + dotR + 2, dotR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawNodeIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  pos: { x: number; y: number },
  r: number,
): void {
  const iconSize = Math.max(10, r * 0.5);
  ctx.font = `${iconSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

  const icons: Record<string, string> = {
    concept: '💡',
    resource: '📚',
    question: '?',
    insight: '★',
    custom: '●',
  };

  const icon = icons[type] ?? '●';

  if (icon === '?' || icon === '★' || icon === '●') {
    ctx.font = `bold ${iconSize}px sans-serif`;
    ctx.fillText(icon, pos.x, pos.y);
  } else {
    ctx.font = `${iconSize}px serif`;
    ctx.fillText(icon, pos.x, pos.y);
  }
}

function drawCollaboratorCursor(
  ctx: CanvasRenderingContext2D,
  user: CollaborationUser,
): void {
  if (!user.cursor) return;
  const { x, y } = user.cursor;
  const color = user.color;

  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();

  const label = user.name;
  ctx.font = 'bold 11px sans-serif';
  const tw = ctx.measureText(label).width;
  const lx = x + 10;
  const ly = y - 10;
  const pad = 4;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(lx - pad, ly - 11, tw + pad * 2, 16, 3);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, lx, ly - 3);
}

function getRemoteSelectionColor(
  nodeId: string,
  remoteUsers: Map<string, CollaborationUser>,
): string | null {
  for (const user of remoteUsers.values()) {
    if (user.selectedNodeId === nodeId) return user.color;
  }
  return null;
}
