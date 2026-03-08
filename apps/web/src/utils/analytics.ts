import type { Graph, GraphNode, GraphEdge } from '@synapse/core';

/**
 * Compute degree (in + out) for each node.
 */
export function computeDegree(graph: Graph): Map<string, number> {
  const degrees = new Map<string, number>();

  for (const node of graph.nodes.values()) {
    degrees.set(node.id, 0);
  }

  for (const edge of graph.edges.values()) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }

  return degrees;
}

/**
 * Find nodes with no connections (degree === 0).
 */
export function findOrphans(graph: Graph): string[] {
  const degrees = computeDegree(graph);
  const orphans: string[] = [];

  for (const [nodeId, degree] of degrees) {
    if (degree === 0) orphans.push(nodeId);
  }

  return orphans;
}

/**
 * Get connected components using union-find.
 * Returns array of sets, each set containing node IDs in that component.
 */
export function getConnectedComponents(graph: Graph): Set<string>[] {
  const nodes = Array.from(graph.nodes.keys());
  if (nodes.length === 0) return [];

  const parent = new Map<string, string>();
  for (const id of nodes) parent.set(id, id);

  function find(id: string): string {
    const p = parent.get(id) ?? id;
    if (p !== id) {
      const root = find(p);
      parent.set(id, root);
      return root;
    }
    return id;
  }

  function union(a: string, b: string): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (const edge of graph.edges.values()) {
    if (graph.nodes.has(edge.source) && graph.nodes.has(edge.target)) {
      union(edge.source, edge.target);
    }
  }

  const componentMap = new Map<string, Set<string>>();
  for (const id of nodes) {
    const root = find(id);
    const component = componentMap.get(root) ?? new Set<string>();
    component.add(id);
    componentMap.set(root, component);
  }

  return Array.from(componentMap.values());
}

/**
 * Get counts of nodes by type.
 */
export function getNodeTypeBreakdown(graph: Graph): Record<string, number> {
  const counts: Record<string, number> = {
    concept: 0,
    resource: 0,
    question: 0,
    insight: 0,
    custom: 0,
  };

  for (const node of graph.nodes.values()) {
    if (node.type in counts) {
      counts[node.type]! += 1;
    } else {
      counts['custom']! += 1;
    }
  }

  return counts;
}

/**
 * Simple PageRank implementation.
 * Returns map of nodeId -> pagerank score (0-1).
 */
export function computePageRank(
  graph: Graph,
  iterations: number = 20,
  dampingFactor: number = 0.85,
): Map<string, number> {
  const nodes = Array.from(graph.nodes.keys());
  if (nodes.length === 0) return new Map();

  const N = nodes.length;
  const scores = new Map<string, number>();
  const outLinks = new Map<string, string[]>();

  for (const id of nodes) {
    scores.set(id, 1 / N);
    outLinks.set(id, []);
  }

  for (const edge of graph.edges.values()) {
    if (graph.nodes.has(edge.source) && graph.nodes.has(edge.target)) {
      outLinks.get(edge.source)?.push(edge.target);
    }
  }

  for (let iter = 0; iter < iterations; iter++) {
    const newScores = new Map<string, number>();

    for (const id of nodes) {
      let inboundSum = 0;

      for (const srcId of nodes) {
        const links = outLinks.get(srcId) ?? [];
        if (links.includes(id)) {
          const outCount = links.length;
          inboundSum += (scores.get(srcId) ?? 0) / outCount;
        }
      }

      newScores.set(id, (1 - dampingFactor) / N + dampingFactor * inboundSum);
    }

    for (const [id, score] of newScores) {
      scores.set(id, score);
    }
  }

  return scores;
}

/**
 * Get average degree across all nodes.
 */
export function getAverageDegree(graph: Graph): number {
  if (graph.nodes.size === 0) return 0;
  const degrees = computeDegree(graph);
  let total = 0;
  for (const d of degrees.values()) total += d;
  return total / graph.nodes.size;
}

/**
 * Get top N nodes by degree centrality.
 */
export function getTopNodesByDegree(
  graph: Graph,
  n: number = 5,
): Array<{ node: GraphNode; degree: number }> {
  const degrees = computeDegree(graph);
  const result: Array<{ node: GraphNode; degree: number }> = [];

  for (const [nodeId, degree] of degrees) {
    const node = graph.nodes.get(nodeId);
    if (node) result.push({ node, degree });
  }

  result.sort((a, b) => b.degree - a.degree);
  return result.slice(0, n);
}
