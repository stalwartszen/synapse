/**
 * SM-2 spaced repetition algorithm implementation.
 * Based on SuperMemo 2 algorithm by Piotr Wozniak.
 */

export interface CardState {
  nodeId: string;
  ease: number;      // starts at 2.5, minimum 1.3
  interval: number;  // days until next review
  reps: number;      // number of successful reviews
  dueDate: number;   // timestamp (ms)
  lastReviewed: number; // timestamp (ms)
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

const RATING_SCORES: Record<Rating, number> = {
  again: 0,
  hard: 2,
  good: 3,
  easy: 5,
};

const STORAGE_KEY = 'synapse-learning-state';

/**
 * Apply SM-2 algorithm to a card state after a review.
 */
export function applyRating(card: CardState, rating: Rating): CardState {
  const q = RATING_SCORES[rating];
  const now = Date.now();

  let newEase = card.ease;
  let newInterval = card.interval;
  let newReps = card.reps;

  if (q < 3) {
    // Failed — reset repetitions
    newReps = 0;
    newInterval = 1;
  } else {
    // Successful review
    if (newReps === 0) {
      newInterval = 1;
    } else if (newReps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(card.interval * card.ease);
    }
    newReps += 1;
  }

  // Update ease factor
  newEase = Math.max(1.3, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  // For "again" rating, show again within same session (10 minutes)
  let dueDate: number;
  if (rating === 'again') {
    dueDate = now + 10 * 60 * 1000;
  } else if (rating === 'hard') {
    dueDate = now + Math.min(3, newInterval) * 24 * 60 * 60 * 1000;
  } else {
    dueDate = now + newInterval * 24 * 60 * 60 * 1000;
  }

  return {
    ...card,
    ease: newEase,
    interval: newInterval,
    reps: newReps,
    dueDate,
    lastReviewed: now,
  };
}

/**
 * Create a new card state for a node.
 */
export function createCardState(nodeId: string): CardState {
  return {
    nodeId,
    ease: 2.5,
    interval: 1,
    reps: 0,
    dueDate: Date.now(),
    lastReviewed: 0,
  };
}

/**
 * Get interval description for display.
 */
export function getIntervalDescription(rating: Rating, currentCard: CardState): string {
  const now = Date.now();
  const simulated = applyRating(currentCard, rating);
  const diffMs = simulated.dueDate - now;
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

/**
 * Load all card states from localStorage.
 */
export function loadCardStates(): Map<string, CardState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed: Record<string, CardState> = JSON.parse(raw);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

/**
 * Save card states to localStorage.
 */
export function saveCardStates(states: Map<string, CardState>): void {
  try {
    const obj: Record<string, CardState> = {};
    for (const [k, v] of states) obj[k] = v;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get cards due for review from a set of node IDs.
 */
export function getDueCards(
  nodeIds: string[],
  states: Map<string, CardState>,
): CardState[] {
  const now = Date.now();
  const due: CardState[] = [];

  for (const nodeId of nodeIds) {
    const state = states.get(nodeId) ?? createCardState(nodeId);
    if (state.dueDate <= now) {
      due.push(state);
    }
  }

  // Sort: never-reviewed first, then by due date
  due.sort((a, b) => {
    if (a.reps === 0 && b.reps !== 0) return -1;
    if (a.reps !== 0 && b.reps === 0) return 1;
    return a.dueDate - b.dueDate;
  });

  return due;
}

/**
 * Get all cards for a study session (due + new cards up to limit).
 */
export function getSessionCards(
  nodeIds: string[],
  states: Map<string, CardState>,
  maxNew: number = 20,
): CardState[] {
  const now = Date.now();
  const due: CardState[] = [];
  const newCards: CardState[] = [];

  for (const nodeId of nodeIds) {
    const state = states.get(nodeId);
    if (!state) {
      newCards.push(createCardState(nodeId));
    } else if (state.dueDate <= now) {
      due.push(state);
    }
  }

  // Sort due cards by due date
  due.sort((a, b) => a.dueDate - b.dueDate);

  // Combine: due first, then new up to limit
  return [...due, ...newCards.slice(0, maxNew)];
}
