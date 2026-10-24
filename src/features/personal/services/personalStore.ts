"use client";

/**
 * Thinklet Personal & Relax Store
 * Key: "thinklet.personal.v1"
 * Strictly isolated, versioned, schema-validated, and size-capped.
 */

import {
  PersonalStoreData,
  PersonalFeatureSwitches,
  PersonalStoreListener,
  WhyStudyingNote,
  StudentReward,
  RoomSlot,
  RewardConditionType,
  MascotMemoryType,
  MascotMemoryItem,
  MascotPersonality,
  MascotOutfit,
  CachedMistakeAnalysis,
  BuddyPersonalSettings,
  CheerMessageItem,
  AccountabilityPartnerState,
} from '../types';

export const PERSONAL_STORAGE_KEY = 'thinklet.personal.v1';
export const MAX_EVENT_LOG_SIZE = 2000;
export const MAX_MASCOT_MEMORIES = 50;

export const DEFAULT_SWITCHES: PersonalFeatureSwitches = {
  adaptiveDifficulty: false,
  mascotMemory: true,
  mascotTips: true,
  nudges: true,
  insights: true,
  preTestCalmDefault: false,
  celebrationIntensity: 'standard',
  breakIntervalMinutes: 45,
};

export const DEFAULT_PERSONAL_STORE: PersonalStoreData = {
  version: 1,
  relaxMode: false,
  pausePersonalisation: false,
  switches: DEFAULT_SWITCHES,
  events: [],
  dailySummaries: {},
  forgottenDocIds: [],
  updatedAt: "2026-10-24T00:00:00.000Z",

  // Phase 2: Motivation defaults
  whyStudying: {
    text: "To master my goals and make my future self proud!",
    emoji: "🌱",
    lastShownDate: undefined,
    dismissedToday: false,
  },
  rewards: [
    {
      id: "reward-default-1",
      title: "Watch an episode of my favorite show",
      type: "sessions",
      target: 3,
      claimed: false,
      createdAt: "2026-10-24T00:00:00.000Z",
    },
    {
      id: "reward-default-2",
      title: "Enjoy a relaxing 30-min break with tea",
      type: "minutes",
      target: 45,
      claimed: false,
      createdAt: "2026-10-24T00:00:00.000Z",
    },
  ],
  roomPlacements: {
    desk: "desk-pine",
    plant: "plant-succulent",
    lamp: "lamp-lantern",
    poster: "poster-blueprint",
    rug: "rug-sage",
  },
  badges: {},
  weeklyStreakGoalDays: 3,

  // Phase 3: Mascot Memory, Personality & Outfits defaults
  mascotMemories: [
    {
      id: "mem-init-1",
      type: "comeback_return",
      title: "Thinklet Journey Started",
      detail: "Begun studying with Pip on Thinklet. Ready to conquer great milestones!",
      date: "2026-10-24",
      timestamp: 1729728000000,
    },
  ],
  personality: {
    cheerfulCalm: 50,
    playfulSerious: 50,
    voiceEnabled: false,
    voiceSpeed: 1.0,
    language: "en",
  },
  mascotOutfit: {
    hat: "cap-scholar",
    glasses: "none",
    scarf: "none",
  },

  // Phase 4: Wellbeing & Context defaults
  lateNightHour: 23,
  lastNightNudgeDismissedDate: undefined,
  lastBreakSuggestionDismissedAt: undefined,
  breakSuggestionsEnabled: true,
  lateNightNudgeEnabled: true,

  // Phase 6: Personalised Collaboration defaults
  buddySettings: {},
  cheerNotes: [],
  accountabilityPartner: undefined,
};

const listeners = new Set<PersonalStoreListener>();
let cachedStore: PersonalStoreData | null = null;

function applyRelaxDomEffects(relaxMode: boolean) {
  if (typeof document === 'undefined') return;
  if (relaxMode) {
    document.documentElement.setAttribute('data-relax', 'true');
    document.documentElement.style.setProperty('--animation-speed-factor', '1.3');
  } else {
    document.documentElement.removeAttribute('data-relax');
    document.documentElement.style.removeProperty('--animation-speed-factor');
  }
}

/**
 * Validate loaded JSON schema to ensure safe type compliance
 */
