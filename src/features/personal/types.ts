/**
 * Thinklet Personal & Relax Layer - Type Definitions
 * Storage Key: "thinklet.personal.v1"
 */

export type CelebrationIntensity = 'off' | 'subtle' | 'standard' | 'confetti';

export interface StructuredReason {
  rule: string;
  data: string[];
}

export type PersonalEventType =
  | 'session_start'
  | 'session_stop'
  | 'quiz_answered'
  | 'quiz_finished'
  | 'quest_completed'
  | 'flashcard_reviewed'
  | 'document_opened';

export interface PersonalEvent {
  id: string;
  type: PersonalEventType;
  timestamp: number;
  date: string; // YYYY-MM-DD
  documentId?: string;
  topicId?: string;
  meta?: Record<string, unknown>;
}

export interface DailySummary {
  date: string;
  studyMinutes: number;
  sessionsCount: number;
  quizzesCompleted: number;
  questionsAnswered: number;
  flashcardsReviewed: number;
  questsCompleted: number;
}

export interface PersonalFeatureSwitches {
  adaptiveDifficulty: boolean; // note: disabled if not supported in core
  mascotMemory: boolean;
  mascotTips: boolean;
  nudges: boolean;
  insights: boolean;
  preTestCalmDefault: boolean;
  celebrationIntensity: CelebrationIntensity;
  breakIntervalMinutes: number; // default 45, Relax mode: 30
}

// --------------------------------------------------------------------------
// Phase 2: Motivation Types
// --------------------------------------------------------------------------

export interface WhyStudyingNote {
  text: string;
  emoji?: string;
  lastShownDate?: string;
  dismissedToday?: boolean;
}

export type RewardConditionType = 'sessions' | 'minutes' | 'quests' | 'streak';

export interface StudentReward {
  id: string;
  title: string;
  type: RewardConditionType;
  target: number;
  claimed: boolean;
  claimedAt?: string;
  createdAt: string;
}

export type RoomSlot = 'desk' | 'plant' | 'lamp' | 'poster' | 'rug';

export interface RoomItem {
  id: string;
  slot: RoomSlot;
  name: string;
  description: string;
  requiredLevel: number;
  requiredXp?: number;
  color: string;
}

export interface PersonalBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  ruleKey: string;
  unlockedAt?: string;
}

export interface PastSelfMetrics {
  thisWeekMinutes: number;
  lastWeekMinutes: number;
  thisWeekAccuracy: number;
  lastWeekAccuracy: number;
  thisWeekActiveDays: number;
  lastWeekActiveDays: number;
  encouragement: string;
}

// --------------------------------------------------------------------------
// Phase 3: Mascot with a Memory Types
// --------------------------------------------------------------------------

export type MascotMemoryType =
  | 'topic_mastered'
  | 'tough_quiz'
  | 'streak_milestone'
  | 'comeback_return'
  | 'sprint_champion';

export interface MascotMemoryItem {
  id: string;
  type: MascotMemoryType;
  title: string;
  detail: string;
  topicName?: string;
  documentId?: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface MascotPersonality {
  cheerfulCalm: number; // 0 (cheerful) to 100 (calm)
  playfulSerious: number; // 0 (playful) to 100 (serious)
  voiceEnabled: boolean;
  voiceSpeed: number; // 0.75 to 1.5
  selectedVoiceName?: string;
  language: 'en' | 'hi';
}

export interface MascotOutfit {
  hat: string; // 'cap-scholar' | 'beanie-sage' | 'wizard-hat' | 'none'
  glasses: string; // 'none' | 'glasses-round' | 'glasses-sunglasses'
  scarf: string; // 'none' | 'scarf-terracotta' | 'scarf-emerald'
}

export interface MascotSpeechItem {
  text: string;
  voiceText?: string;
  reason: StructuredReason;
  mood?: 'wave' | 'happy' | 'thinking' | 'celebrating' | 'studying' | 'sleepy' | 'focused';
}

export interface PersonalStoreData {
  version: 1;
  relaxMode: boolean;
  pausePersonalisation: boolean;
  switches: PersonalFeatureSwitches;
  events: PersonalEvent[];
  dailySummaries: Record<string, DailySummary>;
  forgottenDocIds: string[];
  updatedAt: string;

  // Phase 2: Motivation
  whyStudying: WhyStudyingNote;
  rewards: StudentReward[];
  roomPlacements: Partial<Record<RoomSlot, string>>;
  badges: Record<string, { unlockedAt: string }>;
  weeklyStreakGoalDays: number; // default 3, adjustable

  // Phase 3: Mascot Memory, Personality & Outfits
  mascotMemories: MascotMemoryItem[];
  personality: MascotPersonality;
  mascotOutfit: MascotOutfit;

