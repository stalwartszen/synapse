/**
 * AI service powered by Claude API (claude-sonnet-4-6).
 * All API calls go through the Anthropic Messages API.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const STORAGE_KEY = 'synapse-anthropic-key';

export interface NodeSummary {
  id: string;
  label: string;
  content?: string;
  type: string;
}

export interface SuggestedEdge {
  sourceId: string;
  targetId: string;
  sourceLabel: string;
  targetLabel: string;
  reason: string;
  edgeType: string;
}

export interface AIError {
  type: 'no-key' | 'network' | 'rate-limit' | 'api-error';
  message: string;
}

/**
 * Get the stored API key.
 */
export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Store the API key.
 */
export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

/**
 * Clear the stored API key.
 */
export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Call the Claude API with a prompt.
 */
async function callClaude(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  maxTokens: number = 1024,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (response.status === 401) {
    throw { type: 'api-error', message: 'Invalid API key. Please check your Anthropic API key in Settings.' } as AIError;
  }
  if (response.status === 429) {
    throw { type: 'rate-limit', message: 'Rate limit reached. Please wait a moment and try again.' } as AIError;
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw { type: 'api-error', message: `API error ${response.status}: ${body.slice(0, 200)}` } as AIError;
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const textBlock = data.content.find((c) => c.type === 'text');
  if (!textBlock) throw { type: 'api-error', message: 'No text response from Claude.' } as AIError;

  return textBlock.text;
}

/**
 * Suggest connections between nodes.
 * Returns suggested edges with reasoning.
 */
export async function suggestConnections(nodes: NodeSummary[]): Promise<SuggestedEdge[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw { type: 'no-key', message: 'No API key set. Please add your Anthropic API key in Settings (,).' } as AIError;
  }

  if (nodes.length < 2) {
    return [];
  }

  const systemPrompt = `You are a knowledge graph assistant. Your job is to identify meaningful conceptual connections between nodes in a knowledge graph.
Be precise and suggest only high-quality, non-obvious connections.
Always respond with valid JSON only, no other text.`;

  const nodeList = nodes.map((n) => `- ID: ${n.id} | Label: "${n.label}" | Type: ${n.type}${n.content ? ` | Content snippet: "${n.content.slice(0, 100)}"` : ''}`).join('\n');

  const userMessage = `Given these knowledge graph nodes:
${nodeList}

Suggest up to 5 meaningful connections that don't already exist between these nodes.
For each suggestion, provide:
- sourceId: the ID of the source node
- targetId: the ID of the target node
- reason: a brief explanation (max 20 words) of why they're connected
- edgeType: one of "relates-to", "depends-on", "causes", "supports", "contradicts"

Respond ONLY with a JSON array like:
[{"sourceId":"...","targetId":"...","reason":"...","edgeType":"..."}]

If no good connections exist, return an empty array: []`;

  const raw = await callClaude(systemPrompt, userMessage, apiKey, 512);

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      sourceId: string;
      targetId: string;
      reason: string;
      edgeType: string;
    }>;

    return parsed.map((item) => {
      const sourceNode = nodes.find((n) => n.id === item.sourceId);
      const targetNode = nodes.find((n) => n.id === item.targetId);
      return {
        sourceId: item.sourceId,
        targetId: item.targetId,
        sourceLabel: sourceNode?.label ?? item.sourceId,
        targetLabel: targetNode?.label ?? item.targetId,
        reason: item.reason,
        edgeType: item.edgeType,
      };
    }).filter((item) => item.sourceId && item.targetId && item.sourceId !== item.targetId);
  } catch {
    return [];
  }
}

/**
 * Find nodes matching a natural language query.
 * Returns an array of matching node IDs.
 */
export async function naturalLanguageSearch(
  query: string,
  nodes: NodeSummary[],
): Promise<string[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw { type: 'no-key', message: 'No API key set. Please add your Anthropic API key in Settings (,).' } as AIError;
  }

  if (nodes.length === 0) return [];

  const systemPrompt = `You are a semantic search assistant for a knowledge graph. Given a natural language query and a list of nodes, return the IDs of nodes that are semantically relevant to the query.
Always respond with valid JSON only.`;

  const nodeList = nodes.map((n) => `ID: ${n.id} | "${n.label}" (${n.type})${n.content ? ` - ${n.content.slice(0, 80)}` : ''}`).join('\n');

  const userMessage = `Query: "${query}"

Nodes:
${nodeList}

Return a JSON array of IDs of nodes that match or are related to the query. Include nodes that are directly or conceptually relevant.
Respond ONLY with: ["id1","id2",...]
If nothing matches, return: []`;

  const raw = await callClaude(systemPrompt, userMessage, apiKey, 256);

  try {
    const jsonMatch = raw.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as string[];
    const validIds = new Set(nodes.map((n) => n.id));
    return parsed.filter((id) => validIds.has(id));
  } catch {
    return [];
  }
}

/**
 * Generate content for a node based on its label and context.
 */
export async function generateNodeContent(
  nodeLabel: string,
  nodeType: string,
  connectedNodeLabels: string[],
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw { type: 'no-key', message: 'No API key set. Please add your Anthropic API key in Settings (,).' } as AIError;
  }

  const systemPrompt = `You are a knowledge base assistant. Generate concise, informative content for knowledge graph nodes.
Format your response as Markdown. Be concise (2-4 paragraphs max). Start with a # heading matching the node label.`;

  const contextStr = connectedNodeLabels.length > 0
    ? `\nThis node is connected to: ${connectedNodeLabels.join(', ')}`
    : '';

  const userMessage = `Generate content for a knowledge graph node:
- Label: "${nodeLabel}"
- Type: ${nodeType}${contextStr}

Write a helpful, informative explanation of this concept in Markdown format.`;

  return callClaude(systemPrompt, userMessage, apiKey, 512);
}