function validateSchema(data: unknown): PersonalStoreData {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_PERSONAL_STORE };
  }
  const obj = data as Partial<PersonalStoreData>;

  return {
    version: 1,
    relaxMode: Boolean(obj.relaxMode),
    pausePersonalisation: Boolean(obj.pausePersonalisation),
    switches: {
      adaptiveDifficulty: Boolean(obj.switches?.adaptiveDifficulty),
      mascotMemory: obj.switches?.mascotMemory !== false,
      mascotTips: obj.switches?.mascotTips !== false,
      nudges: obj.switches?.nudges !== false,
      insights: obj.switches?.insights !== false,
      preTestCalmDefault: Boolean(obj.switches?.preTestCalmDefault),
      celebrationIntensity:
        obj.switches?.celebrationIntensity === 'off' ||
        obj.switches?.celebrationIntensity === 'subtle' ||
        obj.switches?.celebrationIntensity === 'standard' ||
        obj.switches?.celebrationIntensity === 'confetti'
          ? obj.switches.celebrationIntensity
          : 'standard',
      breakIntervalMinutes:
        typeof obj.switches?.breakIntervalMinutes === 'number'
          ? Math.max(15, Math.min(120, obj.switches.breakIntervalMinutes))
          : 45,
    },
    events: Array.isArray(obj.events) ? obj.events.slice(-MAX_EVENT_LOG_SIZE) : [],
    dailySummaries: obj.dailySummaries && typeof obj.dailySummaries === 'object' ? obj.dailySummaries : {},
    forgottenDocIds: Array.isArray(obj.forgottenDocIds) ? obj.forgottenDocIds : [],
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : '2026-10-24T00:00:00.000Z',

    // Phase 2 safely hydrated
    whyStudying: {
      text: typeof obj.whyStudying?.text === 'string' && obj.whyStudying.text.trim()
        ? obj.whyStudying.text
        : DEFAULT_PERSONAL_STORE.whyStudying.text,
      emoji: typeof obj.whyStudying?.emoji === 'string' ? obj.whyStudying.emoji : "🌱",
      lastShownDate: obj.whyStudying?.lastShownDate,
      dismissedToday: Boolean(obj.whyStudying?.dismissedToday),
    },
    rewards: Array.isArray(obj.rewards)
      ? obj.rewards.map((r, idx) => ({
          id: String(r.id || `rew-item-${idx}`),
          title: String(r.title || "Study reward"),
          type: (r.type === 'sessions' || r.type === 'minutes' || r.type === 'quests' || r.type === 'streak'
            ? r.type
            : 'sessions') as RewardConditionType,
          target: Math.max(1, Number(r.target) || 1),
          claimed: Boolean(r.claimed),
          claimedAt: r.claimedAt,
          createdAt: String(r.createdAt || '2026-10-24T00:00:00.000Z'),
        }))
      : [...DEFAULT_PERSONAL_STORE.rewards],
    roomPlacements: obj.roomPlacements && typeof obj.roomPlacements === 'object'
      ? { ...DEFAULT_PERSONAL_STORE.roomPlacements, ...obj.roomPlacements }
      : { ...DEFAULT_PERSONAL_STORE.roomPlacements },
    badges: obj.badges && typeof obj.badges === 'object' ? obj.badges : {},
    weeklyStreakGoalDays: typeof obj.weeklyStreakGoalDays === 'number'
      ? Math.max(1, Math.min(7, obj.weeklyStreakGoalDays))
      : 3,

    // Phase 3 safely hydrated
    mascotMemories: Array.isArray(obj.mascotMemories)
      ? obj.mascotMemories.slice(0, MAX_MASCOT_MEMORIES).map((m, idx) => ({
          id: String(m.id || `mem-item-${idx}`),
          type: m.type || 'sprint_champion',
          title: String(m.title || 'Study Memory'),
          detail: String(m.detail || ''),
          topicName: m.topicName,
          documentId: m.documentId,
          date: String(m.date || '2026-10-24'),
          timestamp: Number(m.timestamp) || 1729728000000,
        }))
      : [...DEFAULT_PERSONAL_STORE.mascotMemories],
    personality: {
      cheerfulCalm: typeof obj.personality?.cheerfulCalm === 'number'
        ? Math.max(0, Math.min(100, obj.personality.cheerfulCalm))
        : 50,
      playfulSerious: typeof obj.personality?.playfulSerious === 'number'
        ? Math.max(0, Math.min(100, obj.personality.playfulSerious))
        : 50,
      voiceEnabled: Boolean(obj.personality?.voiceEnabled),
      voiceSpeed: typeof obj.personality?.voiceSpeed === 'number'
        ? Math.max(0.75, Math.min(1.5, obj.personality.voiceSpeed))
        : 1.0,
      selectedVoiceName: obj.personality?.selectedVoiceName,
      language: obj.personality?.language === 'hi' ? 'hi' : 'en',
    },
    mascotOutfit: {
      hat: obj.mascotOutfit?.hat || 'cap-scholar',
      glasses: obj.mascotOutfit?.glasses || 'none',
      scarf: obj.mascotOutfit?.scarf || 'none',
    },
    // Phase 4: Wellbeing & Context
    lateNightHour: typeof obj.lateNightHour === 'number' ? obj.lateNightHour : 23,
    lastNightNudgeDismissedDate: typeof obj.lastNightNudgeDismissedDate === 'string' ? obj.lastNightNudgeDismissedDate : undefined,
    lastBreakSuggestionDismissedAt: typeof obj.lastBreakSuggestionDismissedAt === 'number' ? obj.lastBreakSuggestionDismissedAt : undefined,
    breakSuggestionsEnabled: obj.breakSuggestionsEnabled !== false,
    lateNightNudgeEnabled: obj.lateNightNudgeEnabled !== false,

    // Phase 5: Insights About Themselves
    mistakeAnalysis: obj.mistakeAnalysis && typeof obj.mistakeAnalysis === 'object'
      ? {
          analyzedAt: String(obj.mistakeAnalysis.analyzedAt || ''),
          totalWrongAnalyzed: Number(obj.mistakeAnalysis.totalWrongAnalyzed) || 0,
          patterns: Array.isArray(obj.mistakeAnalysis.patterns) ? obj.mistakeAnalysis.patterns : [],
        }
      : undefined,

    // Phase 6: Personalised Collaboration
    buddySettings: obj.buddySettings && typeof obj.buddySettings === 'object'
      ? obj.buddySettings
      : {},
    cheerNotes: Array.isArray(obj.cheerNotes)
      ? obj.cheerNotes.slice(0, 50).map((c, idx) => ({
          id: String(c.id || `cheer-item-${idx}`),
          senderNickname: String(c.senderNickname || 'Buddy').slice(0, 30),
          senderEmoji: String(c.senderEmoji || '🌟'),
          message: String(c.message || '').slice(0, 120),
          emoji: String(c.emoji || '🌟'),
          createdAt: Number(c.createdAt) || 1729728000000,
          delivered: Boolean(c.delivered),
        }))
      : [],
    accountabilityPartner: obj.accountabilityPartner && typeof obj.accountabilityPartner === 'object'
      ? {
          partnerNickname: String(obj.accountabilityPartner.partnerNickname || 'Partner').slice(0, 30),
          partnerEmoji: String(obj.accountabilityPartner.partnerEmoji || '🤝'),
          goalType: obj.accountabilityPartner.goalType === 'sessions' ? 'sessions' : 'minutes',
          target: Number(obj.accountabilityPartner.target) || 120,
          myProgress: Number(obj.accountabilityPartner.myProgress) || 0,
          partnerProgress: Number(obj.accountabilityPartner.partnerProgress) || 0,
          partnerLastUpdated: String(obj.accountabilityPartner.partnerLastUpdated || ''),
          weekLabel: String(obj.accountabilityPartner.weekLabel || ''),
          checkInDismissedAt: typeof obj.accountabilityPartner.checkInDismissedAt === 'string' ? obj.accountabilityPartner.checkInDismissedAt : undefined,
        }
      : undefined,
  };
}

