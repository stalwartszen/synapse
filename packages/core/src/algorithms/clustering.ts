import type { GraphNode, GraphEdge, ClusterResult } from '../types/index.js';

/**
 * Union-Find data structure for connected components.
 */
class UnionFind {
  private parent: Map<string, string>;
  private rank: Map<string, number>;

  constructor(ids: string[]) {
    this.parent = new Map(ids.map((id) => [id, id]));
    this.rank = new Map(ids.map((id) => [id, 0]));
  }

  find(id: string): string {
    if (this.parent.get(id) !== id) {
      this.parent.set(id, this.find(this.parent.get(id)!));
    }
    return this.parent.get(id)!;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;

    const rankA = this.rank.get(ra) ?? 0;
    const rankB = this.rank.get(rb) ?? 0;

    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }
}

/**
 * Connected components clustering — groups nodes that are reachable from each other.
 */
export function connectedComponentsClustering(
  nodes: GraphNode[],
  edges: GraphEdge[],
): ClusterResult {
  if (nodes.length === 0) return { clusters: new Map(), modularity: 0 };

  const uf = new UnionFind(nodes.map((n) => n.id));

  for (const edge of edges) {
    uf.union(edge.source, edge.target);
  }

  const clusters = new Map<string, string[]>();
  for (const node of nodes) {
    const root = uf.find(node.id);
    const group = clusters.get(root) ?? [];
    group.push(node.id);
    clusters.set(root, group);
  }

  // Rename clusters with sequential IDs
  const result = new Map<string, string[]>();
  let idx = 0;
  for (const members of clusters.values()) {
    result.set(`cluster_${idx++}`, members);
  }

  return { clusters: result, modularity: 0 };
}

/**
 * Label Propagation Algorithm (LPA) — a fast community detection method.
 * Nodes adopt the most common label among their neighbors.
 */
export function labelPropagation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations = 50,
): ClusterResult {
  if (nodes.length === 0) return { clusters: new Map(), modularity: 0 };

  // Build undirected adjacency
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  // Initialize each node with its own label
  const labels = new Map<string, string>();
  for (const node of nodes) labels.set(node.id, node.id);

  const nodeIds = nodes.map((n) => n.id);

  for (let iter = 0; iter < iterations; iter++) {
    // Shuffle order for randomized update
    const shuffled = [...nodeIds].sort(() => Math.random() - 0.5);
    let changed = false;

    for (const nodeId of shuffled) {
      const neighbors = adjacency.get(nodeId) ?? [];
      if (neighbors.length === 0) continue;

      // Count neighbor labels
      const labelCount = new Map<string, number>();
      for (const neighbor of neighbors) {
        const label = labels.get(neighbor) ?? neighbor;
        labelCount.set(label, (labelCount.get(label) ?? 0) + 1);
      }

      // Find most common label (break ties randomly)
      let maxCount = 0;
      const maxLabels: string[] = [];
      for (const [label, count] of labelCount) {
        if (count > maxCount) {
          maxCount = count;
          maxLabels.length = 0;
          maxLabels.push(label);
        } else if (count === maxCount) {
          maxLabels.push(label);
        }
      }

      const bestLabel = maxLabels[Math.floor(Math.random() * maxLabels.length)]!;
      if (bestLabel !== labels.get(nodeId)) {
        labels.set(nodeId, bestLabel);
        changed = true;
      }
    }

    if (!changed) break;
  }

  // Group nodes by label
  const clusterMap = new Map<string, string[]>();
  for (const [nodeId, label] of labels) {
    const group = clusterMap.get(label) ?? [];
    group.push(nodeId);
    clusterMap.set(label, group);
  }

  // Rename with sequential IDs
  const clusters = new Map<string, string[]>();
  let idx = 0;
  for (const members of clusterMap.values()) {
    clusters.set(`community_${idx++}`, members);
  }

  const modularity = computeModularity(nodes, edges, labels);

  return { clusters, modularity };
}

/**
 * Simple greedy modularity clustering using edge betweenness.
 * Suitable for small-to-medium graphs.
 */