  // Phase 4: Wellbeing & Context
  lateNightHour: number; // default 23 (11 PM)
  lastNightNudgeDismissedDate?: string;
  lastBreakSuggestionDismissedAt?: number;
  breakSuggestionsEnabled: boolean;
  lateNightNudgeEnabled: boolean;

  // Phase 5: Insights About Themselves
  mistakeAnalysis?: CachedMistakeAnalysis;

  // Phase 6: Personalised Collaboration
  buddySettings: Record<string, BuddyPersonalSettings>;
  cheerNotes: CheerMessageItem[];
  accountabilityPartner?: AccountabilityPartnerState;
}

// --------------------------------------------------------------------------
// Phase 4: Wellbeing and Context Types
// --------------------------------------------------------------------------

export type BreakType = 'stretch' | 'water' | 'eye_rest';

export type DeviceType = 'phone' | 'tablet' | 'laptop' | 'desktop';

export interface DeviceSuggestion {
  deviceType: DeviceType;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  actionEvent?: string;
  icon: string;
}

export interface CommuteAudioItem {
  id: string;
  title: string;
  textToSpeak: string;
  detail: string;
  type: 'flashcard' | 'note' | 'weak_topic';
}

// --------------------------------------------------------------------------
// Phase 5: Insights About Themselves Types
// --------------------------------------------------------------------------

export interface LearningProfileData {
  bestTimeOfDay: string | null;
  bestTimeReason: string;
  strongestQuestionType: string | null;
  strongestTypeAccuracy: number | null;
  usualSessionMinutes: number | null;
  totalSessionsRecorded: number;
  hasEnoughData: boolean;
  reason: StructuredReason;
}

export interface MistakePatternItem {
  id: string;
  pattern: string;
  frequency: 'frequent' | 'recurring' | 'occasional';
  remedy: string;
  exampleQuestions: string[];
}

export interface CachedMistakeAnalysis {
  analyzedAt: string;
  totalWrongAnalyzed: number;
  patterns: MistakePatternItem[];
}

export interface WrongAnswerSample {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer?: string;
  topicName?: string;
  misconceptionTag?: string;
}

export interface TopicJourneyPoint {
  attemptId: string;
  timestamp: number;
  date: string;
  topicId: string;
  topicName: string;
  mastery: 'mastered' | 'learning' | 'weak';
  scorePercent: number;
}

export interface ThinkletWrappedData {
  monthName: string;
  hoursStudied: number;
  biggestImprovement: {
    topicName: string;
    initialScore: number;
    currentScore: number;
    gain: number;
  } | null;
  favouriteTopic: {
    topicName: string;
    questionsPracticed: number;
  } | null;
  longestStreak: number;
  totalQuizzesCompleted: number;
  keyMascotQuote: string;
}

// --------------------------------------------------------------------------
// Phase 6: Personalised Collaboration Types
// --------------------------------------------------------------------------

export type BuddyPrivacyLevel = 'none' | 'streak_only' | 'streak_topics';

export interface BuddyPersonalSettings {
  privacyLevel: BuddyPrivacyLevel;
  muted: boolean;
  blocked: boolean;
}

export interface CheerMessageItem {
  id: string;
  senderNickname: string;
  senderEmoji: string;
  message: string; // Max 120 chars
  emoji: string;
  createdAt: number;
  delivered: boolean;
}

export interface AccountabilityPartnerState {
  partnerNickname: string;
  partnerEmoji: string;
  goalType: 'minutes' | 'sessions';
  target: number;
  myProgress: number;
  partnerProgress: number;
  partnerLastUpdated: string;
  weekLabel: string;
  checkInDismissedAt?: string;
}

export interface BuddyProgressPayload {
  type: 'BUDDY_PROGRESS';
  version: 1;
  senderNickname: string;
  senderEmoji: string;
  privacyLevel: BuddyPrivacyLevel;
  streak?: number;
  weeklyActiveDays?: number;
  masteredTopics?: string[];
  createdAt: number;
}

export interface CheerCodePayload {
  type: 'CHEER';
  version: 1;
  senderNickname: string;
  senderEmoji: string;
  message: string;
  emoji: string;
  createdAt: number;
}

export interface AccountabilityGoalPayload {
  type: 'ACCOUNTABILITY_PROGRESS';
  version: 1;
  senderNickname: string;
  senderEmoji: string;
  goalType: 'minutes' | 'sessions';
  target: number;
  currentProgress: number;
  weekStartDate: string;
  createdAt: number;
}

export type PersonalStoreListener = (data: PersonalStoreData) => void;