export function loadPersonalStore(): PersonalStoreData {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PERSONAL_STORE };
  }

  if (cachedStore) {
    return cachedStore;
  }

  try {
    const raw = localStorage.getItem(PERSONAL_STORAGE_KEY);
    if (!raw) {
      cachedStore = { ...DEFAULT_PERSONAL_STORE };
      return cachedStore;
    }
    const parsed = JSON.parse(raw);
    cachedStore = validateSchema(parsed);
    applyRelaxDomEffects(cachedStore.relaxMode);
    return cachedStore;
  } catch (err) {
    console.warn('[PersonalStore] Failed to load store, initializing defaults:', err);
    cachedStore = { ...DEFAULT_PERSONAL_STORE };
    return cachedStore;
  }
}

export function savePersonalStore(
  updater: PersonalStoreData | ((prev: PersonalStoreData) => PersonalStoreData)
): PersonalStoreData {
  const current = loadPersonalStore();
  const next = typeof updater === 'function' ? updater(current) : updater;

  const validated: PersonalStoreData = {
    ...next,
    version: 1,
    events: next.events.slice(-MAX_EVENT_LOG_SIZE),
    updatedAt: new Date().toISOString(),
  };

  cachedStore = validated;
  applyRelaxDomEffects(validated.relaxMode);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(validated));
    } catch (err) {
      console.error('[PersonalStore] Failed to persist store to localStorage:', err);
    }
  }

  // Notify active subscribers
  listeners.forEach((listener) => {
    try {
      listener(validated);
    } catch (e) {
      console.error('[PersonalStore] Listener error:', e);
    }
  });

  return validated;
}

