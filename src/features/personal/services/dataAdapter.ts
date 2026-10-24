/**
 * Thinklet Personal Data Adapter
 * Strictly READ-ONLY bridge to existing application state:
 * - learnmate.core.v1 (Topics, Pages, Attempts)
 * - learnmate.features.v1 (Streak, Goal, StudySessions, Flashcards, Settings)
 * - thinklet.collab.v1 (Buddies, Challenges)
 */

import { CORE_STORAGE_KEY } from '../../../services/storage';
import { FEATURE_STORAGE_KEY } from '../../services/featureStore';
import { COLLAB_STORAGE_KEY } from '../../services/collabService';
import { CoreState, Attempt, Topic } from '../../../types';
import { FeatureStoreData } from '../../types.ext';

function readSafeJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getCoreState(): Partial<CoreState> {
  return readSafeJson<Partial<CoreState>>(CORE_STORAGE_KEY, {});
}

export function getFeatureState(): Partial<FeatureStoreData> {
  return readSafeJson<Partial<FeatureStoreData>>(FEATURE_STORAGE_KEY, {});
}

export function getAttempts(): Attempt[] {
  const core = getCoreState();
  return Array.isArray(core.attempts) ? core.attempts : [];
}

export function getTopics(): Topic[] {
  const core = getCoreState();
  return Array.isArray(core.topics) ? core.topics : [];
}

export function getStudySessions() {
  const feat = getFeatureState();
  return Array.isArray(feat.studySessions) ? feat.studySessions : [];
}

export function getStreakInfo() {
  const feat = getFeatureState();
  return feat.streak || { currentStreak: 0, longestStreak: 0, lastActiveDate: '' };
}

export function getGoalInfo() {
  const feat = getFeatureState();
  return (
    feat.goal || {
      dailyMinutes: 20,
      todayMinutesCompleted: 0,
      examDate: undefined,
      lastGoalDate: '',
    }
  );
}

export function getFlashcardsList() {
  const feat = getFeatureState();
  return Array.isArray(feat.flashcards) ? feat.flashcards : [];
}

export function getLanguagePreference(): string {
  const feat = getFeatureState();
  return feat.settings?.language || 'English';
}

export function getCollabBuddies() {
  const collab = readSafeJson<{ buddies?: unknown[] }>(COLLAB_STORAGE_KEY, {});
  return Array.isArray(collab.buddies) ? collab.buddies : [];
}
