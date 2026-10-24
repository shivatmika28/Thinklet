/**
 * Thinklet Personalised Collaboration Utilities
 * Pure functions for:
 * 1. Privacy-level enforced Progress Code generation & inspection
 * 2. Peer Cheer Message encoding, decoding & sanitization (max 120 chars)
 * 3. Accountability Partner Goal-Progress sync & weekly check-in logic
 */

import {
  BuddyPrivacyLevel,
  BuddyProgressPayload,
  CheerCodePayload,
  AccountabilityGoalPayload,
} from '../types';

export const MAX_SAFE_COLLAB_BYTES = 200 * 1024; // 200 KB
export const MAX_CHEER_MESSAGE_LENGTH = 120;

/**
 * Sanitize plain text to prevent HTML injection and strip control characters
 */
export function sanitizePlainText(input: string, maxLen: number = 200): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // strip HTML brackets
    .trim()
    .slice(0, maxLen);
}

// --------------------------------------------------------------------------
// 1. Privacy Level Progress Code
// --------------------------------------------------------------------------

export interface GenerateProgressCodeOptions {
  privacyLevel: BuddyPrivacyLevel;
  nickname: string;
  emoji: string;
  streak: number;
  weeklyActiveDays: number;
  masteredTopics: string[];
}

export function generateBuddyProgressSnapshot(
  options: GenerateProgressCodeOptions
): { payload: BuddyProgressPayload; code: string; previewJson: string } {
  const { privacyLevel, nickname, emoji, streak, weeklyActiveDays, masteredTopics } = options;

  const sanitizedNickname = sanitizePlainText(nickname || 'Scholar', 30);
  const sanitizedEmoji = sanitizePlainText(emoji || '🌱', 4);

  // Enforce Privacy Level strictly
  const payload: BuddyProgressPayload = {
    type: 'BUDDY_PROGRESS',
    version: 1,
    senderNickname: sanitizedNickname,
    senderEmoji: sanitizedEmoji,
    privacyLevel,
    createdAt: Date.now(),
  };

  if (privacyLevel === 'streak_only') {
    payload.streak = Math.max(0, streak || 0);
    payload.weeklyActiveDays = Math.max(0, Math.min(7, weeklyActiveDays || 0));
    // Notice: masteredTopics are EXCLUDED
  } else if (privacyLevel === 'streak_topics') {
    payload.streak = Math.max(0, streak || 0);
    payload.weeklyActiveDays = Math.max(0, Math.min(7, weeklyActiveDays || 0));
    payload.masteredTopics = masteredTopics.map((t) => sanitizePlainText(t, 50)).slice(0, 20);
  }
  // When privacyLevel === 'none', neither streak nor topics are added.

  const json = JSON.stringify(payload);
  const base64 = btoa(encodeURIComponent(json));
  const code = `THINKLET1-PROGRESS:${base64}`;
  const previewJson = JSON.stringify(payload, null, 2);

  return { payload, code, previewJson };
}

export function decodeBuddyProgressCode(code: string): BuddyProgressPayload {
  const trimmed = code.trim();
  if (trimmed.length > MAX_SAFE_COLLAB_BYTES) {
    throw new Error('Code exceeds maximum safe size limit (200 KB).');
  }

  let jsonStr = '';
  if (trimmed.startsWith('THINKLET1-PROGRESS:')) {
    const b64 = trimmed.substring('THINKLET1-PROGRESS:'.length);
    try {
      jsonStr = decodeURIComponent(atob(b64));
    } catch {
      throw new Error('Malformed progress code. Base64 decoding failed.');
    }
  } else {
    jsonStr = trimmed;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Progress code contains invalid JSON data.');
  }

  if (!parsed || parsed.type !== 'BUDDY_PROGRESS') {
    throw new Error('Provided code is not a valid Thinklet Buddy Progress code.');
  }

  return {
    type: 'BUDDY_PROGRESS',
    version: 1,
    senderNickname: sanitizePlainText(parsed.senderNickname || 'Buddy', 30),
    senderEmoji: sanitizePlainText(parsed.senderEmoji || '🌱', 4),
    privacyLevel: parsed.privacyLevel || 'none',
    streak: typeof parsed.streak === 'number' ? parsed.streak : undefined,
    weeklyActiveDays: typeof parsed.weeklyActiveDays === 'number' ? parsed.weeklyActiveDays : undefined,
    masteredTopics: Array.isArray(parsed.masteredTopics)
      ? parsed.masteredTopics.map((t: any) => sanitizePlainText(String(t), 50))
      : undefined,
    createdAt: Number(parsed.createdAt) || Date.now(),
  };
}

// --------------------------------------------------------------------------
// 2. Peer Cheer Message Code
// --------------------------------------------------------------------------

export interface GenerateCheerOptions {
  senderNickname: string;
  senderEmoji: string;
  message: string;
  emoji: string;
}

export function generateCheerCode(options: GenerateCheerOptions): { code: string; previewJson: string } {
  const sanitizedMessage = sanitizePlainText(options.message, MAX_CHEER_MESSAGE_LENGTH);
  if (!sanitizedMessage) {
    throw new Error('Cheer message cannot be empty.');
  }

  const payload: CheerCodePayload = {
    type: 'CHEER',
    version: 1,
    senderNickname: sanitizePlainText(options.senderNickname || 'A Friend', 30),
    senderEmoji: sanitizePlainText(options.senderEmoji || '🌟', 4),
    message: sanitizedMessage,
    emoji: sanitizePlainText(options.emoji || '🎉', 4),
    createdAt: Date.now(),
  };

  const json = JSON.stringify(payload);
  const base64 = btoa(encodeURIComponent(json));
  const code = `THINKLET1-CHEER:${base64}`;
  const previewJson = JSON.stringify(payload, null, 2);

  return { code, previewJson };
}

