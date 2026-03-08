import type { GraphView, CanvasSize } from '../types/index.js';

// ─── Coordinate transforms ────────────────────────────────────────────────────

/**
 * Convert screen (pixel) coordinates to world (graph) coordinates.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  view: GraphView,
): { x: number; y: number } {
  return {
    x: (screenX - view.panX) / view.zoom,
    y: (screenY - view.panY) / view.zoom,
  };
}

/**
 * Convert world (graph) coordinates to screen (pixel) coordinates.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  view: GraphView,
): { x: number; y: number } {
  return {
    x: worldX * view.zoom + view.panX,
    y: worldY * view.zoom + view.panY,
  };
}

// ─── Zoom ─────────────────────────────────────────────────────────────────────

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 5;
export const ZOOM_STEP = 0.1;

/**
 * Compute a new view after zooming toward a focal point (screen coordinates).
 */
export function zoomToward(
  view: GraphView,
  delta: number,
  focalX: number,
  focalY: number,
): GraphView {
  const factor = delta > 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom * factor));

  // Keep focal point stable
  const newPanX = focalX - ((focalX - view.panX) / view.zoom) * newZoom;
  const newPanY = focalY - ((focalY - view.panY) / view.zoom) * newZoom;

  return { zoom: newZoom, panX: newPanX, panY: newPanY };
}

/**
 * Compute view to fit all nodes within canvas bounds.
 */
export function fitToView(
  nodes: Array<{ position: { x: number; y: number } }>,
  canvasSize: CanvasSize,
  padding = 80,
): GraphView {
  if (nodes.length === 0) {
    return { zoom: 1, panX: canvasSize.width / 2, panY: canvasSize.height / 2 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x);
    maxY = Math.max(maxY, node.position.y);
  }

  const graphW = maxX - minX || 1;
  const graphH = maxY - minY || 1;
  const availW = canvasSize.width - 2 * padding;
  const availH = canvasSize.height - 2 * padding;

  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(availW / graphW, availH / graphH)));

  const panX = (canvasSize.width - graphW * zoom) / 2 - minX * zoom;
  const panY = (canvasSize.height - graphH * zoom) / 2 - minY * zoom;

  return { zoom, panX, panY };
}

// ─── Hit testing ──────────────────────────────────────────────────────────────

export const NODE_RADIUS = 30;

/**
 * Returns the id of the node at screen position (sx, sy), or null.
 */
export function hitTestNode(
  screenX: number,
  screenY: number,
  nodes: Array<{ id: string; position: { x: number; y: number } }>,
  view: GraphView,
  radius = NODE_RADIUS,
): string | null {
  const world = screenToWorld(screenX, screenY, view);
  const scaledRadius = radius; // radius is in world units

  // Iterate in reverse so topmost (last drawn) wins
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]!;
    const dx = node.position.x - world.x;
    const dy = node.position.y - world.y;
    if (dx * dx + dy * dy <= scaledRadius * scaledRadius) {
      return node.id;
    }
  }
  return null;
}

/**
 * Returns the id of the edge whose line is closest to screen point within a threshold.
 */
export function hitTestEdge(
  screenX: number,
  screenY: number,
  edges: Array<{
    id: string;
    sourcePos: { x: number; y: number };
    targetPos: { x: number; y: number };
  }>,
  view: GraphView,
  threshold = 8,
): string | null {
  const world = screenToWorld(screenX, screenY, view);

  for (const edge of edges) {
    const dist = distToSegment(world, edge.sourcePos, edge.targetPos);
    if (dist <= threshold / view.zoom) return edge.id;
  }
  return null;
}

function distToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ddx = p.x - a.x;
    const ddy = p.y - a.y;
    return Math.sqrt(ddx * ddx + ddy * ddy);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  const fx = p.x - cx;
  const fy = p.y - cy;
  return Math.sqrt(fx * fx + fy * fy);
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute the point on a circle's perimeter along the direction toward another point.
 */
export function edgeEndpoint(
  center: { x: number; y: number },
  toward: { x: number; y: number },
  radius: number,
): { x: number; y: number } {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: center.x + (dx / dist) * radius,
    y: center.y + (dy / dist) * radius,
  };
}

/**
 * Draw an arrowhead at the tip of an edge.
 */
export function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  tip: { x: number; y: number },
  direction: { x: number; y: number },
  size = 10,
): void {
  const angle = Math.atan2(direction.y, direction.x);
  const spread = Math.PI / 6; // 30°
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(
    tip.x - size * Math.cos(angle - spread),
    tip.y - size * Math.sin(angle - spread),
  );
  ctx.lineTo(
    tip.x - size * Math.cos(angle + spread),
    tip.y - size * Math.sin(angle + spread),
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a rounded rectangle path.
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ─── Viewport ──────────────────────────────────────────────────────────────────

/**
 * Check if a world-space bounding box is visible in the current view.
 */
export function isVisible(
  worldX: number,
  worldY: number,
  worldW: number,
  worldH: number,
  view: GraphView,
  canvasSize: CanvasSize,
  margin = 100,
): boolean {
  const screenPos = worldToScreen(worldX, worldY, view);
  const screenEnd = worldToScreen(worldX + worldW, worldY + worldH, view);
  return (
    screenEnd.x >= -margin &&
    screenEnd.y >= -margin &&
    screenPos.x <= canvasSize.width + margin &&
    screenPos.y <= canvasSize.height + margin
  );
}
