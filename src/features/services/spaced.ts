import { Topic } from '../../types';
import { SpacedRepetitionBox } from '../types.ext';
import { loadFeatureStore, saveFeatureStore } from './featureStore';

export const LEITNER_INTERVALS: Record<number, number> = {
  1: 1,  // Box 1: 1 day
  2: 3,  // Box 2: 3 days
  3: 7,  // Box 3: 7 days
  4: 14  // Box 4: 14 days
};

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns in-memory topic boxes without mutating or saving to the store.
 * Provides default Box 1 (due immediately) for any topics not yet reviewed.
 * Safe to call during component render.
 */
export function initializeTopicBoxes(topics: Topic[]): Record<string, SpacedRepetitionBox> {
  const store = loadFeatureStore();
  const currentBoxes = { ...store.spacedBoxes };
  const now = Date.now();

  for (const t of topics) {
    if (!currentBoxes[t.id]) {
      currentBoxes[t.id] = {
        topicId: t.id,
        box: 1,
        intervalDays: LEITNER_INTERVALS[1],
        lastReviewedDate: 0,
        nextDueDate: now // due immediately for first review
      };
    }
  }

  return currentBoxes;
}

/**
 * Persists topic boxes to storage if new topics exist.
 * Call this ONLY from event handlers or effects, NEVER during render.
 */
export function persistTopicBoxes(topics: Topic[]): Record<string, SpacedRepetitionBox> {
  const store = loadFeatureStore();
  const currentBoxes = { ...store.spacedBoxes };
  let changed = false;

  const now = Date.now();
  for (const t of topics) {
    if (!currentBoxes[t.id]) {
      currentBoxes[t.id] = {
        topicId: t.id,
        box: 1,
        intervalDays: LEITNER_INTERVALS[1],
        lastReviewedDate: 0,
        nextDueDate: now
      };
      changed = true;
    }
  }

  if (changed) {
    saveFeatureStore({ spacedBoxes: currentBoxes });
  }

  return currentBoxes;
}

export function recordTopicReview(topicId: string, remembered: boolean): SpacedRepetitionBox {
  const store = loadFeatureStore();
  const currentBoxes = { ...store.spacedBoxes };
  const existing = currentBoxes[topicId] || {
    topicId,
    box: 1,
    intervalDays: 1,
    lastReviewedDate: 0,
    nextDueDate: Date.now()
  };

  let nextBox = existing.box;
  if (remembered) {
    nextBox = Math.min(4, existing.box + 1);
  } else {
    nextBox = 1; // Demote to box 1 on failure
  }

  const intervalDays = LEITNER_INTERVALS[nextBox] || 1;
  const now = Date.now();
  const nextDueDate = now + (intervalDays * ONE_DAY_MS);

  const updatedBox: SpacedRepetitionBox = {
    topicId,
    box: nextBox,
    intervalDays,
    lastReviewedDate: now,
    nextDueDate
  };

  currentBoxes[topicId] = updatedBox;
  saveFeatureStore({ spacedBoxes: currentBoxes });

  return updatedBox;
}

export function getDueTodayTopics(topics: Topic[]): Topic[] {
  const boxes = initializeTopicBoxes(topics);
  const now = Date.now();

  return topics.filter(t => {
    const box = boxes[t.id];
    if (!box) return true;
    return box.nextDueDate <= now;
  });
}

export interface LeitnerSummary {
  box1: Topic[];
  box2: Topic[];
  box3: Topic[];
  box4: Topic[];
  dueCount: number;
}

export function getLeitnerSummary(topics: Topic[]): LeitnerSummary {
  const boxes = initializeTopicBoxes(topics);
  const now = Date.now();

  const summary: LeitnerSummary = {
    box1: [],
    box2: [],
    box3: [],
    box4: [],
    dueCount: 0
  };

  for (const t of topics) {
    const b = boxes[t.id];
    if (!b || b.box === 1) summary.box1.push(t);
    else if (b.box === 2) summary.box2.push(t);
    else if (b.box === 3) summary.box3.push(t);
    else summary.box4.push(t);

    if (!b || b.nextDueDate <= now) {
      summary.dueCount += 1;
    }
  }

  return summary;
}