export function subscribePersonalStore(listener: PersonalStoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Toggle or set Relax Mode
 */
export function setRelaxMode(active: boolean): void {
  savePersonalStore((prev) => ({
    ...prev,
    relaxMode: active,
  }));
}

/**
 * Toggle or set Master Personalisation Pause
 */
export function setPausePersonalisation(paused: boolean): void {
  savePersonalStore((prev) => ({
    ...prev,
    pausePersonalisation: paused,
  }));
}

/**
 * Update personal feature switches
 */
export function updatePersonalSwitches(
  updates: Partial<PersonalFeatureSwitches>
): void {
  savePersonalStore((prev) => ({
    ...prev,
    switches: {
      ...prev.switches,
      ...updates,
    },
  }));
}

// --------------------------------------------------------------------------
// Phase 2 Helper Functions
// --------------------------------------------------------------------------

export function updateWhyStudying(updates: Partial<WhyStudyingNote>): void {
  savePersonalStore((prev) => ({
    ...prev,
    whyStudying: {
      ...prev.whyStudying,
      ...updates,
    },
  }));
}

export function dismissWhyStudyingToday(): void {
  const today = new Date().toISOString().split('T')[0];
  savePersonalStore((prev) => ({
    ...prev,
    whyStudying: {
      ...prev.whyStudying,
      lastShownDate: today,
      dismissedToday: true,
    },
  }));
}

export function addStudentReward(reward: {
  title: string;
  type: RewardConditionType;
  target: number;
}): void {
  const newReward: StudentReward = {
    id: `reward-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: reward.title.trim() || 'My study reward',
    type: reward.type,
    target: Math.max(1, reward.target),
    claimed: false,
    createdAt: new Date().toISOString(),
  };

  savePersonalStore((prev) => ({
    ...prev,
    rewards: [newReward, ...prev.rewards],
  }));
}

export function claimStudentReward(rewardId: string): void {
  savePersonalStore((prev) => ({
    ...prev,
    rewards: prev.rewards.map((r) =>
      r.id === rewardId
        ? { ...r, claimed: true, claimedAt: new Date().toISOString() }
        : r
    ),
  }));
}

export function deleteStudentReward(rewardId: string): void {
  savePersonalStore((prev) => ({
    ...prev,
    rewards: prev.rewards.filter((r) => r.id !== rewardId),
  }));
}

export function updateRoomPlacement(slot: RoomSlot, itemId: string | undefined): void {
  savePersonalStore((prev) => ({
    ...prev,
    roomPlacements: {
      ...prev.roomPlacements,
      [slot]: itemId,
    },
  }));
}

export function setWeeklyStreakGoalDays(days: number): void {
  const validatedDays = Math.max(1, Math.min(7, days));
  savePersonalStore((prev) => ({
    ...prev,
    weeklyStreakGoalDays: validatedDays,
  }));
}

export function unlockBadge(badgeId: string): boolean {
  const current = loadPersonalStore();
  if (current.badges[badgeId]) {
    return false; // Already unlocked
  }

  savePersonalStore((prev) => ({
    ...prev,
    badges: {
      ...prev.badges,
      [badgeId]: {
        unlockedAt: new Date().toISOString(),
      },
    },
  }));
  return true;
}

// --------------------------------------------------------------------------
// Phase 3 Helper Functions: Mascot Memory, Personality & Outfits
// --------------------------------------------------------------------------

/**
 * Record a key learning memory for Pip (capped at MAX_MASCOT_MEMORIES)
 */
export function recordMascotMemory(
  memoryOrType: MascotMemoryType | Omit<MascotMemoryItem, 'id' | 'timestamp' | 'date'>,
  title?: string,
  detail?: string,
  topicName?: string,
  documentId?: string
): boolean {
  const current = loadPersonalStore();
  if (!current.switches.mascotMemory || current.pausePersonalisation) {
    return false;
  }

  const memory: Omit<MascotMemoryItem, 'id' | 'timestamp' | 'date'> =
    typeof memoryOrType === 'string'
      ? {
          type: memoryOrType,
          title: title || '',
          detail: detail || '',
          topicName,
          documentId,
        }
      : memoryOrType;

  // If document was forgotten by student, do not log memory for this document
  if (memory.documentId && current.forgottenDocIds.includes(memory.documentId)) {
    return false;
  }

  const now = new Date();
  const newMemory: MascotMemoryItem = {
    ...memory,
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: now.toISOString().split('T')[0],
    timestamp: now.getTime(),
  };

  savePersonalStore((prev) => ({
    ...prev,
    mascotMemories: [newMemory, ...prev.mascotMemories].slice(0, MAX_MASCOT_MEMORIES),
  }));
  return true;
}

/**
 * Delete a specific mascot memory
 */
export function deleteMascotMemory(id: string): void {
  savePersonalStore((prev) => ({
    ...prev,
    mascotMemories: prev.mascotMemories.filter((m) => m.id !== id),
  }));
}

/**
 * Clear all mascot memories
 */
export function clearAllMascotMemories(): void {
  savePersonalStore((prev) => ({
    ...prev,
    mascotMemories: [],
  }));
}

/**
 * Update Pip's personality sliders & voice settings
 */
export function updatePersonality(updates: Partial<MascotPersonality>): void {
  savePersonalStore((prev) => ({
    ...prev,
    personality: {
      ...prev.personality,
      ...updates,
    },
  }));
}

/**
 * Update Pip's equipped outfit & accessories
 */
export function updateMascotOutfit(updates: Partial<MascotOutfit>): void {
  savePersonalStore((prev) => ({
    ...prev,
    mascotOutfit: {
      ...prev.mascotOutfit,
      ...updates,
    },
  }));
}

/**
 * Dismiss or snooze break suggestion
 */
export function dismissBreakSuggestion(snoozeMinutes: number = 0): void {
  const nextTimestamp = Date.now() + snoozeMinutes * 60 * 1000;
  savePersonalStore((prev) => ({
    ...prev,
    lastBreakSuggestionDismissedAt: nextTimestamp,
  }));
}

/**
 * Dismiss late-night nudge for tonight
 */
export function dismissLateNightNudge(dateStr?: string): void {
  const today = dateStr || new Date().toISOString().split('T')[0];
  savePersonalStore((prev) => ({
    ...prev,
    lastNightNudgeDismissedDate: today,
  }));
}

/**
 * Update Phase 4 wellbeing settings
 */
export function updateWellbeingSettings(updates: {
  lateNightHour?: number;
  breakSuggestionsEnabled?: boolean;
  lateNightNudgeEnabled?: boolean;
  breakIntervalMinutes?: number;
}): void {
  savePersonalStore((prev) => ({
    ...prev,
    lateNightHour: updates.lateNightHour !== undefined ? updates.lateNightHour : prev.lateNightHour,
    breakSuggestionsEnabled:
      updates.breakSuggestionsEnabled !== undefined
        ? updates.breakSuggestionsEnabled
        : prev.breakSuggestionsEnabled,
    lateNightNudgeEnabled:
      updates.lateNightNudgeEnabled !== undefined
        ? updates.lateNightNudgeEnabled
        : prev.lateNightNudgeEnabled,
    switches: {
      ...prev.switches,
      breakIntervalMinutes:
        updates.breakIntervalMinutes !== undefined
          ? updates.breakIntervalMinutes
          : prev.switches.breakIntervalMinutes,
    },
  }));
}

/**
 * Phase 5: Save AI or rule-based mistake pattern analysis
 */
export function saveMistakeAnalysis(analysis: CachedMistakeAnalysis): void {
  savePersonalStore((prev) => ({
    ...prev,
    mistakeAnalysis: analysis,
  }));
}

export function clearMistakeAnalysis(): void {
  savePersonalStore((prev) => {
    const next = { ...prev };
    delete next.mistakeAnalysis;
    return next;
  });
}

/**
 * Phase 6: Set buddy privacy level, mute, or block settings
 */
export function setBuddyPersonalSettings(
  buddyId: string,
  settings: Partial<BuddyPersonalSettings>
): void {
  savePersonalStore((prev) => {
    const existing = prev.buddySettings[buddyId] || {
      privacyLevel: 'streak_only',
      muted: false,
      blocked: false,
    };
    return {
      ...prev,
      buddySettings: {
        ...prev.buddySettings,
        [buddyId]: { ...existing, ...settings },
      },
    };
  });
}

/**
 * Phase 6: Add incoming cheer message (checks block status)
 */
export function addCheerNote(cheer: CheerMessageItem): boolean {
  const current = loadPersonalStore();
  const buddySetting = current.buddySettings[cheer.senderNickname];
  if (buddySetting?.blocked) {
    return false;
  }

  savePersonalStore((prev) => ({
    ...prev,
    cheerNotes: [cheer, ...prev.cheerNotes.slice(0, 49)],
  }));
  return true;
}

export function markCheerDelivered(cheerId: string): void {
  savePersonalStore((prev) => ({
    ...prev,
    cheerNotes: prev.cheerNotes.map((c) =>
      c.id === cheerId ? { ...c, delivered: true } : c
    ),
  }));
}

export function clearCheerNotes(): void {
  savePersonalStore((prev) => ({
    ...prev,
    cheerNotes: [],
  }));
}

/**
 * Phase 6: Update accountability partner progress and agreement
 */
export function updateAccountabilityPartner(
  partner: AccountabilityPartnerState | undefined
): void {
  savePersonalStore((prev) => ({
    ...prev,
    accountabilityPartner: partner,
  }));
}

export function dismissAccountabilityCheckIn(): void {
  savePersonalStore((prev) => {
    if (!prev.accountabilityPartner) return prev;
    return {
      ...prev,
      accountabilityPartner: {
        ...prev.accountabilityPartner,
        checkInDismissedAt: new Date().toISOString(),
      },
    };
  });
}

/**
 * Reset personal store to factory defaults (own key only)
 */
export function resetPersonalStore(): void {
  savePersonalStore(() => ({
    ...DEFAULT_PERSONAL_STORE,
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Forget one document from personal history, events, and memories
 */
export function forgetDocumentData(documentId: string): void {
  savePersonalStore((prev) => ({
    ...prev,
    forgottenDocIds: Array.from(new Set([...prev.forgottenDocIds, documentId])),
    events: prev.events.filter((e) => e.documentId !== documentId),
    mascotMemories: prev.mascotMemories.filter((m) => m.documentId !== documentId),
  }));
}

/**
 * React hook to access personal store with automatic reactivity
 */
import { useEffect, useState } from 'react';

export function usePersonalStore() {
  const [store, setStore] = useState<PersonalStoreData>(() => loadPersonalStore());

  useEffect(() => {
    setStore(loadPersonalStore());
    const unsubscribe = subscribePersonalStore((updated) => {
      setStore(updated);
    });
    return unsubscribe;
  }, []);

  // When Relax Mode is ON:
  // 1. Celebration intensity is capped at Subtle (unless student chose Off)
  const baseIntensity = store.switches.celebrationIntensity;
  const effectiveCelebrationIntensity =
    store.relaxMode
      ? baseIntensity === 'off'
        ? 'off'
        : 'subtle'
      : baseIntensity;

  // 2. Break suggestion interval: 30 minutes in Relax mode instead of 45
  const effectiveBreakMinutes = store.relaxMode
    ? Math.min(30, store.switches.breakIntervalMinutes)
    : store.switches.breakIntervalMinutes;

  // 3. Personality shifted towards calm in Relax mode
  const effectivePersonality: MascotPersonality = {
    ...store.personality,
    cheerfulCalm: store.relaxMode
      ? Math.max(80, store.personality.cheerfulCalm)
      : store.personality.cheerfulCalm,
  };

  return {
    store,
    setRelaxMode,
    setPausePersonalisation,
    updateSwitches: updatePersonalSwitches,
    updateWhyStudying,
    dismissWhyStudyingToday,
    addStudentReward,
    claimStudentReward,
    deleteStudentReward,
    updateRoomPlacement,
    setWeeklyStreakGoalDays,
    unlockBadge,
    recordMascotMemory,
    deleteMascotMemory,
    clearAllMascotMemories,
    updatePersonality,
    updateMascotOutfit,
    dismissBreakSuggestion,
    dismissLateNightNudge,
    updateWellbeingSettings,
    saveMistakeAnalysis,
    clearMistakeAnalysis,
    setBuddyPersonalSettings,
    addCheerNote,
    markCheerDelivered,
    clearCheerNotes,
    updateAccountabilityPartner,
    dismissAccountabilityCheckIn,
    effectiveCelebrationIntensity,
    effectiveBreakMinutes,
    effectivePersonality,
  };
}
