import type { NodeType, EdgeType } from '@synapse/core';

export interface TemplateNode {
  id: string;
  type: NodeType;
  label: string;
  content: string;
  tags: string[];
  position: { x: number; y: number };
}

export interface TemplateEdge {
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
}

export interface TemplateResult {
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodeCount: number;
  create: (centerX: number, centerY: number) => TemplateResult;
}

function uid(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const templates: Template[] = [
  {
    id: 'swot',
    name: 'SWOT Analysis',
    description: 'Strengths, Weaknesses, Opportunities, Threats connected to a central topic',
    icon: '⊕',
    nodeCount: 5,
    create: (cx, cy) => {
      const topicId = uid();
      const strengthsId = uid();
      const weaknessesId = uid();
      const opportunitiesId = uid();
      const threatsId = uid();

      return {
        nodes: [
          {
            id: topicId,
            type: 'concept',
            label: 'Central Topic',
            content: '# Central Topic\n\nDefine the subject of your SWOT analysis here.',
            tags: ['swot'],
            position: { x: cx, y: cy },
          },
          {
            id: strengthsId,
            type: 'insight',
            label: 'Strengths',
            content: '# Strengths\n\nInternal positive factors that give advantage.',
            tags: ['swot', 'strengths'],
            position: { x: cx - 180, y: cy - 130 },
          },
          {
            id: weaknessesId,
            type: 'resource',
            label: 'Weaknesses',
            content: '# Weaknesses\n\nInternal negative factors that cause disadvantage.',
            tags: ['swot', 'weaknesses'],
            position: { x: cx + 180, y: cy - 130 },
          },
          {
            id: opportunitiesId,
            type: 'concept',
            label: 'Opportunities',
            content: '# Opportunities\n\nExternal factors that could be leveraged.',
            tags: ['swot', 'opportunities'],
            position: { x: cx - 180, y: cy + 130 },
          },
          {
            id: threatsId,
            type: 'question',
            label: 'Threats',
            content: '# Threats\n\nExternal factors that could cause harm.',
            tags: ['swot', 'threats'],
            position: { x: cx + 180, y: cy + 130 },
          },
        ],
        edges: [
          { source: strengthsId, target: topicId, type: 'supports', label: 'strengthens' },
          { source: weaknessesId, target: topicId, type: 'relates-to', label: 'weakens' },
          { source: opportunitiesId, target: topicId, type: 'relates-to', label: 'can improve' },
          { source: threatsId, target: topicId, type: 'relates-to', label: 'threatens' },
        ],
      };
    },
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Central idea with 5 branch categories for exploration',
    icon: '🧠',
    nodeCount: 6,
    create: (cx, cy) => {
      const centerId = uid();
      const branches = ['Branch 1', 'Branch 2', 'Branch 3', 'Branch 4', 'Branch 5'];
      const angleStep = (2 * Math.PI) / branches.length;
      const radius = 200;

      const branchIds = branches.map(() => uid());

      return {
        nodes: [
          {
            id: centerId,
            type: 'concept',
            label: 'Central Idea',
            content: '# Central Idea\n\nThe main topic of your mind map.',
            tags: ['mindmap'],
            position: { x: cx, y: cy },
          },
          ...branches.map((label, i) => ({
            id: branchIds[i]!,
            type: 'concept' as NodeType,
            label,
            content: `# ${label}\n\nExpand on this branch.`,
            tags: ['mindmap', 'branch'],
            position: {
              x: cx + radius * Math.cos(i * angleStep - Math.PI / 2),
              y: cy + radius * Math.sin(i * angleStep - Math.PI / 2),
            },
          })),
        ],
        edges: branchIds.map((branchId) => ({
          source: centerId,
          target: branchId,
          type: 'relates-to' as EdgeType,
        })),
      };
    },
  },
  {
    id: 'concept-map',
    name: 'Concept Map',
    description: '8 pre-connected concept nodes for knowledge mapping',
    icon: '🗺',
    nodeCount: 8,
    create: (cx, cy) => {
      const ids = Array.from({ length: 8 }, () => uid());
      const labels = [
        'Main Concept', 'Sub-concept A', 'Sub-concept B', 'Sub-concept C',
        'Detail 1', 'Detail 2', 'Example', 'Application',
      ];
      const positions = [
        { x: cx, y: cy },
        { x: cx - 200, y: cy - 100 },
        { x: cx, y: cy - 160 },
        { x: cx + 200, y: cy - 100 },
        { x: cx - 260, y: cy + 80 },
        { x: cx + 260, y: cy + 80 },
        { x: cx - 100, y: cy + 160 },
        { x: cx + 100, y: cy + 160 },
      ];

      return {
        nodes: labels.map((label, i) => ({
          id: ids[i]!,
          type: 'concept' as NodeType,
          label,
          content: `# ${label}\n\nDescribe this concept.`,
          tags: ['concept-map'],
          position: positions[i]!,
        })),
        edges: [
          { source: ids[0]!, target: ids[1]!, type: 'relates-to' as EdgeType, label: 'includes' },
          { source: ids[0]!, target: ids[2]!, type: 'relates-to' as EdgeType, label: 'includes' },
          { source: ids[0]!, target: ids[3]!, type: 'relates-to' as EdgeType, label: 'includes' },
          { source: ids[1]!, target: ids[4]!, type: 'depends-on' as EdgeType },
          { source: ids[3]!, target: ids[5]!, type: 'depends-on' as EdgeType },
          { source: ids[2]!, target: ids[6]!, type: 'causes' as EdgeType, label: 'exemplified by' },
          { source: ids[2]!, target: ids[7]!, type: 'causes' as EdgeType, label: 'applied as' },
          { source: ids[4]!, target: ids[6]!, type: 'supports' as EdgeType },
        ],
      };
    },
  },
  {
    id: 'problem-tree',
    name: 'Problem Tree',
    description: 'Problem node with Root Causes and Effects branches',
    icon: '🌳',
    nodeCount: 7,
    create: (cx, cy) => {
      const problemId = uid();
      const cause1 = uid(); const cause2 = uid(); const cause3 = uid();
      const effect1 = uid(); const effect2 = uid(); const effect3 = uid();

      return {
        nodes: [
          {
            id: problemId, type: 'question', label: 'Core Problem',
            content: '# Core Problem\n\nDefine the central problem clearly.',
            tags: ['problem-tree'], position: { x: cx, y: cy },
          },
          {
            id: cause1, type: 'concept', label: 'Root Cause 1',
            content: '# Root Cause 1\n\nWhy does the problem occur?',
            tags: ['problem-tree', 'cause'], position: { x: cx - 220, y: cy + 150 },
          },
          {
            id: cause2, type: 'concept', label: 'Root Cause 2',
            content: '# Root Cause 2\n\nAnother reason the problem exists.',
            tags: ['problem-tree', 'cause'], position: { x: cx, y: cy + 150 },
          },
          {
            id: cause3, type: 'concept', label: 'Root Cause 3',
            content: '# Root Cause 3\n\nA third contributing factor.',
            tags: ['problem-tree', 'cause'], position: { x: cx + 220, y: cy + 150 },
          },
          {
            id: effect1, type: 'insight', label: 'Effect 1',
            content: '# Effect 1\n\nConsequence of the problem.',
            tags: ['problem-tree', 'effect'], position: { x: cx - 220, y: cy - 150 },
          },
          {
            id: effect2, type: 'insight', label: 'Effect 2',
            content: '# Effect 2\n\nAnother consequence.',
            tags: ['problem-tree', 'effect'], position: { x: cx, y: cy - 150 },
          },
          {
            id: effect3, type: 'insight', label: 'Effect 3',
            content: '# Effect 3\n\nFurther downstream impact.',
            tags: ['problem-tree', 'effect'], position: { x: cx + 220, y: cy - 150 },
          },
        ],
        edges: [
          { source: cause1, target: problemId, type: 'causes' as EdgeType, label: 'causes' },
          { source: cause2, target: problemId, type: 'causes' as EdgeType, label: 'causes' },
          { source: cause3, target: problemId, type: 'causes' as EdgeType, label: 'causes' },
          { source: problemId, target: effect1, type: 'causes' as EdgeType, label: 'leads to' },
          { source: problemId, target: effect2, type: 'causes' as EdgeType, label: 'leads to' },
          { source: problemId, target: effect3, type: 'causes' as EdgeType, label: 'leads to' },
        ],
      };
    },
  },
  {
    id: 'research-map',
    name: 'Research Map',
    description: 'Question → Hypotheses → Evidence → Conclusion',
    icon: '🔬',
    nodeCount: 6,
    create: (cx, cy) => {
      const questionId = uid();
      const hyp1 = uid(); const hyp2 = uid();
      const evid1 = uid(); const evid2 = uid();
      const conclusionId = uid();

      return {
        nodes: [
          {
            id: questionId, type: 'question', label: 'Research Question',
            content: '# Research Question\n\nWhat are you trying to find out?',
            tags: ['research'], position: { x: cx, y: cy - 160 },
          },
          {
            id: hyp1, type: 'concept', label: 'Hypothesis A',
            content: '# Hypothesis A\n\nA testable prediction.',
            tags: ['research', 'hypothesis'], position: { x: cx - 160, y: cy - 40 },
          },
          {
            id: hyp2, type: 'concept', label: 'Hypothesis B',
            content: '# Hypothesis B\n\nAn alternative prediction.',
            tags: ['research', 'hypothesis'], position: { x: cx + 160, y: cy - 40 },
          },
          {
            id: evid1, type: 'resource', label: 'Evidence 1',
            content: '# Evidence 1\n\nData or findings supporting/refuting hypothesis.',
            tags: ['research', 'evidence'], position: { x: cx - 160, y: cy + 120 },
          },
          {
            id: evid2, type: 'resource', label: 'Evidence 2',
            content: '# Evidence 2\n\nAdditional supporting data.',
            tags: ['research', 'evidence'], position: { x: cx + 160, y: cy + 120 },
          },
          {
            id: conclusionId, type: 'insight', label: 'Conclusion',
            content: '# Conclusion\n\nWhat the evidence tells us.',
            tags: ['research', 'conclusion'], position: { x: cx, y: cy + 240 },
          },
        ],
        edges: [
          { source: questionId, target: hyp1, type: 'relates-to' as EdgeType, label: 'generates' },
          { source: questionId, target: hyp2, type: 'relates-to' as EdgeType, label: 'generates' },
          { source: hyp1, target: evid1, type: 'supports' as EdgeType, label: 'tested by' },
          { source: hyp2, target: evid2, type: 'supports' as EdgeType, label: 'tested by' },
          { source: evid1, target: conclusionId, type: 'supports' as EdgeType },
          { source: evid2, target: conclusionId, type: 'supports' as EdgeType },
        ],
      };
    },
  },
  {
    id: 'tech-stack',
    name: 'Tech Stack',
    description: 'Frontend / Backend / Database / DevOps nodes with dependency edges',
    icon: '⚙️',
    nodeCount: 7,
    create: (cx, cy) => {
      const appId = uid();
      const frontendId = uid(); const backendId = uid();
      const dbId = uid(); const cacheId = uid();
      const devopsId = uid(); const monitorId = uid();

      return {
        nodes: [
          {
            id: appId, type: 'concept', label: 'Application',
            content: '# Application\n\nThe overall system.',
            tags: ['tech-stack'], position: { x: cx, y: cy },
          },
          {
            id: frontendId, type: 'resource', label: 'Frontend',
            content: '# Frontend\n\nUser interface layer (React, Vue, etc.)',
            tags: ['tech-stack', 'frontend'], position: { x: cx - 240, y: cy - 80 },
          },
          {
            id: backendId, type: 'resource', label: 'Backend API',
            content: '# Backend API\n\nServer-side logic (Node.js, Python, etc.)',
            tags: ['tech-stack', 'backend'], position: { x: cx + 240, y: cy - 80 },
          },
          {
            id: dbId, type: 'resource', label: 'Database',
            content: '# Database\n\nPersistent data storage (PostgreSQL, MongoDB, etc.)',
            tags: ['tech-stack', 'database'], position: { x: cx + 240, y: cy + 100 },
          },
          {
            id: cacheId, type: 'resource', label: 'Cache',
            content: '# Cache\n\nFast in-memory storage (Redis, Memcached).',
            tags: ['tech-stack', 'cache'], position: { x: cx, y: cy + 160 },
          },
          {
            id: devopsId, type: 'concept', label: 'DevOps / CI-CD',
            content: '# DevOps\n\nDeployment pipelines, containers, IaC.',
            tags: ['tech-stack', 'devops'], position: { x: cx - 240, y: cy + 100 },
          },
          {
            id: monitorId, type: 'insight', label: 'Monitoring',
            content: '# Monitoring\n\nLogs, metrics, alerts.',
            tags: ['tech-stack', 'monitoring'], position: { x: cx, y: cy - 180 },
          },
        ],
        edges: [
          { source: frontendId, target: backendId, type: 'depends-on' as EdgeType, label: 'calls' },
          { source: backendId, target: dbId, type: 'depends-on' as EdgeType, label: 'reads/writes' },
          { source: backendId, target: cacheId, type: 'depends-on' as EdgeType, label: 'caches' },
          { source: devopsId, target: appId, type: 'supports' as EdgeType, label: 'deploys' },
          { source: monitorId, target: appId, type: 'supports' as EdgeType, label: 'observes' },
          { source: frontendId, target: appId, type: 'relates-to' as EdgeType },
          { source: backendId, target: appId, type: 'relates-to' as EdgeType },
        ],
      };
    },
  },
  {
    id: 'book-map',
    name: 'Book Map',
    description: 'Chapter nodes with themes, characters, and concepts connected',
    icon: '📚',
    nodeCount: 8,
    create: (cx, cy) => {
      const bookId = uid();
      const ch1 = uid(); const ch2 = uid(); const ch3 = uid();
      const theme1 = uid(); const theme2 = uid();
      const char1 = uid(); const char2 = uid();

      return {
        nodes: [
          {
            id: bookId, type: 'concept', label: 'Book Title',
            content: '# Book Title\n\nAuthor, year, summary.',
            tags: ['book-map'], position: { x: cx, y: cy },
          },
          {
            id: ch1, type: 'resource', label: 'Chapter 1',
            content: '# Chapter 1\n\nKey events and insights.',
            tags: ['book-map', 'chapter'], position: { x: cx - 220, y: cy - 120 },
          },
          {
            id: ch2, type: 'resource', label: 'Chapter 2',
            content: '# Chapter 2\n\nContinuation of the narrative.',
            tags: ['book-map', 'chapter'], position: { x: cx, y: cy - 180 },
          },
          {
            id: ch3, type: 'resource', label: 'Chapter 3',
            content: '# Chapter 3\n\nClimax and resolution.',
            tags: ['book-map', 'chapter'], position: { x: cx + 220, y: cy - 120 },
          },
          {
            id: theme1, type: 'insight', label: 'Theme: Redemption',
            content: '# Theme: Redemption\n\nHow redemption appears throughout the book.',
            tags: ['book-map', 'theme'], position: { x: cx - 220, y: cy + 120 },
          },
          {
            id: theme2, type: 'insight', label: 'Theme: Identity',
            content: '# Theme: Identity\n\nQuestions of self explored in the narrative.',
            tags: ['book-map', 'theme'], position: { x: cx + 220, y: cy + 120 },
          },
          {
            id: char1, type: 'concept', label: 'Protagonist',
            content: '# Protagonist\n\nMain character arc and motivations.',
            tags: ['book-map', 'character'], position: { x: cx - 120, y: cy + 220 },
          },
          {
            id: char2, type: 'concept', label: 'Antagonist',
            content: '# Antagonist\n\nOpposing force and role in the story.',
            tags: ['book-map', 'character'], position: { x: cx + 120, y: cy + 220 },
          },
        ],
        edges: [
          { source: bookId, target: ch1, type: 'relates-to' as EdgeType },
          { source: bookId, target: ch2, type: 'relates-to' as EdgeType },
          { source: bookId, target: ch3, type: 'relates-to' as EdgeType },
          { source: ch1, target: theme1, type: 'supports' as EdgeType, label: 'explores' },
          { source: ch3, target: theme2, type: 'supports' as EdgeType, label: 'explores' },
          { source: char1, target: theme1, type: 'relates-to' as EdgeType },
          { source: char2, target: theme2, type: 'relates-to' as EdgeType },
          { source: char1, target: char2, type: 'contradicts' as EdgeType, label: 'conflicts with' },
        ],
      };
    },
  },
];
