import type { GraphNode, GraphEdge, LayoutOptions, Position } from '../types/index.js';

/**
 * Fruchterman-Reingold force-directed layout algorithm.
 *
 * Ref: Fruchterman, T.M.J. & Reingold, E.M. (1991). Graph Drawing by
 * Force-Directed Placement. Software – Practice & Experience, 21(11).
 */
export function fruchtermanReingold(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: LayoutOptions,
): Map<string, Position> {
  const {
    width,
    height,
    iterations = 300,
    gravity = 0.1,
    repulsion = 1.0,
    attraction = 1.0,
    damping = 0.9,
  } = options;

  if (nodes.length === 0) return new Map();
  if (nodes.length === 1) {
    return new Map([[nodes[0]!.id, { x: width / 2, y: height / 2 }]]);
  }

  const area = width * height;
  const k = Math.sqrt(area / nodes.length); // optimal distance

  // Initialize positions - use existing positions or random
  const positions = new Map<string, { x: number; y: number }>();
  const velocities = new Map<string, { vx: number; vy: number }>();

  for (const node of nodes) {
    positions.set(node.id, {
      x: node.position.x !== 0 ? node.position.x : (Math.random() - 0.5) * width,
      y: node.position.y !== 0 ? node.position.y : (Math.random() - 0.5) * height,
    });
    velocities.set(node.id, { vx: 0, vy: 0 });
  }

  // Build adjacency for fast lookup
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) adjacency.set(node.id, new Set());
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const repulsiveForce = (d: number): number => (k * k * repulsion) / Math.max(d, 0.01);
  const attractiveForce = (d: number): number => (d * d * attraction) / k;

  let temperature = width / 10;
  const cooling = temperature / (iterations + 1);

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    for (const node of nodes) forces.set(node.id, { fx: 0, fy: 0 });

    // Repulsive forces between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const u = nodes[i]!;
        const v = nodes[j]!;
        const pu = positions.get(u.id)!;
        const pv = positions.get(v.id)!;

        const dx = pu.x - pv.x;
        const dy = pu.y - pv.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const f = repulsiveForce(dist);
        const nx = (dx / dist) * f;
        const ny = (dy / dist) * f;

        const fu = forces.get(u.id)!;
        const fv = forces.get(v.id)!;
        fu.fx += nx;
        fu.fy += ny;
        fv.fx -= nx;
        fv.fy -= ny;
      }
    }

    // Attractive forces along edges
    for (const edge of edges) {
      const pu = positions.get(edge.source);
      const pv = positions.get(edge.target);
      if (!pu || !pv) continue;

      const dx = pv.x - pu.x;
      const dy = pv.y - pu.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = attractiveForce(dist) * (edge.weight ?? 1);
      const nx = (dx / dist) * f;
      const ny = (dy / dist) * f;

      const fu = forces.get(edge.source)!;
      const fv = forces.get(edge.target)!;
      fu.fx += nx;
      fu.fy += ny;
      fv.fx -= nx;
      fv.fy -= ny;
    }

    // Gravity toward center
    for (const node of nodes) {
      const p = positions.get(node.id)!;
      const f = forces.get(node.id)!;
      f.fx += (width / 2 - p.x) * gravity;
      f.fy += (height / 2 - p.y) * gravity;
    }

    // Update positions with velocity and temperature
    for (const node of nodes) {
      const p = positions.get(node.id)!;
      const f = forces.get(node.id)!;
      const v = velocities.get(node.id)!;

      v.vx = (v.vx + f.fx) * damping;
      v.vy = (v.vy + f.fy) * damping;

      const speed = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
      const limitedSpeed = Math.min(speed, temperature);
      if (speed > 0) {
        p.x += (v.vx / speed) * limitedSpeed;
        p.y += (v.vy / speed) * limitedSpeed;
      }

      // Clamp to bounds with padding
      const padding = 60;
      p.x = Math.max(padding, Math.min(width - padding, p.x));
      p.y = Math.max(padding, Math.min(height - padding, p.y));
    }

    temperature = Math.max(temperature - cooling, 0.1);
  }

  return positions;
}

/**
 * Simple circular layout — positions nodes evenly on a circle.
 */
export function circularLayout(nodes: GraphNode[], options: LayoutOptions): Map<string, Position> {
  const { width, height } = options;
  const positions = new Map<string, Position>();
  if (nodes.length === 0) return positions;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.4;
  const step = (2 * Math.PI) / nodes.length;

  nodes.forEach((node, i) => {
    positions.set(node.id, {
      x: cx + radius * Math.cos(i * step - Math.PI / 2),
      y: cy + radius * Math.sin(i * step - Math.PI / 2),
    });
  });

  return positions;
}

/**
 * Hierarchical (tree) layout — BFS from root nodes, rows per level.
 */
export function hierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: LayoutOptions,
): Map<string, Position> {
  const { width, height } = options;
  const positions = new Map<string, Position>();
  if (nodes.length === 0) return positions;

  // Build adjacency (directed)
  const children = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const node of nodes) {
    children.set(node.id, []);
    inDegree.set(node.id, 0);
  }
  for (const edge of edges) {
    children.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // BFS level assignment
  const levels = new Map<string, number>();
  const queue: string[] = [];

  for (const node of nodes) {
    if ((inDegree.get(node.id) ?? 0) === 0) {
      queue.push(node.id);
      levels.set(node.id, 0);
    }
  }

  // Handle disconnected nodes
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0]!.id);
    levels.set(nodes[0]!.id, 0);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) ?? 0;
    for (const child of children.get(current) ?? []) {
      if (!levels.has(child)) {
        levels.set(child, currentLevel + 1);
        queue.push(child);
      }
    }
  }

  // Assign positions
  const levelGroups = new Map<number, string[]>();
  for (const [nodeId, level] of levels) {
    const group = levelGroups.get(level) ?? [];
    group.push(nodeId);
    levelGroups.set(level, group);
  }

  // Remaining unassigned nodes go to last level
  const maxLevel = Math.max(...levelGroups.keys(), 0);
  for (const node of nodes) {
    if (!levels.has(node.id)) {
      const group = levelGroups.get(maxLevel + 1) ?? [];
      group.push(node.id);
      levelGroups.set(maxLevel + 1, group);
    }
  }

  const totalLevels = levelGroups.size;
  const levelHeight = height / (totalLevels + 1);

  for (const [level, nodeIds] of levelGroups) {
    const levelWidth = width / (nodeIds.length + 1);
    nodeIds.forEach((nodeId, i) => {
      positions.set(nodeId, {
        x: levelWidth * (i + 1),
        y: levelHeight * (level + 1),
      });
    });
  }

  return positions;
}

/**
 * Grid layout — evenly spaces nodes in a grid pattern.
 */
export function gridLayout(nodes: GraphNode[], options: LayoutOptions): Map<string, Position> {
  const { width, height } = options;
  const positions = new Map<string, Position>();
  if (nodes.length === 0) return positions;

  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  const cellW = width / (cols + 1);
  const cellH = height / (rows + 1);

  nodes.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(node.id, {
      x: cellW * (col + 1),
      y: cellH * (row + 1),
    });
  });

  return positions;
}
