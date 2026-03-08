import type { NodeType, EdgeType } from '@synapse/core';

export interface ImportedNode {
  id: string;
  type: NodeType;
  label: string;
  content: string;
  tags: string[];
  position: { x: number; y: number };
}

export interface ImportedEdge {
  source: string;
  target: string;
  type: EdgeType;
}

export interface ImportResult {
  nodes: ImportedNode[];
  edges: ImportedEdge[];
}

function generateId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Parse a single Markdown file into nodes and detect wikilinks for edges.
 * Returns a node for the file and a list of wikilink targets.
 */
function parseMarkdownFile(
  content: string,
  filename: string,
): { node: ImportedNode; wikilinks: string[] } {
  // Extract the title from first H1, or use filename
  const h1Match = content.match(/^#\s+(.+)$/m);
  const label = h1Match ? h1Match[1]!.trim() : filename.replace(/\.md$/i, '');

  // Extract tags from #tag syntax (not in headings)
  const tagMatches = content.match(/(?<!\[)#([a-zA-Z][a-zA-Z0-9_-]*)/g) ?? [];
  const tags = tagMatches.map((t) => t.slice(1)).filter((t) => t.length > 1 && t !== 'tag');

  // Extract wikilinks [[Target Name]]
  const wikilinkMatches = content.match(/\[\[([^\]]+)\]\]/g) ?? [];
  const wikilinks = wikilinkMatches.map((wl) => {
    // Handle [[Name|Alias]] format
    const inner = wl.slice(2, -2);
    return inner.split('|')[0]!.trim();
  });

  // Clean up content (remove wikilinks, leave content readable)
  const cleanContent = content.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');

  const node: ImportedNode = {
    id: generateId(),
    type: 'concept',
    label,
    content: cleanContent,
    tags: [...new Set(tags)],
    position: { x: 0, y: 0 }, // will be positioned after import
  };

  return { node, wikilinks };
}

/**
 * Import one or more Markdown files into graph nodes and edges.
 * Each file becomes a node. [[wikilinks]] between files become edges.
 * Multiple files can be imported at once.
 */
export function importFromMarkdown(
  files: Array<{ content: string; filename: string }>,
  centerX: number = 400,
  centerY: number = 300,
): ImportResult {
  const nodesByLabel = new Map<string, ImportedNode>();
  const wikilinksByNodeId = new Map<string, string[]>();

  // Parse each file
  for (const file of files) {
    const { node, wikilinks } = parseMarkdownFile(file.content, file.filename);
    nodesByLabel.set(node.label.toLowerCase(), node);
    wikilinksByNodeId.set(node.id, wikilinks);
  }

  // Position nodes in a circle
  const nodeArray = Array.from(nodesByLabel.values());
  const radius = Math.max(150, nodeArray.length * 40);
  const angleStep = (2 * Math.PI) / Math.max(1, nodeArray.length);

  nodeArray.forEach((node, i) => {
    node.position = {
      x: centerX + radius * Math.cos(i * angleStep - Math.PI / 2),
      y: centerY + radius * Math.sin(i * angleStep - Math.PI / 2),
    };
  });

  // Resolve wikilinks to edges
  const edges: ImportedEdge[] = [];
  const addedEdges = new Set<string>();

  for (const [nodeId, wikilinks] of wikilinksByNodeId) {
    for (const target of wikilinks) {
      const targetNode = nodesByLabel.get(target.toLowerCase());
      if (targetNode && targetNode.id !== nodeId) {
        const edgeKey = [nodeId, targetNode.id].sort().join(':');
        if (!addedEdges.has(edgeKey)) {
          addedEdges.add(edgeKey);
          edges.push({
            source: nodeId,
            target: targetNode.id,
            type: 'relates-to',
          });
        }
      }
    }
  }

  return {
    nodes: nodeArray,
    edges,
  };
}

/**
 * Import a single Markdown file.
 */
export function importSingleMarkdown(
  content: string,
  filename: string,
  centerX: number = 400,
  centerY: number = 300,
): ImportResult {
  return importFromMarkdown([{ content, filename }], centerX, centerY);
}