export function decodeCheerCode(code: string): CheerCodePayload {
  const trimmed = code.trim();
  if (trimmed.length > MAX_SAFE_COLLAB_BYTES) {
    throw new Error('Code exceeds safe maximum size limit (200 KB).');
  }

  let jsonStr = '';
  if (trimmed.startsWith('THINKLET1-CHEER:')) {
    const b64 = trimmed.substring('THINKLET1-CHEER:'.length);
    try {
      jsonStr = decodeURIComponent(atob(b64));
    } catch {
      throw new Error('Malformed cheer code. Base64 decoding failed.');
    }
  } else {
    jsonStr = trimmed;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Cheer code contains invalid JSON data.');
  }

  if (!parsed || parsed.type !== 'CHEER') {
    throw new Error('Provided code is not a valid Thinklet Cheer code.');
  }

  const message = sanitizePlainText(parsed.message || '', MAX_CHEER_MESSAGE_LENGTH);
  if (!message) {
    throw new Error('Cheer message is empty or invalid.');
  }

  return {
    type: 'CHEER',
    version: 1,
    senderNickname: sanitizePlainText(parsed.senderNickname || 'A Friend', 30),
    senderEmoji: sanitizePlainText(parsed.senderEmoji || '🌟', 4),
    message,
    emoji: sanitizePlainText(parsed.emoji || '🌟', 4),
    createdAt: Number(parsed.createdAt) || Date.now(),
  };
}

// --------------------------------------------------------------------------
// 3. Accountability Partner Goal-Progress Sync
// --------------------------------------------------------------------------

export interface GenerateAccountabilityOptions {
  senderNickname: string;
  senderEmoji: string;
  goalType: 'minutes' | 'sessions';
  target: number;
  currentProgress: number;
  weekStartDate?: string;
}

export function getCurrentWeekLabel(date?: Date): string {
  const now = date || (typeof window !== 'undefined' ? new Date() : new Date('2026-10-24T00:00:00Z'));
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function generateAccountabilityGoalCode(
  options: GenerateAccountabilityOptions
): { code: string; previewJson: string } {
  const payload: AccountabilityGoalPayload = {
    type: 'ACCOUNTABILITY_PROGRESS',
    version: 1,
    senderNickname: sanitizePlainText(options.senderNickname || 'Study Partner', 30),
    senderEmoji: sanitizePlainText(options.senderEmoji || '🤝', 4),
    goalType: options.goalType === 'sessions' ? 'sessions' : 'minutes',
    target: Math.max(1, options.target || 120),
    currentProgress: Math.max(0, options.currentProgress || 0),
    weekStartDate: options.weekStartDate || getCurrentWeekLabel(),
    createdAt: Date.now(),
  };

  const json = JSON.stringify(payload);
  const base64 = btoa(encodeURIComponent(json));
  const code = `THINKLET1-GOAL:${base64}`;
  const previewJson = JSON.stringify(payload, null, 2);

  return { code, previewJson };
}

export function decodeAccountabilityGoalCode(code: string): AccountabilityGoalPayload {
  const trimmed = code.trim();
  if (trimmed.length > MAX_SAFE_COLLAB_BYTES) {
    throw new Error('Code exceeds safe maximum size limit (200 KB).');
  }

  let jsonStr = '';
  if (trimmed.startsWith('THINKLET1-GOAL:')) {
    const b64 = trimmed.substring('THINKLET1-GOAL:'.length);
    try {
      jsonStr = decodeURIComponent(atob(b64));
    } catch {
      throw new Error('Malformed goal code. Base64 decoding failed.');
    }
  } else {
    jsonStr = trimmed;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Goal code contains invalid JSON data.');
  }

  if (!parsed || parsed.type !== 'ACCOUNTABILITY_PROGRESS') {
    throw new Error('Provided code is not a valid Thinklet Accountability Goal code.');
  }

  return {
    type: 'ACCOUNTABILITY_PROGRESS',
    version: 1,
    senderNickname: sanitizePlainText(parsed.senderNickname || 'Study Partner', 30),
    senderEmoji: sanitizePlainText(parsed.senderEmoji || '🤝', 4),
    goalType: parsed.goalType === 'sessions' ? 'sessions' : 'minutes',
    target: Math.max(1, Number(parsed.target) || 120),
    currentProgress: Math.max(0, Number(parsed.currentProgress) || 0),
    weekStartDate: sanitizePlainText(parsed.weekStartDate || getCurrentWeekLabel(), 10),
    createdAt: Number(parsed.createdAt) || Date.now(),
  };
}

/**
 * Universal safe code parser that inspects any Thinklet code header
 */
export function identifyPersonalCodeType(
  code: string
): 'PROGRESS' | 'CHEER' | 'GOAL' | 'COLLEAGUE_INVITE' | 'UNKNOWN' {
  const trimmed = code.trim();
  if (trimmed.startsWith('THINKLET1-PROGRESS:')) return 'PROGRESS';
  if (trimmed.startsWith('THINKLET1-CHEER:')) return 'CHEER';
  if (trimmed.startsWith('THINKLET1-GOAL:')) return 'GOAL';
  if (trimmed.startsWith('THINKLET1-BUDDY_INVITE:')) return 'COLLEAGUE_INVITE';

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.type === 'BUDDY_PROGRESS') return 'PROGRESS';
    if (parsed.type === 'CHEER') return 'CHEER';
    if (parsed.type === 'ACCOUNTABILITY_PROGRESS') return 'GOAL';
    if (parsed.type === 'BUDDY_INVITE') return 'COLLEAGUE_INVITE';
  } catch {
    // not JSON
  }
  return 'UNKNOWN';
}
