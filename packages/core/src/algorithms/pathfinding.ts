import type { GraphNode, GraphEdge, PathResult } from '../types/index.js';

type AdjacencyMap = Map<string, Array<{ nodeId: string; edgeId: string; weight: number }>>;

function buildAdjacency(nodes: GraphNode[], edges: GraphEdge[]): AdjacencyMap {
  const adj: AdjacencyMap = new Map();
  for (const node of nodes) adj.set(node.id, []);

  for (const edge of edges) {
    adj.get(edge.source)?.push({
      nodeId: edge.target,
      edgeId: edge.id,
      weight: edge.weight ?? 1,
    });
    if (edge.bidirectional) {
      adj.get(edge.target)?.push({
        nodeId: edge.source,
        edgeId: edge.id,
        weight: edge.weight ?? 1,
      });
    }
  }
  return adj;
}

/**
 * BFS shortest path (unweighted) — returns the shortest path between two nodes.
 */
export function bfsShortestPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string,
): PathResult | null {
  if (sourceId === targetId) return { path: [sourceId], distance: 0 };

  const adj = buildAdjacency(nodes, edges);
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: string[] = [sourceId];
  visited.add(sourceId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const { nodeId } of adj.get(current) ?? []) {
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      parent.set(nodeId, current);

      if (nodeId === targetId) {
        // Reconstruct path
        const path: string[] = [];
        let cur: string | undefined = targetId;
        while (cur !== undefined) {
          path.unshift(cur);
          cur = parent.get(cur);
        }
        return { path, distance: path.length - 1 };
      }

      queue.push(nodeId);
    }
  }

  return null; // no path found
}

/**
 * Dijkstra's algorithm for weighted shortest path.
 */
export function dijkstraShortestPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string,
): PathResult | null {
  if (sourceId === targetId) return { path: [sourceId], distance: 0 };

  const adj = buildAdjacency(nodes, edges);
  const distances = new Map<string, number>();
  const parent = new Map<string, string>();
  const visited = new Set<string>();

  for (const node of nodes) distances.set(node.id, Infinity);
  distances.set(sourceId, 0);

  // Simple priority queue using sorted array (adequate for typical graph sizes)
  const pq: Array<{ id: string; dist: number }> = [{ id: sourceId, dist: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { id: current, dist: currentDist } = pq.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === targetId) break;

    for (const { nodeId, weight } of adj.get(current) ?? []) {
      if (visited.has(nodeId)) continue;
      const newDist = currentDist + weight;
      if (newDist < (distances.get(nodeId) ?? Infinity)) {
        distances.set(nodeId, newDist);
        parent.set(nodeId, current);
        pq.push({ id: nodeId, dist: newDist });
      }
    }
  }

  if (!distances.has(targetId) || distances.get(targetId) === Infinity) return null;

  // Reconstruct path
  const path: string[] = [];
  let cur: string | undefined = targetId;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = parent.get(cur);
  }

  return { path, distance: distances.get(targetId) ?? Infinity };
}

/**
 * Find ALL simple paths between source and target (up to a max count to avoid explosion).
 */
export function findAllPaths(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string,
  maxPaths = 10,
  maxDepth = 20,
): PathResult[] {
  const adj = buildAdjacency(nodes, edges);
  const results: PathResult[] = [];

  function dfs(current: string, visited: Set<string>, path: string[]): void {
    if (results.length >= maxPaths) return;

    if (current === targetId && path.length > 1) {
      results.push({ path: [...path], distance: path.length - 1 });
      return;
    }

    if (path.length > maxDepth) return;

    for (const { nodeId } of adj.get(current) ?? []) {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        path.push(nodeId);
        dfs(nodeId, visited, path);
        path.pop();
        visited.delete(nodeId);
      }
    }
  }

  const visited = new Set<string>([sourceId]);
  dfs(sourceId, visited, [sourceId]);
  return results;
}

/**
 * Returns all nodes reachable from a given node (DFS traversal).
 */
export function reachableNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
): string[] {
  const adj = buildAdjacency(nodes, edges);
  const visited = new Set<string>();
  const stack: string[] = [sourceId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const { nodeId } of adj.get(current) ?? []) {
      if (!visited.has(nodeId)) stack.push(nodeId);
    }
  }

  visited.delete(sourceId);
  return Array.from(visited);
}

/**
 * Compute betweenness centrality for all nodes (simplified, using BFS).
 * Returns a Map<nodeId, centralityScore>.
 */
export function betweennessCentrality(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, number> {
  const centrality = new Map<string, number>();
  for (const node of nodes) centrality.set(node.id, 0);

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const source = nodes[i]!.id;
      const target = nodes[j]!.id;
      const result = bfsShortestPath(nodes, edges, source, target);
      if (result && result.path.length > 2) {
        // Count intermediate nodes
        for (const nodeId of result.path.slice(1, -1)) {
          centrality.set(nodeId, (centrality.get(nodeId) ?? 0) + 1);
        }
      }
    }
  }

  // Normalize
  const n = nodes.length;
  const maxPossible = ((n - 1) * (n - 2)) / 2;
  if (maxPossible > 0) {
    for (const [id, score] of centrality) {
      centrality.set(id, score / maxPossible);
    }
  }

  return centrality;
}
