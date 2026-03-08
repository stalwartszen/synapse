import React, { useState } from 'react';
import type { AppRoute } from '../App.js';
import { useGraph } from '../hooks/useGraph.js';
import { seedExampleGraph } from '../store/graphStore.js';

interface HomePageProps {
  onNavigate: (route: AppRoute, graphId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [graphName, setGraphName] = useState('My Knowledge Graph');
  const graph = useGraph();

  const handleCreateGraph = () => {
    graph.initGraph(undefined, graphName.trim() !== '' ? graphName.trim() : 'Untitled Graph');
    onNavigate('graph');
  };

  const handleOpenExample = () => {
    seedExampleGraph();
    onNavigate('graph');
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoRow}>
          <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#0f1117" />
            <circle cx="32" cy="32" r="7" fill="#6366f1" />
            <circle cx="14" cy="18" r="5" fill="#3b82f6" />
            <circle cx="50" cy="18" r="5" fill="#22c55e" />
            <circle cx="14" cy="46" r="5" fill="#eab308" />
            <circle cx="50" cy="46" r="5" fill="#a855f7" />
            <line x1="18.5" y1="21.5" x2="25.5" y2="27.5" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="45.5" y1="21.5" x2="38.5" y2="27.5" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="18.5" y1="42.5" x2="25.5" y2="36.5" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="45.5" y1="42.5" x2="38.5" y2="36.5" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span style={styles.logoText}>Synapse</span>
        </div>
      </header>

      {/* Hero */}
      <main style={styles.main}>
        <div style={styles.hero}>
          <div style={styles.badge}>Knowledge Graph Platform</div>
          <h1 style={styles.headline}>
            Think in <span style={styles.accent}>connections</span>,<br />
            not documents
          </h1>
          <p style={styles.sub}>
            Build living knowledge graphs. Connect ideas, discover patterns,<br />
            and collaborate in real time with your team.
          </p>

          {/* Create graph form */}
          <div style={styles.createBox}>
            <input
              style={styles.nameInput}
              type="text"
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              placeholder="Graph name…"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGraph(); }}
              maxLength={80}
            />
            <button style={styles.primaryBtn} onClick={handleCreateGraph}>
              Create Graph
            </button>
          </div>

          <div style={styles.orDivider}>
            <span style={styles.orLine} />
            <span style={styles.orText}>or</span>
            <span style={styles.orLine} />
          </div>

          <button style={styles.ghostBtn} onClick={handleOpenExample}>
            Open Example Graph
          </button>
        </div>

        {/* Feature grid */}
        <div style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} style={styles.featureCard}>
              <div style={{ ...styles.featureIcon, background: f.bg }}>
                <span style={{ fontSize: 20 }}>{f.emoji}</span>
              </div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span style={{ color: '#64748b', fontSize: 12 }}>
          Synapse v0.1 · Built with React 18 + Canvas API
        </span>
      </footer>
    </div>
  );
};

const FEATURES = [
  {
    emoji: '🧠',
    title: 'Force-Directed Layout',
    desc: 'Fruchterman-Reingold algorithm for beautiful, organic graph layouts.',
    bg: 'rgba(99, 102, 241, 0.12)',
  },
  {
    emoji: '⚡',
    title: 'Real-time Collaboration',
    desc: 'See cursors and changes from teammates as they happen via WebSocket.',
    bg: 'rgba(59, 130, 246, 0.12)',
  },
  {
    emoji: '🔍',
    title: 'Graph Algorithms',
    desc: 'Shortest paths, community detection, and centrality analysis built in.',
    bg: 'rgba(34, 197, 94, 0.12)',
  },
  {
    emoji: '📤',
    title: 'Export Anywhere',
    desc: 'Export your knowledge graph as PNG, SVG, or JSON for sharing.',
    bg: 'rgba(234, 179, 8, 0.12)',
  },
  {
    emoji: '📝',
    title: 'Rich Node Content',
    desc: 'Each node supports Markdown content, tags, and typed relationships.',
    bg: 'rgba(168, 85, 247, 0.12)',
  },
  {
    emoji: '🎨',
    title: 'Hardware Accelerated',
    desc: 'Canvas API renderer with HiDPI support and smooth 60fps interactions.',
    bg: 'rgba(249, 115, 22, 0.12)',
  },
];

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0f1117',
    color: '#f1f5f9',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowY: 'auto',
  },
  header: {
    padding: '20px 40px',
    borderBottom: '1px solid #1e2535',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 24px 40px',
    gap: 64,
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 24,
    maxWidth: 640,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: 9999,
    background: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    fontSize: 12,
    fontWeight: 600,
    color: '#818cf8',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 'clamp(32px, 6vw, 52px)',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
    color: '#f1f5f9',
  },
  accent: {
    background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sub: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  createBox: {
    display: 'flex',
    gap: 10,
    width: '100%',
    maxWidth: 440,
  },
  nameInput: {
    flex: 1,
    padding: '10px 14px',
    background: '#161b27',
    border: '1px solid #2d3748',
    borderRadius: 8,
    fontSize: 14,
    color: '#f1f5f9',
    outline: 'none',
  },
  primaryBtn: {
    padding: '10px 20px',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 150ms',
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 440,
  },
  orLine: {
    flex: 1,
    height: 1,
    background: '#1e2535',
  },
  orText: {
    color: '#64748b',
    fontSize: 13,
  },
  ghostBtn: {
    padding: '10px 24px',
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #2d3748',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    width: '100%',
    maxWidth: 900,
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '20px',
    background: '#161b27',
    border: '1px solid #1e2535',
    borderRadius: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f1f5f9',
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.5,
  },
  footer: {
    padding: '16px 40px',
    borderTop: '1px solid #1e2535',
    textAlign: 'center',
  },
};
