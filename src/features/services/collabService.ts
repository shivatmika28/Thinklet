/**
 * Thinklet Student Collaboration Service
 * Code-based peer collaboration (no external backend or servers needed).
 * 
 * Features:
 * 1. Study Circle (Local buddies, invite codes, shared stats)
 * 2. Study Set Sharing (Notes, Flashcards, Quizzes with preview and safe import)
 * 3. Friendly Challenges (Quiz challenge codes, result verification, friendly comparisons)
 * 4. Co-Study Sprints (Synchronized start time countdown based on UTC device clock)
 * 
 * Storage Key: "thinklet.collab.v1"
 */

import { FlashcardItem, NoteItem } from '../types.ext';
import { loadFeatureStore, saveFeatureStore } from './featureStore';

export const COLLAB_STORAGE_KEY = 'thinklet.collab.v1';
export const MAX_SAFE_CODE_BYTES = 200 * 1024; // 200 KB

export interface StudyBuddy {
  id: string;
  nickname: string;
  avatarEmoji: string;
  avatarColor: string;
  addedAt: string;
  lastSummary?: {
    streak: number;
    weeklyMinutes: number;
    todayMinutes: number;
    topMastery?: string;
    sharedAt: string;
  };
}

export interface ChallengeComparison {
  challengeId: string;
  topicName: string;
  challengerNickname: string;
  challengerScore: number;
  challengerTimeSeconds: number;
  friendNickname: string;
  friendScore: number;
  friendTimeSeconds: number;
  completedAt: string;
}

export interface CollabStoreData {
  myNickname: string;
  myEmoji: string;
  myColor: string;
  buddies: StudyBuddy[];
  savedChallenges: Array<{
    id: string;
    topicName: string;
    questionsCount: number;
    challengerNickname: string;
    challengerScore: number;
    challengerTimeSeconds: number;
    createdAt: string;
    comparisons?: ChallengeComparison[];
  }>;
}

export const DEFAULT_COLLAB_STORE: CollabStoreData = {
  myNickname: 'Thinklet Scholar',
  myEmoji: '🐧',
  myColor: '#98473E',
  buddies: [],
  savedChallenges: [],
};

// Safe storage access
export function loadCollabStore(): CollabStoreData {
  if (typeof window === 'undefined') return DEFAULT_COLLAB_STORE;
  try {
    const raw = localStorage.getItem(COLLAB_STORAGE_KEY);
    if (!raw) return DEFAULT_COLLAB_STORE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_COLLAB_STORE,
      ...parsed,
      buddies: Array.isArray(parsed.buddies) ? parsed.buddies : [],
      savedChallenges: Array.isArray(parsed.savedChallenges) ? parsed.savedChallenges : [],
    };
  } catch (err) {
    console.error('Failed to load collab store:', err);
    return DEFAULT_COLLAB_STORE;
  }
}

