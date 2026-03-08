# Contributing to Synapse

Thank you for your interest in contributing to Synapse! This project thrives because of contributors like you. Whether you are fixing a typo, implementing a new feature, or improving the documentation, every contribution matters.

Please read this guide carefully before contributing. It will save you time and help us review your work faster.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Good First Issues](#good-first-issues)
- [Getting Help](#getting-help)

---

## Code of Conduct

Synapse is committed to providing a welcoming, inclusive, and harassment-free environment for everyone. By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

Violations can be reported to **stalwartszen@gmail.com**. All reports will be handled confidentially.

---

## Reporting Bugs

Before filing a bug report, please:

1. **Search existing issues** to avoid duplicates — the bug may already be known.
2. **Check the latest `main` branch** to see if the bug has already been fixed.
3. **Reproduce the bug** with the minimal steps possible.

When you are ready to report, open an issue using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml). You will be asked for:

- A clear, concise description of the bug
- Steps to reproduce it
- What you expected to happen vs. what actually happened
- Your environment (OS, Node.js version, browser, Synapse version)
- Screenshots, error logs, or screen recordings if applicable

**Security vulnerabilities must NOT be reported as public GitHub issues.** See [SECURITY.md](SECURITY.md) for how to report security issues privately.

---

## Suggesting Features

We love feature suggestions! Before opening a feature request:

1. **Search existing issues and discussions** to avoid duplicates.
2. **Check the roadmap** in `README.md` to see if your idea is already planned.
3. **Consider the project scope** — Synapse focuses on knowledge graphs and real-time collaboration.

Open a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) and describe:

- The problem you are solving (focus on the "why", not just the "what")
- Your proposed solution
- Alternative approaches you considered
- Potential drawbacks or trade-offs

For large or breaking changes, please open a **GitHub Discussion** first to gather community feedback before implementation begins. This prevents wasted effort.

---

## Development Setup

### Prerequisites

Ensure you have the following installed:

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | >= 18.0.0 | Use `.nvmrc` with `nvm use` |
| pnpm | >= 8.0.0 | `npm install -g pnpm` |
| Git | >= 2.40.0 | |

### Step 1: Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/synapse.git
cd synapse

# Add the upstream remote
git remote add upstream https://github.com/stalwartszen/synapse.git
git remote -v  # Verify remotes
```

### Step 2: Set Up Node.js

```bash
# If using nvm
nvm install
nvm use

# Verify
node --version  # Should match .nvmrc
```

### Step 3: Install Dependencies

```bash
pnpm install
```

This installs dependencies for all workspaces (root, `apps/web`, `packages/core`, `packages/ui`) in a single command.

### Step 4: Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your local configuration (API URLs, feature flags, etc.)
```

### Step 5: Start the Development Server

```bash
# Start all apps and packages in watch mode
pnpm dev

# Or start only the web app
pnpm --filter @synapse/web dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 6: Run Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm --filter @synapse/web test:watch

# Run tests with coverage
pnpm test:coverage
```

### Step 7: Lint and Format

```bash
# Check for linting errors
pnpm lint

# Auto-fix linting errors
pnpm lint:fix

# Format code
pnpm format

# Type-check all packages
pnpm typecheck
```

### Keeping Your Fork Up to Date

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## Project Structure

Understanding the project layout will help you find your way around:

```
synapse/
├── apps/
│   └── web/                  # The main React application
│       ├── src/
│       │   ├── components/   # UI components (presentational + container)
│       │   ├── hooks/        # Custom React hooks (business logic)
│       │   ├── store/        # Zustand state stores
│       │   ├── services/     # External service integrations (WebSocket, API)
│       │   ├── types/        # App-level TypeScript types
│       │   ├── utils/        # Pure utility functions
│       │   └── pages/        # Route-level page components
│       └── vite.config.ts
├── packages/
│   ├── core/                 # Framework-agnostic graph engine
│   │   └── src/
│   │       ├── graph/        # Core graph data structures
│   │       └── algorithms/   # Layout, pathfinding, clustering
│   └── ui/                   # Shared design system
│       └── src/
│           ├── components/   # Reusable UI primitives
│           └── tokens/       # Design tokens (colors, spacing, type)
├── docs/                     # Architecture docs, guides, API reference
└── scripts/                  # Automation scripts
```

**Key principle:** `packages/core` must remain framework-agnostic (no React imports). It is a pure TypeScript library that `apps/web` depends on. This allows the core engine to be used in other contexts (CLI tools, server-side processing, etc.).

---

## Coding Standards

### TypeScript

- **Strict mode is required.** All `tsconfig.json` files extend `tsconfig.base.json` which enables `"strict": true`. Do not disable strict checks.
- **Avoid `any`.** Use `unknown` when the type is genuinely unknown, then narrow it. Use generics to preserve type information.
- **Prefer interfaces over type aliases** for object shapes that may be extended. Use `type` for unions, intersections, and mapped types.
- **Export types explicitly.** Use `export type { ... }` for type-only exports to support `isolatedModules`.
- **Document public APIs** with JSDoc comments. Internal implementation details do not require JSDoc.

