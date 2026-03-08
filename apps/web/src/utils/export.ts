import type { Graph } from '@synapse/core';
import type { GraphView } from '../types/index.js';

/**
 * Export the current canvas as a PNG image.
 */
export function exportAsPNG(canvas: HTMLCanvasElement, filename = 'synapse-graph.png'): void {
  const url = canvas.toDataURL('image/png');
  downloadURL(url, filename);
}

/**
 * Export the graph as a structured JSON file.
 */
export function exportAsJSON(graph: Graph, filename = 'synapse-graph.json'): void {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    graph: {
      id: graph.id,
      name: graph.name,
      nodes: Array.from(graph.nodes.values()),
      edges: Array.from(graph.edges.values()),
      createdAt: graph.createdAt,
      updatedAt: graph.updatedAt,
    },
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadURL(url, filename);
  URL.revokeObjectURL(url);
}

/**
 * Export the graph as an SVG (reconstructed from graph data).
 */
export function exportAsSVG(
  graph: Graph,
  view: GraphView,
  canvasWidth: number,
  canvasHeight: number,
  filename = 'synapse-graph.svg',
): void {
  const nodeColors: Record<string, string> = {
    concept: '#3b82f6',
    resource: '#22c55e',
    question: '#eab308',
    insight: '#a855f7',
    custom: '#f97316',
  };

  const nodes = Array.from(graph.nodes.values());
  const edges = Array.from(graph.edges.values());

  const { zoom, panX, panY } = view;

  function wx(x: number): number {
    return x * zoom + panX;
  }
  function wy(y: number): number {
    return y * zoom + panY;
  }

  const NODE_R = 30 * zoom;

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <rect width="${canvasWidth}" height="${canvasHeight}" fill="#0f1117"/>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#4a5568"/>
    </marker>
  </defs>
  <g id="edges">
`;

  // Edges
  for (const edge of edges) {
    const source = graph.nodes.get(edge.source);
    const target = graph.nodes.get(edge.target);
    if (!source || !target) continue;

    const sx = wx(source.position.x);
    const sy = wy(source.position.y);
    const tx = wx(target.position.x);
    const ty = wy(target.position.y);

    // Shorten line by node radius
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ex = tx - (dx / dist) * (NODE_R + 5);
    const ey = ty - (dy / dist) * (NODE_R + 5);

    svgContent += `    <line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#4a5568" stroke-width="${(1.5 * zoom).toFixed(1)}" marker-end="url(#arrow)"/>\n`;

    if (edge.label) {
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      svgContent += `    <text x="${mx.toFixed(1)}" y="${(my - 6).toFixed(1)}" fill="#64748b" font-size="${(11 * zoom).toFixed(1)}" font-family="sans-serif" text-anchor="middle">${escapeXML(edge.label)}</text>\n`;
    }
  }

  svgContent += '  </g>\n  <g id="nodes">\n';

  // Nodes
  for (const node of nodes) {
    const cx = wx(node.position.x);
    const cy = wy(node.position.y);
    const color = nodeColors[node.type] ?? '#6366f1';
    const fontSize = Math.max(10, Math.min(14, 12 * zoom));

    svgContent += `    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${NODE_R.toFixed(1)}" fill="${color}22" stroke="${color}" stroke-width="${(2 * zoom).toFixed(1)}"/>\n`;
    svgContent += `    <text x="${cx.toFixed(1)}" y="${(cy + fontSize * 0.35).toFixed(1)}" fill="#f1f5f9" font-size="${fontSize.toFixed(1)}" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${escapeXML(truncate(node.label, 14))}</text>\n`;
  }

  svgContent += '  </g>\n</svg>';

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  downloadURL(url, filename);
  URL.revokeObjectURL(url);
}

/**
 * Import a graph from JSON data.
 */
export function importFromJSON(json: string): Graph | null {
  try {
    const data = JSON.parse(json) as {
      graph?: {
        id: string;
        name: string;
        nodes: Array<{ id: string; [k: string]: unknown }>;
        edges: Array<{ id: string; [k: string]: unknown }>;
        createdAt: number;
        updatedAt: number;
      };
    };

    if (!data.graph) return null;

    const g = data.graph;
    return {
      id: g.id,
      name: g.name,
      nodes: new Map(g.nodes.map((n) => [n.id, n as never])),
      edges: new Map(g.edges.map((e) => [e.id, e as never])),
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadURL(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}
