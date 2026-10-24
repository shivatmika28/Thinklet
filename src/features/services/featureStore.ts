import { FeatureStoreData, FeatureSettings } from '../types.ext';
import { load as loadCoreStorage } from '../../services/storage';
import { CoreState } from '../../types';

export const FEATURE_STORAGE_KEY = 'learnmate.features.v1';

export const DEFAULT_SETTINGS: FeatureSettings = {
  tone: 'friendly',
  explanationLevel: 'standard',
  language: 'English',
  dyslexiaMode: false,
  enablePracticePaper: true,
  enableAnswerChecker: true,
  enableTeachBack: true,
  enableMasteryTracker: true,
  enableSpacedRepetition: true,
  enableAdaptivePlanner: true,
  enableSmartNotes: true,
  enableVisualExplainer: true,
  enableImageInput: true,
  enableVoice: true,
  enableStudyTracker: true,
  enableShareCard: true,
  enableFlashcards: true,
  enableAnimations: true,
  enableMascotAnimations: true,
  enableMascotTips: true
};

export const DEFAULT_STORE: FeatureStoreData = {
  settings: DEFAULT_SETTINGS,
  practicePapers: [],
  answerChecks: [],
  notes: [],
  flashcards: [],
  spacedBoxes: {},
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: ''
  },
  goal: {
    dailyMinutes: 20,
    examDate: undefined,
    todayMinutesCompleted: 0,
    lastGoalDate: new Date().toISOString().split('T')[0]
  },
  plans: [],
  voicePrefs: {
    rate: 1.0,
    pitch: 1.0
  },
  studySessions: []
};

type StoreListener = (data?: FeatureStoreData) => void;
const listeners = new Set<StoreListener>();

let cachedSnapshot: FeatureStoreData | null = null;
let lastRecordedSessionTimestamp = 0;

export function getServerFeatureStoreSnapshot(): FeatureStoreData {
  return DEFAULT_STORE;
}

export function getFeatureStoreSnapshot(): FeatureStoreData {
  if (typeof window === 'undefined') return DEFAULT_STORE;
  if (!cachedSnapshot) {
    cachedSnapshot = loadFeatureStore();
  }
  return cachedSnapshot;
}

export function subscribeToFeatureStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(data?: FeatureStoreData) {
  const snapshot = data || getFeatureStoreSnapshot();
  listeners.forEach(fn => {
    try {
      fn(snapshot);
    } catch (e) {
      console.error('FeatureStore listener error', e);
    }
  });
}

// Synchronize changes across multiple browser tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === FEATURE_STORAGE_KEY) {
      cachedSnapshot = null;
      const next = getFeatureStoreSnapshot();
      notifyListeners(next);
    }
  });
}

export function loadFeatureStore(forceReload = false): FeatureStoreData {
  if (typeof window === 'undefined') return DEFAULT_STORE;
  if (!cachedSnapshot && !forceReload) {
    // continue to load
  } else if (!forceReload && cachedSnapshot) {
    return cachedSnapshot;
  }

  try {
    const raw = localStorage.getItem(FEATURE_STORAGE_KEY);
    if (!raw) {
      cachedSnapshot = DEFAULT_STORE;
      return cachedSnapshot;
    }
    const parsed = JSON.parse(raw);
    cachedSnapshot = {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      practicePapers: parsed.practicePapers || [],
      answerChecks: parsed.answerChecks || [],
      notes: parsed.notes || [],
      flashcards: parsed.flashcards || [],
      spacedBoxes: parsed.spacedBoxes || {},
      streak: { ...DEFAULT_STORE.streak, ...(parsed.streak || {}) },
      goal: { ...DEFAULT_STORE.goal, ...(parsed.goal || {}) },
      plans: parsed.plans || [],
      voicePrefs: { ...DEFAULT_STORE.voicePrefs, ...(parsed.voicePrefs || {}) },
      studySessions: Array.isArray(parsed.studySessions) ? parsed.studySessions : []
    };
    return cachedSnapshot;
  } catch (err) {
    console.warn('Failed to parse feature storage, resetting to default', err);
    cachedSnapshot = DEFAULT_STORE;
    return cachedSnapshot;
  }
}

export function saveFeatureStore(updates: Partial<FeatureStoreData>): FeatureStoreData {
  const current = getFeatureStoreSnapshot();
  const next: FeatureStoreData = {
    ...current,
    ...updates,
    settings: updates.settings ? { ...current.settings, ...updates.settings } : current.settings,
    streak: updates.streak ? { ...current.streak, ...updates.streak } : current.streak,
    goal: updates.goal ? { ...current.goal, ...updates.goal } : current.goal,
    voicePrefs: updates.voicePrefs ? { ...current.voicePrefs, ...updates.voicePrefs } : current.voicePrefs,
    studySessions: updates.studySessions !== undefined ? updates.studySessions : current.studySessions
  };

  cachedSnapshot = next;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FEATURE_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to write feature storage', err);
    }
  }

  notifyListeners(next);
  return next;
}

export function updateFeatureSettings(settingsUpdate: Partial<FeatureSettings>): FeatureSettings {
  const current = getFeatureStoreSnapshot();
  const nextSettings = { ...current.settings, ...settingsUpdate };
  saveFeatureStore({ settings: nextSettings });
  return nextSettings;
}

/**
 * Record a real study session into persistent feature store.
 * Prevents rapid double-trigger duplicates, synchronizes streak and daily goal.
 */