```typescript
// Good
export interface GraphNode {
  id: string;
  label: string;
}

export function findNode(graph: Graph, id: string): GraphNode | undefined {
  return graph.nodes.get(id);
}

// Bad
export function findNode(graph: any, id: any): any {
  return graph.nodes[id];
}
```

### React

- **Functional components only.** Do not use class components.
- **Hooks for state and side effects.** Prefer custom hooks to encapsulate complex logic — keep components focused on rendering.
- **Avoid inline object/array literals in JSX** where they cause unnecessary re-renders. Memoize with `useMemo` and `useCallback` when profiling shows a need.
- **Use `key` props correctly.** Never use array indices as keys for dynamic lists.
- **Accessibility first.** All interactive elements must be keyboard accessible and have appropriate ARIA attributes.

### CSS / Styling

- **CSS Modules** for component-level styles. File names must be `ComponentName.module.css`.
- **Design tokens** from `packages/ui/src/tokens/` for all colors, spacing, and typography values. No hardcoded hex codes or pixel values outside of tokens.
- **No inline styles** except for dynamic values (e.g., positioning in the graph canvas).

### File Organization

- One React component per file.
- Component file names use PascalCase (`GraphNode.tsx`).
- Hook file names use camelCase with `use` prefix (`useGraph.ts`).
- Utility function files use camelCase (`graphUtils.ts`).
- Each directory should have an `index.ts` barrel file that re-exports public members.

---

## Branch Naming Conventions

All branches must be named using one of the following prefixes:

| Prefix | Use Case | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/force-directed-layout` |
| `fix/` | Bug fixes | `fix/node-drag-offset` |
| `docs/` | Documentation only | `docs/plugin-system-guide` |
| `chore/` | Tooling, deps, config | `chore/update-vite-5` |
| `refactor/` | Code restructuring (no behavior change) | `refactor/graph-store` |
| `perf/` | Performance improvements | `perf/canvas-render-batching` |
| `test/` | Adding or fixing tests | `test/graph-engine-unit` |
| `ci/` | CI/CD pipeline changes | `ci/add-codeql` |

Branch names must be lowercase, using hyphens as separators. No spaces or special characters.

---

## Commit Message Format

Synapse uses **Conventional Commits** to enable automatic changelog generation and semantic versioning.

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer(s) — BREAKING CHANGE, closes #issue]
```

### Types

| Type | When to Use |
|------|------------|
| `feat` | A new feature for users |
| `fix` | A bug fix for users |
| `docs` | Documentation changes only |
| `style` | Formatting changes (whitespace, semicolons, etc.) |
| `refactor` | Code restructuring with no behavior change |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency, or tooling changes |
| `ci` | CI/CD configuration changes |
| `revert` | Reverts a previous commit |

### Scopes

Scopes narrow the area of change. Use one of:

- `core` — changes to `packages/core`
- `ui` — changes to `packages/ui`
- `web` — changes to `apps/web`
- `graph` — graph rendering and interaction
- `collab` — collaboration/WebSocket features
- `api` — API service layer
- `store` — state management
- `ci` — CI/CD pipelines
- `deps` — dependency updates

### Examples

```bash
# Good commit messages
feat(graph): add force-directed layout algorithm
fix(collab): resolve cursor position offset on zoom
docs(core): add JSDoc to GraphEngine public methods
perf(graph): batch canvas draw calls for 60fps rendering
chore(deps): update react to 18.3.1

# With body and footer
feat(core): implement Louvain community detection algorithm

The clustering algorithm groups densely connected nodes into
communities, making it easier to identify concept clusters in
large knowledge graphs.

Closes #142
BREAKING CHANGE: GraphEngine.cluster() now returns ClusterResult instead of Node[][]
```

### Commit Message Do's and Don'ts

- **Do** write the subject line in imperative mood ("add feature" not "adds feature" or "added feature")
- **Do** limit the subject line to 72 characters
- **Do** explain the reasoning in the body when the commit is not self-evident
- **Don't** end the subject line with a period
- **Don't** include "WIP" in commits merged to `main`

---

## Pull Request Process

### Before Opening a PR

