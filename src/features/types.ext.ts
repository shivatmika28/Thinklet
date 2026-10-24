import { Question, Attempt, Lang, MasteryLevel, Topic, PageText } from '../types';

export type Tone = 'friendly' | 'formal' | 'exam_coach';
export type ExplanationLevel = 'age_12' | 'standard' | 'exam_level';

export interface FeatureSettings {
  tone: Tone;
  explanationLevel: ExplanationLevel;
  language: Lang;
  dyslexiaMode: boolean;
  enablePracticePaper: boolean;
  enableAnswerChecker: boolean;
  enableTeachBack: boolean;
  enableMasteryTracker: boolean;
  enableSpacedRepetition: boolean;
  enableAdaptivePlanner: boolean;
  enableSmartNotes: boolean;
  enableVisualExplainer: boolean;
  enableImageInput: boolean;
  enableVoice: boolean;
  enableStudyTracker: boolean;
  enableShareCard: boolean;
  enableFlashcards: boolean;
  enableAnimations?: boolean;
  enableMascotAnimations?: boolean;
  enableMascotTips?: boolean;
};

export type QuestionLevel = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

export type QuestionX = Question & {
  level?: QuestionLevel;
  marks?: number;
  targets?: string;
  section?: 'A' | 'B' | 'C' | 'D';
  acceptedAnswers?: string[];
  type?: 'mcq' | 'true_false' | 'fill_in_the_blank' | 'short_answer';
  answerIndex?: number;
  quote?: string;
};

export type AttemptX = Attempt & {
  featureMetadata?: {
    source?: 'core' | 'practice_paper' | 'flashcard';
    durationSeconds?: number;
  };
};

export interface AnswerCheckRecord {
  id: string;
  timestamp: number;
  question: string;
  studentAnswer: string;
  topicId?: string;
  materialId?: string;
  verdict: 'correct' | 'partial' | 'incorrect';
  score: number;
  misconception: string | null;
  missingPoints: string[];
  alternatives: string[];
  evidenceQuote: string;
  page: number;
  verified: boolean;
  isTeachBack?: boolean;
}

export interface PracticePaperResult {
  id: string;
  timestamp: number;
  topicIds: string[];
  materialId?: string;
  level: QuestionLevel;
  questions: QuestionX[];
  userAnswers: Record<string, string | number>;
  score: number;
  totalMarks: number;
  scoredMarks: number;
}

export interface NoteItem {
  id: string;
  topicId: string;
  materialId?: string;
  title: string;
  type: 'key_points' | 'definitions' | 'formulas' | 'mnemonic';
  content: string;
  pageReferences: number[];
  createdAt: number;
  updatedAt: number;
}

export interface FlashcardItem {
  id: string;
  topicId: string;
  materialId?: string;
  front: string;
  back: string;
  page: number;
  box: number; // Leitner box 1 to 5
  nextReviewDate: number;
  lastReviewedDate?: number;
}

export interface SpacedRepetitionBox {
  topicId: string;
  box: number; // 1, 2, 3, 4
  intervalDays: number; // 1, 3, 7, 14
  lastReviewedDate: number;
  nextDueDate: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface StudyGoal {
  dailyMinutes: number;
  examDate?: string; // YYYY-MM-DD
  todayMinutesCompleted: number;
  lastGoalDate: string; // YYYY-MM-DD
}

export interface VoicePrefs {
  rate: number;
  pitch: number;
  voiceUri?: string;
  voiceGender?: string;
}

export interface FeaturePlanVersion {
  version: number;
  createdAt: number;
  reason: string;
  materialId?: string;
  sessions: {
    day: number;
    topicId: string;
    focus: string;
    durationMinutes: number;
    coachingLine?: string;
    completed?: boolean;
  }[];
}

export interface StudySessionRecord {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  type?: 'focus_timer' | 'pomodoro' | 'sprint' | 'quiz' | 'practice_paper';
  materialId?: string;
  notes?: string;
}

export interface FeatureStoreData {
  settings: FeatureSettings;
  practicePapers: PracticePaperResult[];
  answerChecks: AnswerCheckRecord[];
  notes: NoteItem[];
  flashcards: FlashcardItem[];
  spacedBoxes: Record<string, SpacedRepetitionBox>;
  streak: StreakData;
  goal: StudyGoal;
  plans: FeaturePlanVersion[];
  voicePrefs: VoicePrefs;
  studySessions: StudySessionRecord[];
}

export interface UnifiedMasteryData {
  topicId: string;
  mastery: MasteryLevel;
  accuracy: number;
  totalAttempts: number;
  sources: {
    coreQuiz: number;
    practicePaper: number;
    answerCheck: number;
    flashcards: number;
  };
}

export interface CalibrationReport {
  sureAccuracy: number;
  unsureAccuracy: number;
  guessAccuracy: number;
  statement: string;
}
