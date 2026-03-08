import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGraph } from '../../hooks/useGraph.js';
import {
  type CardState,
  type Rating,
  loadCardStates,
  saveCardStates,
  getSessionCards,
  applyRating,
  createCardState,
  getIntervalDescription,
} from '../../utils/spaced-repetition.js';
import styles from './LearningMode.module.css';

interface LearningModeProps {
  onClose: () => void;
}

type Phase = 'front' | 'back' | 'complete';

export const LearningMode: React.FC<LearningModeProps> = ({ onClose }) => {
  const graph = useGraph();
  const nodes = graph.nodes;

  const [cardStates, setCardStates] = useState<Map<string, CardState>>(() => loadCardStates());
  const [queue, setQueue] = useState<CardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('front');
  const [reviewedCount, setReviewedCount] = useState(0);

  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  useEffect(() => {
    const q = getSessionCards(nodeIds, cardStates, 20);
    setQueue(q);
    setCurrentIndex(0);
    setPhase(nodes.length === 0 ? 'complete' : 'front');
    setReviewedCount(0);
  }, [nodeIds, cardStates]);

  const currentCard = queue[currentIndex];
  const currentNode = currentCard ? graph.getNode(currentCard.nodeId) : undefined;

  const connectedNodes = useMemo(() => {
    if (!currentNode) return [];
    return graph.getEdgesForNode(currentNode.id).map((edge) => {
      const otherId = edge.source === currentNode.id ? edge.target : edge.source;
      return graph.getNode(otherId);
    }).filter(Boolean);
  }, [currentNode, graph]);

  const handleShowAnswer = useCallback(() => {
    setPhase('back');
  }, []);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentCard) return;

      const updated = applyRating(
        cardStates.get(currentCard.nodeId) ?? createCardState(currentCard.nodeId),
        rating,
      );

      const newStates = new Map(cardStates);
      newStates.set(currentCard.nodeId, updated);
      setCardStates(newStates);
      saveCardStates(newStates);

      setReviewedCount((c) => c + 1);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        setPhase('complete');
      } else {
        setCurrentIndex(nextIndex);
        setPhase('front');
      }
    },
    [currentCard, currentIndex, queue.length, cardStates],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (phase === 'front' && e.key === ' ') {
        e.preventDefault();
        handleShowAnswer();
        return;
      }
      if (phase === 'back') {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    },
    [phase, handleShowAnswer, handleRate, onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const totalCards = queue.length;
  const progress = totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0;

  const TYPE_COLORS: Record<string, string> = {
    concept: '#3b82f6',
    resource: '#22c55e',
    question: '#eab308',
    insight: '#a855f7',
    custom: '#f97316',
  };

  const TYPE_ICONS: Record<string, string> = {
    concept: '💡',
    resource: '📚',
    question: '?',
    insight: '★',
    custom: '●',
  };

  const RATING_INFO: Array<{ rating: Rating; label: string; key: string; color: string }> = [
    { rating: 'again', label: 'Again', key: '1', color: '#ef4444' },
    { rating: 'hard', label: 'Hard', key: '2', color: '#f97316' },
    { rating: 'good', label: 'Good', key: '3', color: '#3b82f6' },
    { rating: 'easy', label: 'Easy', key: '4', color: '#22c55e' },
  ];

  if (nodes.length === 0) {
    return (
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📖</div>
            <h2>No nodes to study</h2>
            <p>Add some nodes to your graph first, then come back to study!</p>
            <button className={styles.closeCardBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.completeState}>
            <div className={styles.completeIcon}>🎉</div>
            <h2 className={styles.completeTitle}>Session Complete!</h2>
            <p className={styles.completeSubtitle}>
              You reviewed <strong>{reviewedCount}</strong> card{reviewedCount !== 1 ? 's' : ''} in this session.
            </p>
            <div className={styles.completeStat}>
              <span>Cards due tomorrow:</span>
              <span>
                {Array.from(cardStates.values()).filter((s) => {
                  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
                  return s.dueDate > Date.now() && s.dueDate <= tomorrow;
                }).length}
              </span>
            </div>
            <button className={styles.doneBtn} onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentNode || !currentCard) {
    return (
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✓</div>
            <h2>All caught up!</h2>
            <p>No cards are due for review right now.</p>
            <button className={styles.closeCardBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const color = TYPE_COLORS[currentNode.type] ?? '#6366f1';

  return (
    <div className={styles.overlay}>
      {/* Header */}
      <div className={styles.topBar}>
        <button className={styles.exitBtn} onClick={onClose}>✕ Exit</button>
        <div className={styles.progressWrapper}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressText}>{reviewedCount} / {totalCards}</span>
      </div>

      {/* Card */}
      <div className={styles.cardWrapper}>
        <div className={`${styles.card} ${phase === 'back' ? styles.cardFlipped : ''}`}>
          {/* Front */}
          <div className={styles.cardFront}>
            <div className={styles.typeBadge} style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
              {TYPE_ICONS[currentNode.type]} {currentNode.type}
            </div>
            <h2 className={styles.nodeLabel}>{currentNode.label}</h2>

            {currentNode.tags && currentNode.tags.length > 0 && (
              <div className={styles.tagRow}>
                {currentNode.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>#{tag}</span>
                ))}
              </div>
            )}

            <div className={styles.hint}>Press Space or click to reveal</div>

            <button className={styles.showAnswerBtn} onClick={handleShowAnswer}>
              Show Answer
            </button>
          </div>

          {/* Back */}
          {phase === 'back' && (
            <div className={styles.cardBack}>
              <div className={styles.typeBadge} style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                {TYPE_ICONS[currentNode.type]} {currentNode.type}
              </div>
              <h2 className={styles.nodeLabel}>{currentNode.label}</h2>

              {currentNode.content ? (
                <div className={styles.contentArea}>
                  <MarkdownPreview content={currentNode.content} />
                </div>
              ) : (
                <p className={styles.noContent}>No content yet.</p>
              )}

              {connectedNodes.length > 0 && (
                <div className={styles.connectionsSection}>
                  <p className={styles.connectionsLabel}>Connected to:</p>
                  <div className={styles.connectionsList}>
                    {connectedNodes.slice(0, 5).map((n) => n && (
                      <span key={n.id} className={styles.connectionNode}>
                        {n.label}
                      </span>
                    ))}
                    {connectedNodes.length > 5 && (
                      <span className={styles.moreConnections}>+{connectedNodes.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.ratingPrompt}>How well did you know this?</div>
              <div className={styles.ratingRow}>
                {RATING_INFO.map(({ rating, label, key, color: rColor }) => (
                  <button
                    key={rating}
                    className={styles.ratingBtn}
                    style={{ borderColor: rColor, color: rColor }}
                    onClick={() => handleRate(rating)}
                    title={`Key: ${key}`}
                  >
                    <span className={styles.ratingLabel}>{label}</span>
                    <span className={styles.ratingInterval}>
                      {getIntervalDescription(rating, currentCard)}
                    </span>
                    <kbd className={styles.ratingKey}>{key}</kbd>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card counter */}
      <div className={styles.cardCounter}>
        Card {currentIndex + 1} of {totalCards}
      </div>
    </div>
  );
};

// Simple markdown preview (handles headings, bold, lists)
const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className={styles.markdown}>
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className={styles.mdH1}>{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className={styles.mdH2}>{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className={styles.mdH3}>{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className={styles.mdLi}>{renderInline(line.slice(2))}</li>;
        }
        if (line.trim() === '') {
          return <div key={i} className={styles.mdSpacer} />;
        }
        return <p key={i} className={styles.mdP}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