export function saveCollabStore(data: Partial<CollabStoreData>): CollabStoreData {
  if (typeof window === 'undefined') return DEFAULT_COLLAB_STORE;
  try {
    const current = loadCollabStore();
    const updated: CollabStoreData = { ...current, ...data };
    localStorage.setItem(COLLAB_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save collab store:', err);
    return DEFAULT_COLLAB_STORE;
  }
}

// ============================================================================
// Safe Code Serialization & Deserialization
// ============================================================================

export type CollabPayloadType =
  | 'BUDDY_INVITE'
  | 'STUDY_SET'
  | 'CHALLENGE'
  | 'CHALLENGE_RESULT'
  | 'COSTUDY';

export interface BaseCollabPayload {
  type: CollabPayloadType;
  version: 1;
  createdAt: number;
  senderNickname: string;
  senderEmoji: string;
}

export interface BuddyInvitePayload extends BaseCollabPayload {
  type: 'BUDDY_INVITE';
  streak: number;
  weeklyMinutes: number;
  todayMinutes: number;
  topMastery?: string;
}

export interface StudySetPayload extends BaseCollabPayload {
  type: 'STUDY_SET';
  setItemType: 'flashcards' | 'notes';
  title: string;
  items: Array<{
    titleOrFront: string;
    contentOrBack: string;
    topicName?: string;
  }>;
}

export interface ChallengePayload extends BaseCollabPayload {
  type: 'CHALLENGE';
  challengeId: string;
  topicName: string;
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
  challengerScore: number;
  challengerTimeSeconds: number;
}

export interface ChallengeResultPayload extends BaseCollabPayload {
  type: 'CHALLENGE_RESULT';
  challengeId: string;
  topicName: string;
  friendScore: number;
  friendTimeSeconds: number;
}

export interface CoStudyPayload extends BaseCollabPayload {
  type: 'COSTUDY';
  durationMinutes: number;
  startUtcTimestamp: number;
  presetLabel: string;
}

export type AnyCollabPayload =
  | BuddyInvitePayload
  | StudySetPayload
  | ChallengePayload
  | ChallengeResultPayload
  | CoStudyPayload;

export function encodePayload(payload: AnyCollabPayload): string {
  try {
    const json = JSON.stringify(payload);
    const base64 = btoa(encodeURIComponent(json));
    return `THINKLET1-${payload.type}:${base64}`;
  } catch (err) {
    console.error('Failed to encode collab payload:', err);
    throw new Error('Could not generate share code. Content may contain invalid characters.');
  }
}

export function decodePayload<T extends AnyCollabPayload>(code: string, expectedType?: CollabPayloadType): T {
  const trimmed = code.trim();
  if (trimmed.length > MAX_SAFE_CODE_BYTES) {
    throw new Error('Code exceeds maximum safe size (200 KB).');
  }

  let jsonString = '';

  // Format 1: THINKLET1-TYPE:base64
  if (trimmed.startsWith('THINKLET1-')) {
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      throw new Error('Invalid Thinklet code format. Missing separator.');
    }
    const b64 = trimmed.substring(colonIdx + 1);
    try {
      jsonString = decodeURIComponent(atob(b64));
    } catch {
      throw new Error('Malformed Thinklet code. Could not decode base64.');
    }
  } else {
    // Format 2: Raw JSON string or JSON file content
    jsonString = trimmed;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Code does not contain valid JSON data.');
  }

  // Safety checks
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid code payload structure.');
  }

  if (expectedType && parsed.type !== expectedType) {
    throw new Error(`Expected a ${expectedType.replace(/_/g, ' ')} code, but received ${parsed.type || 'unknown'}.`);
  }

  return parsed as T;
}

// ============================================================================
// Feature Integrations
// ============================================================================

/**
 * Import a shared study set (Flashcards or Notes) safely into the local feature store
 */
export function importStudySetToStore(payload: StudySetPayload): { importedCount: number } {
  const store = loadFeatureStore();
  const nickname = payload.senderNickname || 'Study Buddy';
  const tag = `[From ${nickname}]`;

  if (payload.setItemType === 'flashcards') {
    const newCards: FlashcardItem[] = payload.items.map((item, idx) => ({
      id: `collab_card_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      topicId: 'collab_shared',
      front: `${tag} ${item.titleOrFront}`,
      back: item.contentOrBack,
      page: 1,
      box: 1,
      nextReviewDate: Date.now(),
    }));

    saveFeatureStore({
      flashcards: [...(store.flashcards || []), ...newCards],
    });
    return { importedCount: newCards.length };
  } else {
    const newNotes: NoteItem[] = payload.items.map((item, idx) => ({
      id: `collab_note_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      topicId: 'collab_shared',
      title: `${tag} ${item.titleOrFront}`,
      type: 'key_points',
      content: item.contentOrBack,
      pageReferences: [1],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    saveFeatureStore({
      notes: [...(store.notes || []), ...newNotes],
    });
    return { importedCount: newNotes.length };
  }
}