export function greedyModularityClustering(
  nodes: GraphNode[],
  edges: GraphEdge[],
): ClusterResult {
  if (nodes.length === 0) return { clusters: new Map(), modularity: 0 };

  // Start with each node in its own community
  const community = new Map<string, string>();
  for (const node of nodes) community.set(node.id, node.id);

  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) adjacency.set(node.id, new Set());
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const totalEdges = edges.length;
  if (totalEdges === 0) {
    const clusters = new Map<string, string[]>();
    nodes.forEach((n, i) => clusters.set(`c_${i}`, [n.id]));
    return { clusters, modularity: 0 };
  }

  // Iteratively merge communities to maximize modularity gain
  // This is a simplified version - O(n^2) but works well for typical graph sizes
  let bestModularity = computeModularity(nodes, edges, community);

  for (let round = 0; round < Math.min(nodes.length, 30); round++) {
    let bestMerge: [string, string] | null = null;
    let bestGain = 0;

    // Try merging adjacent communities
    for (const edge of edges) {
      const ca = community.get(edge.source)!;
      const cb = community.get(edge.target)!;
      if (ca === cb) continue;

      // Temporarily merge
      const tempCommunity = new Map(community);
      for (const [nodeId, comm] of tempCommunity) {
        if (comm === cb) tempCommunity.set(nodeId, ca);
      }

      const newMod = computeModularity(nodes, edges, tempCommunity);
      const gain = newMod - bestModularity;

      if (gain > bestGain) {
        bestGain = gain;
        bestMerge = [ca, cb];
        bestModularity = newMod;
      }
    }

    if (!bestMerge || bestGain <= 0) break;

    const [ca, cb] = bestMerge;
    for (const [nodeId, comm] of community) {
      if (comm === cb) community.set(nodeId, ca);
    }
  }

  // Build result clusters
  const clusterMap = new Map<string, string[]>();
  for (const [nodeId, comm] of community) {
    const group = clusterMap.get(comm) ?? [];
    group.push(nodeId);
    clusterMap.set(comm, group);
  }

  const clusters = new Map<string, string[]>();
  let idx = 0;
  for (const members of clusterMap.values()) {
    clusters.set(`module_${idx++}`, members);
  }

  return { clusters, modularity: bestModularity };
}

/**
 * Compute modularity Q for a given community assignment.
 * Q = (1/2m) * sum_ij [ A_ij - k_i*k_j/(2m) ] * delta(c_i, c_j)
 */
function computeModularity(
  nodes: GraphNode[],
  edges: GraphEdge[],
  community: Map<string, string>,
): number {
  const m = edges.length;
  if (m === 0) return 0;

  const degree = new Map<string, number>();
  for (const node of nodes) degree.set(node.id, 0);
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }

  let q = 0;

  for (const edge of edges) {
    if (community.get(edge.source) === community.get(edge.target)) {
      const ki = degree.get(edge.source) ?? 0;
      const kj = degree.get(edge.target) ?? 0;
      q += 1 - ki * kj / (2 * m);
    }
  }

  // Self-loop penalty
  for (const node of nodes) {
    const ki = degree.get(node.id) ?? 0;
    if (community.has(node.id)) {
      q -= ki * ki / (2 * m) / 2;
    }
  }

  return q / m;
}

/**
 * Tag-based clustering — groups nodes that share common tags.
 */
export function tagBasedClustering(nodes: GraphNode[]): ClusterResult {
  const clusters = new Map<string, string[]>();
  const untagged: string[] = [];

  for (const node of nodes) {
    if (!node.tags || node.tags.length === 0) {
      untagged.push(node.id);
      continue;
    }

    // Primary tag determines cluster
    const primaryTag = node.tags[0]!;
    const group = clusters.get(`tag_${primaryTag}`) ?? [];
    group.push(node.id);
    clusters.set(`tag_${primaryTag}`, group);
  }

  if (untagged.length > 0) {
    clusters.set('tag_untagged', untagged);
  }

  return { clusters, modularity: 0 };
}