export function recordStudySession(
  durationMinutes: number,
  type: 'focus_timer' | 'pomodoro' | 'sprint' | 'quiz' | 'practice_paper' = 'sprint',
  materialId?: string,
  notes?: string
): FeatureStoreData | null {
  if (durationMinutes <= 0) return null;

  const now = Date.now();
  // Debounce duplicate calls within 2 seconds
  if (now - lastRecordedSessionTimestamp < 2000) {
    console.warn('Ignoring duplicate study session submission within 2s.');
    return null;
  }
  lastRecordedSessionTimestamp = now;

  const current = getFeatureStoreSnapshot();
  const todayStr = new Date().toISOString().split('T')[0];

  const newSession = {
    id: `session_${now}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now,
    date: todayStr,
    durationMinutes: Math.round(durationMinutes),
    type,
    materialId,
    notes
  };

  // Streak update logic
  const streak = current.streak;
  let newCurrentStreak = streak.currentStreak;
  if (streak.lastActiveDate !== todayStr) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (streak.lastActiveDate === yesterday) {
      newCurrentStreak += 1;
    } else {
      newCurrentStreak = 1;
    }
  }
  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

  // Goal update logic
  const currentCompleted =
    current.goal.lastGoalDate === todayStr ? current.goal.todayMinutesCompleted : 0;
  const newTodayCompleted = currentCompleted + newSession.durationMinutes;

  const updatedSessions = [newSession, ...(current.studySessions || [])];

  return saveFeatureStore({
    studySessions: updatedSessions,
    streak: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: todayStr
    },
    goal: {
      ...current.goal,
      todayMinutesCompleted: newTodayCompleted,
      lastGoalDate: todayStr
    }
  });
}

export interface DayStudyStat {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue", etc.
  formattedDate: string; // "Oct 24"
  fullDate: string; // "Saturday, Oct 24, 2026"
  totalMinutes: number;
  sessionCount: number;
  isToday: boolean;
}

export interface StudyStatsSummary {
  days: DayStudyStat[];
  todayMinutes: number;
  weeklyTotalMinutes: number;
  periodTotalMinutes: number;
  dailyGoalMinutes: number;
  goalCompletionPercent: number;
  hasData: boolean;
  activeStreak: number;
}

/**
 * Calculates aggregated daily study stats for Week (last 7 days) or Month (current month)
 * from real recorded study sessions.
 */
export function getDailyStudyStats(
  timeRange: 'week' | 'month' = 'week',
  storeData?: FeatureStoreData
): StudyStatsSummary {
  const store = storeData || getFeatureStoreSnapshot();
  const sessions = store.studySessions || [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const days: DayStudyStat[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (timeRange === 'week') {
    // Last 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];
      const formattedDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      const fullDate = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Filter sessions for this date
      const daySessions = sessions.filter(s => s.date === dateStr);
      let totalMinutes = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      // Backwards compatibility: if today's store.goal has recorded minutes but no session entry yet
      if (dateStr === todayStr && totalMinutes === 0 && store.goal.lastGoalDate === todayStr && store.goal.todayMinutesCompleted > 0) {
        totalMinutes = store.goal.todayMinutesCompleted;
      }

      days.push({
        date: dateStr,
        dayLabel,
        formattedDate,
        fullDate,
        totalMinutes,
        sessionCount: daySessions.length || (totalMinutes > 0 ? 1 : 0),
        isToday: dateStr === todayStr
      });
    }
  } else {
    // Current month: days 1 through current day (or full month up to today)
    // To show daily activity for the current month
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentDay = today.getDate();

    for (let dayNum = 1; dayNum <= currentDay; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${dayNum}`;
      const formattedDate = `${monthNames[month]} ${dayNum}`;
      const fullDate = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      const daySessions = sessions.filter(s => s.date === dateStr);
      let totalMinutes = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      if (dateStr === todayStr && totalMinutes === 0 && store.goal.lastGoalDate === todayStr && store.goal.todayMinutesCompleted > 0) {
        totalMinutes = store.goal.todayMinutesCompleted;
      }

      days.push({
        date: dateStr,
        dayLabel,
        formattedDate,
        fullDate,
        totalMinutes,
        sessionCount: daySessions.length || (totalMinutes > 0 ? 1 : 0),
        isToday: dateStr === todayStr
      });
    }
  }

  // Calculate rolling 7 days weekly total
  const past7Days = new Set(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    })
  );

  const weeklyTotalMinutes = sessions
    .filter(s => past7Days.has(s.date))
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0) ||
    (store.goal.lastGoalDate === todayStr ? store.goal.todayMinutesCompleted : 0);

  const todayStat = days.find(d => d.isToday);
  const todayMinutes = todayStat ? todayStat.totalMinutes : (store.goal.lastGoalDate === todayStr ? store.goal.todayMinutesCompleted : 0);
  const periodTotalMinutes = days.reduce((acc, d) => acc + d.totalMinutes, 0);
  const dailyGoalMinutes = store.goal.dailyMinutes || 20;
  const goalCompletionPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));
  const hasData = periodTotalMinutes > 0;

  return {
    days,
    todayMinutes,
    weeklyTotalMinutes,
    periodTotalMinutes,
    dailyGoalMinutes,
    goalCompletionPercent,
    hasData,
    activeStreak: store.streak.currentStreak || 0
  };
}

/**
 * READ-ONLY access to core storage.
 * Per Isolation Rule 2: Never write to core storage from features.
 */
export function loadCoreReadOnly(): Readonly<CoreState> {
  return Object.freeze(loadCoreStorage());
}