1. **Make sure there is an issue** for your change (unless it is a trivial fix like a typo). Reference it in your PR.
2. **Branch from `main`**, not from another feature branch.
3. **Keep PRs focused.** One logical change per PR. If your change is large, consider breaking it into a series of smaller PRs.
4. **Ensure all checks pass locally:**
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```

### Opening the PR

1. Push your branch to your fork: `git push origin feat/your-feature`
2. Open a PR against `main` in the upstream repository.
3. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely. Incomplete PRs will be closed.
4. **Open as a Draft PR** if you want early feedback before the work is complete.

### PR Title

PR titles must follow the same Conventional Commits format as commit messages:

```
feat(graph): add force-directed layout algorithm
```

### Review Process

- A maintainer will review your PR within **5 business days**.
- Automated CI checks must pass before review.
- The PR requires **at least one approving review** from a maintainer before merging.
- Address review comments by pushing new commits (do not force-push during review).
- Mark conversations as resolved only when you have addressed the feedback.

### Review Checklist

Reviewers will check for:

- [ ] The change solves the stated problem effectively
- [ ] TypeScript types are correct and no `any` is introduced
- [ ] New functionality has unit tests with adequate coverage
- [ ] Edge cases are handled (null inputs, network errors, empty states)
- [ ] No performance regressions (check bundle size, rendering benchmarks)
- [ ] Accessibility: keyboard navigation and ARIA attributes
- [ ] Documentation is updated if the public API changes
- [ ] No hardcoded strings that should be constants or i18n keys
- [ ] Commit history is clean and follows Conventional Commits

### Merging

PRs are merged using **Squash and Merge** to keep the `main` history linear and readable. The squashed commit message will be the PR title, so make sure it is a valid Conventional Commit.

---

## Testing Requirements

All code contributions must include tests. We use **Vitest** for unit and integration tests.

### Unit Tests

- Every public function in `packages/core` must have unit tests.
- Custom React hooks must be tested with `@testing-library/react-hooks`.
- Utility functions must have unit tests covering normal cases, edge cases, and error cases.
- Target: **80% line coverage minimum** for new code.

### Integration Tests

- Complex user interactions (e.g., creating a node, connecting two nodes) should have integration tests using `@testing-library/react`.
- Test files live alongside the source file: `GraphEngine.test.ts` next to `GraphEngine.ts`.

### Writing Good Tests

```typescript
// Good: descriptive names, arrange-act-assert pattern
describe('GraphEngine', () => {
  describe('addNode', () => {
    it('should add a node with the given id to the graph', () => {
      // Arrange
      const engine = new GraphEngine();
      const node: GraphNode = { id: 'n1', label: 'Test Node', ... };

      // Act
      engine.addNode(node);

      // Assert
      expect(engine.getNode('n1')).toEqual(node);
    });

    it('should throw if a node with the same id already exists', () => {
      const engine = new GraphEngine();
      engine.addNode({ id: 'n1', label: 'Node 1', ... });

      expect(() => engine.addNode({ id: 'n1', label: 'Duplicate', ... }))
        .toThrow('Node with id "n1" already exists');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @synapse/core test

# Watch mode
pnpm --filter @synapse/web test:watch

# With coverage report
pnpm test:coverage
```

---

## Documentation Requirements

If your contribution changes or adds public APIs, user-facing behaviour, or architectural patterns, documentation must be updated in the same PR.

### Code Documentation

- Public functions, classes, and types in `packages/core` and `packages/ui` require **JSDoc comments**.
- JSDoc should describe the purpose, parameters, return value, and any thrown errors.
- Include a usage example for non-obvious APIs.

### Docs Directory

- New architectural decisions → `docs/architecture.md` (add an ADR section)
- New plugin capabilities → `docs/plugin-system.md`
- New API endpoints or SDK methods → `docs/api-reference.md`
- Complex new workflows → `docs/contributing-guide.md`

### README Updates

Update `README.md` if you add a major feature, change a configuration option, or alter the setup steps.

---

## Good First Issues

New to Synapse? Look for issues labeled [`good first issue`](https://github.com/stalwartszen/synapse/labels/good%20first%20issue). These are tasks that:

- Have a clear, well-defined scope
- Do not require deep knowledge of the entire codebase
- Have a mentor or maintainer assigned who will guide you

Also check:

- [`help wanted`](https://github.com/stalwartszen/synapse/labels/help%20wanted) — Good second or third issues
- [`documentation`](https://github.com/stalwartszen/synapse/labels/documentation) — Great for getting familiar with the codebase
- [`performance`](https://github.com/stalwartszen/synapse/labels/performance) — If you love optimization

**Comment on the issue before starting work** to claim it and avoid duplicate effort. A maintainer will confirm assignment.

---

## Getting Help

Stuck? We are here to help:

- **GitHub Discussions** — Ask questions, share ideas: [Discussions](https://github.com/stalwartszen/synapse/discussions)
- **Email** — Reach Kushal directly: [stalwartszen@gmail.com](mailto:stalwartszen@gmail.com)
- **Issue Comments** — Ask clarifying questions on the issue you are working on

When asking for help, please provide:
- What you are trying to do
- What you have already tried
- Relevant code snippets or error messages
- Your environment (OS, Node.js version, etc.)

---

Thank you for contributing to Synapse. Your time and effort make this project better for everyone.
