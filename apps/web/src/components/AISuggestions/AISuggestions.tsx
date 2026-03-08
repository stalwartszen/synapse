import React, { useState, useCallback } from 'react';
import { useGraph } from '../../hooks/useGraph.js';
import { useUIStore } from '../../store/uiStore.js';
import {
  suggestConnections,
  naturalLanguageSearch,
  type SuggestedEdge,
  type AIError,
  getApiKey,
} from '../../services/aiService.js';
import type { EdgeType } from '@synapse/core';
import styles from './AISuggestions.module.css';

interface AISuggestionsProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

type Tab = 'suggestions' | 'search';

export const AISuggestions: React.FC<AISuggestionsProps> = ({ onClose, onOpenSettings }) => {
  const graph = useGraph();
  const uiStore = useUIStore();

  const [tab, setTab] = useState<Tab>('suggestions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedEdge[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchHighlighted, setSearchHighlighted] = useState<Set<string>>(new Set());

  const hasApiKey = !!getApiKey();

  const handleSuggestConnections = useCallback(async () => {
    if (!hasApiKey) {
      onOpenSettings();
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setAccepted(new Set());
    setRejected(new Set());

    try {
      const nodes = graph.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        content: n.content,
        type: n.type,
      }));

      // Filter out already-existing edges
      const existing = new Set(
        graph.edges.map((e) => `${e.source}:${e.target}`),
      );

      const results = await suggestConnections(nodes);
      const filtered = results.filter(
        (s) => !existing.has(`${s.sourceId}:${s.targetId}`) && !existing.has(`${s.targetId}:${s.sourceId}`),
      );

      setSuggestions(filtered);
      if (filtered.length === 0) {
        setError('No new connections to suggest. Try adding more nodes or content!');
      }
    } catch (e) {
      const err = e as AIError;
      if (err.type === 'no-key') {
        onOpenSettings();
      } else {
        setError(err.message ?? 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [hasApiKey, graph, onOpenSettings]);

  const handleAccept = useCallback(
    (suggestion: SuggestedEdge) => {
      const edgeType = (suggestion.edgeType as EdgeType) ?? 'relates-to';
      graph.connectNodes(suggestion.sourceId, suggestion.targetId, edgeType);
      setAccepted((prev) => new Set([...prev, suggestion.sourceId + ':' + suggestion.targetId]));
      uiStore.showToast(`Edge added: ${suggestion.sourceLabel} → ${suggestion.targetLabel}`, 'success');
    },
    [graph, uiStore],
  );

  const handleReject = useCallback((suggestion: SuggestedEdge) => {
    setRejected((prev) => new Set([...prev, suggestion.sourceId + ':' + suggestion.targetId]));
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    if (!hasApiKey) {
      onOpenSettings();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nodes = graph.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        content: n.content,
        type: n.type,
      }));

      const results = await naturalLanguageSearch(searchQuery, nodes);
      setSearchResults(results);
      setSearchHighlighted(new Set(results));

      // Highlight in graph
      if (results.length > 0) {
        uiStore.selectNode(results[0]!);
        for (const id of results.slice(1)) {
          uiStore.selectNode(id, true);
        }
        uiStore.showToast(`Found ${results.length} matching node${results.length !== 1 ? 's' : ''}`, 'info');
      } else {
        uiStore.showToast('No matching nodes found', 'info');
      }
    } catch (e) {
      const err = e as AIError;
      setError(err.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, hasApiKey, graph, uiStore, onOpenSettings]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.sparkle}>✨</span>
            <span className={styles.title}>AI Assistant</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!hasApiKey && (
          <div className={styles.noKeyBanner}>
            <span>No API key set.</span>
            <button className={styles.setKeyBtn} onClick={() => { onClose(); onOpenSettings(); }}>
              Open Settings →
            </button>
          </div>
        )}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'suggestions' ? styles.activeTab : ''}`}
            onClick={() => setTab('suggestions')}
          >
            Suggestions
          </button>
          <button
            className={`${styles.tab} ${tab === 'search' ? styles.activeTab : ''}`}
            onClick={() => setTab('search')}
          >
            Semantic Search
          </button>
        </div>

        <div className={styles.content}>
          {tab === 'suggestions' && (
            <div className={styles.suggestionsTab}>
              <p className={styles.description}>
                Claude will analyze your nodes and suggest meaningful connections you may have missed.
              </p>

              <button
                className={styles.primaryBtn}
                onClick={handleSuggestConnections}
                disabled={loading || graph.nodes.length < 2}
              >
                {loading ? (
                  <><span className={styles.spinner} /> Analyzing nodes...</>
                ) : (
                  '✨ Suggest Connections'
                )}
              </button>

              {graph.nodes.length < 2 && (
                <p className={styles.hint}>Add at least 2 nodes to use suggestions.</p>
              )}

              {error && <div className={styles.errorBox}>{error}</div>}

              {suggestions.length > 0 && (
                <div className={styles.suggestionList}>
                  <p className={styles.foundCount}>{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} found</p>
                  {suggestions.map((s) => {
                    const key = `${s.sourceId}:${s.targetId}`;
                    const isAccepted = accepted.has(key);
                    const isRejected = rejected.has(key);

                    return (
                      <div
                        key={key}
                        className={`${styles.suggestion} ${isAccepted ? styles.accepted : ''} ${isRejected ? styles.rejected : ''}`}
                      >
                        <div className={styles.suggestionNodes}>
                          <span className={styles.nodeName}>{s.sourceLabel}</span>
                          <span className={styles.arrow}>→</span>
                          <span className={styles.nodeName}>{s.targetLabel}</span>
                          <span className={styles.edgeType}>{s.edgeType}</span>
                        </div>
                        <div className={styles.reason}>{s.reason}</div>
                        {!isAccepted && !isRejected && (
                          <div className={styles.actionRow}>
                            <button className={styles.acceptBtn} onClick={() => handleAccept(s)}>✓ Accept</button>
                            <button className={styles.rejectBtn} onClick={() => handleReject(s)}>✗ Reject</button>
                          </div>
                        )}
                        {isAccepted && <span className={styles.statusBadge} style={{ color: '#22c55e' }}>✓ Added</span>}
                        {isRejected && <span className={styles.statusBadge} style={{ color: '#ef4444' }}>✗ Rejected</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'search' && (
            <div className={styles.searchTab}>
              <p className={styles.description}>
                Describe what you're looking for in natural language, and Claude will find matching nodes.
              </p>

              <div className={styles.searchRow}>
                <input
                  className={styles.searchInput}
                  placeholder="e.g. concepts related to machine learning..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  autoFocus
                />
                <button
                  className={styles.searchBtn}
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading ? <span className={styles.spinner} /> : '→'}
                </button>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}

              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  <p className={styles.foundCount}>{searchResults.length} node{searchResults.length !== 1 ? 's' : ''} found</p>
                  {searchResults.map((nodeId) => {
                    const node = graph.getNode(nodeId);
                    if (!node) return null;
                    return (
                      <button
                        key={nodeId}
                        className={styles.resultItem}
                        onClick={() => {
                          uiStore.selectNode(nodeId);
                          uiStore.setSidebarPanel('properties');
                          onClose();
                        }}
                      >
                        <span className={styles.resultLabel}>{node.label}</span>
                        <span className={styles.resultType}>{node.type}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
