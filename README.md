# Synapse

<div align="center">

<img src="apps/web/public/favicon.svg" alt="Synapse Logo" width="120" height="120" />

**Real-time Collaborative Knowledge Graph & Mind-Mapping Platform**

[![CI](https://github.com/your-org/synapse/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/synapse/actions/workflows/ci.yml)
[![CodeQL](https://github.com/your-org/synapse/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/your-org/synapse/actions/workflows/codeql-analysis.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![npm version](https://img.shields.io/npm/v/@synapse/core)](https://www.npmjs.com/package/@synapse/core)
[![Coverage](https://img.shields.io/codecov/c/github/your-org/synapse)](https://codecov.io/gh/your-org/synapse)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

[Live Demo](https://synapse-demo.vercel.app) · [Documentation](https://synapse-docs.vercel.app) · [Report Bug](https://github.com/your-org/synapse/issues/new?template=bug_report.yml) · [Request Feature](https://github.com/your-org/synapse/issues/new?template=feature_request.yml)

</div>

---

## What is Synapse?

Synapse is an open-source, real-time collaborative knowledge graph and mind-mapping platform that helps individuals and teams visually connect ideas, trace relationships between concepts, and build shared understanding at scale.

Think **Obsidian** for knowledge linking, **Miro** for visual collaboration, and **Notion's Graph View** for relationship discovery — all in one open-source platform your team fully controls.

Whether you are mapping a complex software architecture, planning a research project, brainstorming product strategy, or building a company-wide knowledge base, Synapse gives you the visual and collaborative tools to do it together, in real time.

---

## Features

### Core Graph Capabilities
- **Interactive Knowledge Graph** — Drag, drop, connect, and rearrange nodes with smooth, hardware-accelerated rendering
- **Rich Node Types** — Concepts, resources, questions, insights, and custom-typed nodes with full Markdown content
- **Smart Edge Relationships** — Typed, weighted edges with directional and bidirectional support
- **Force-Directed Layout** — Auto-arrange nodes using physics-based simulation (Fruchterman–Reingold algorithm)
- **Cluster Detection** — Automatic community detection to discover hidden relationship clusters
- **Path Finding** — Visualize shortest and all paths between any two nodes

### Real-Time Collaboration
- **Live Multiplayer Editing** — See collaborators' cursors, selections, and edits as they happen via WebSocket
- **Presence Awareness** — Know who is viewing and editing with live avatar indicators
- **Conflict-Free Sync** — Operational Transform-based conflict resolution keeps everyone in sync
- **Offline Support** — Continue working offline; changes sync automatically when reconnected
- **Permission System** — Granular view/comment/edit/admin permissions per graph

### Knowledge Management
- **Full-Text Search** — Instant search across all nodes, edges, and content with relevance ranking
- **Tags & Metadata** — Flexible tagging, custom metadata fields, and filtering
- **Version History** — Complete change history with diff view and one-click rollback
- **Templates** — Pre-built graph templates for common workflows (SWOT, mind map, org chart, etc.)

### Export & Integration
- **Export Formats** — PNG, SVG, PDF, JSON, Markdown, Obsidian-compatible format
- **REST & GraphQL API** — Full programmatic access to all graph operations
- **Webhook Support** — Trigger external workflows on graph events
- **Plugin System** — Extend Synapse with custom node types, layouts, and exporters (see [Plugin System](docs/plugin-system.md))
- **Embed Anywhere** — Embed read-only or collaborative graphs into any website or wiki

### Developer Experience
- **TypeScript First** — Strict TypeScript throughout with full type inference
- **Monorepo Architecture** — Turborepo-powered with shared packages and fast incremental builds
- **Comprehensive Tests** — Unit, integration, and end-to-end test coverage
- **Self-Hostable** — Run Synapse entirely on your own infrastructure with Docker Compose

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0 (use `.nvmrc` or [nvm](https://github.com/nvm-sh/nvm))
- pnpm >= 8.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/synapse.git
cd synapse

# Use the correct Node.js version
nvm use

# Install dependencies (all workspaces)
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

### One-Line Setup (with nvm)

```bash
git clone https://github.com/your-org/synapse.git && cd synapse && nvm use && pnpm install && pnpm dev
```

### Docker (Self-Hosting)

```bash
# Copy and configure environment variables
cp .env.example .env

# Start all services
docker compose up -d

# Open in browser
open http://localhost:3000
```

---

## Architecture Overview

Synapse is built as a **Turborepo monorepo** with a clean separation between the web application and reusable packages.

```
synapse/
├── apps/
│   └── web/            # React 18 + Vite application (the main UI)
├── packages/
│   ├── core/           # Graph engine, algorithms, and shared logic
│   └── ui/             # Shared design system components and tokens
└── docs/               # Architecture docs, API reference, guides
```

### Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | React 18 | Concurrent features, wide ecosystem |
| Build Tool | Vite 5 | Near-instant HMR, optimized production builds |
| Language | TypeScript 5.3 (strict) | Type safety, refactoring confidence |
| Monorepo | Turborepo | Incremental builds, task orchestration |
| State | Zustand | Minimal, performant, devtools-friendly |
| Real-time | WebSocket (native) | Low-latency collaboration |
| Graph Render | Custom Canvas API | Full control, high performance |
| Styling | CSS Modules + Tokens | Scoped styles, zero runtime cost |
| Testing | Vitest + Testing Library | Fast, ESM-native testing |
| Linting | ESLint + TypeScript ESLint | Strict code quality |
| Formatting | Prettier | Consistent code style |
| CI/CD | GitHub Actions | Free for open source, well-integrated |

### Data Flow

```
User Interaction
      │
      ▼
React Components (apps/web/src/components/)
      │
      ▼
Custom Hooks (apps/web/src/hooks/)  ←──── WebSocket Service
      │                                        │
      ▼                                        │
Zustand Stores (apps/web/src/store/)          │
      │                                        │
      ▼                                   Collaboration
Core Graph Engine (packages/core/)        (real-time)
      │
      ▼
Canvas Renderer → Displayed Graph
```

For a deep dive into architectural decisions and rationale, see [docs/architecture.md](docs/architecture.md).

---

## Plugin System

Synapse supports a rich plugin system that lets you extend core functionality without forking the project.

```typescript
import { definePlugin } from '@synapse/core';

export default definePlugin({
  id: 'my-custom-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',

  // Register custom node types
  nodeTypes: {
    'github-issue': GitHubIssueNode,
  },

  // Register custom layout algorithms
  layouts: {
    'hierarchical': HierarchicalLayout,
  },

  // Register custom export formats
  exporters: {
    'notion': NotionExporter,
  },

  // Hook into graph lifecycle events
  hooks: {
    onNodeCreate: async (node) => enrichNodeWithMetadata(node),
    onGraphSave: async (graph) => backupToS3(graph),
  },
});
```

See [docs/plugin-system.md](docs/plugin-system.md) for the full plugin API reference.

---

## Roadmap

### v0.2.0 — Enhanced Collaboration
- [ ] Operational Transform (CRDT-based) conflict resolution
- [ ] Voice/video presence indicators
- [ ] Threaded comments on nodes and edges
- [ ] @mention notifications

### v0.3.0 — AI Integration
- [ ] AI-suggested connections between nodes
- [ ] Auto-summarize graph clusters into documents
- [ ] Natural language query over the graph ("Show me all concepts related to X")
- [ ] Smart tagging and categorization

### v0.4.0 — Integrations
- [ ] GitHub Issues / PRs as nodes
- [ ] Notion / Confluence import/export
- [ ] Slack integration for graph updates
- [ ] Zapier / Make webhooks

### v1.0.0 — Production Ready
- [ ] Full mobile support
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Enterprise SSO (SAML, OIDC)
- [ ] Audit logs

See the [open milestones](https://github.com/your-org/synapse/milestones) for detailed tracking.

---

## Contributing

We welcome contributions of all kinds — from bug reports and documentation improvements to new features and plugin development. Synapse is built by and for the community.

**Getting started:**

1. Read our [Contributing Guide](CONTRIBUTING.md)
2. Check the [good first issues](https://github.com/your-org/synapse/labels/good%20first%20issue) label
3. Join the discussion on [Discord](https://discord.gg/synapse)

**Key contribution areas:**
- Graph layout algorithms (we love new algorithms!)
- Plugin development and the plugin SDK
- Accessibility improvements
- Internationalization (i18n)
- Documentation and tutorials
- Bug fixes with test coverage

---

## Community

- **Discord**: [discord.gg/synapse](https://discord.gg/synapse) — Chat with contributors and users
- **GitHub Discussions**: [Discussions](https://github.com/your-org/synapse/discussions) — RFCs, Q&A, show-and-tell
- **Twitter/X**: [@SynapseGraph](https://twitter.com/SynapseGraph) — Announcements and updates
- **Blog**: [synapse-blog.vercel.app](https://synapse-blog.vercel.app) — Deep dives and tutorials

---

## License

Synapse is open-source software licensed under the [MIT License](LICENSE).

Copyright (c) 2026 The Synapse Contributors.

---

<div align="center">

Built with care by the open-source community.

**[Star us on GitHub](https://github.com/your-org/synapse)** if Synapse helps you think better together.

</div>
