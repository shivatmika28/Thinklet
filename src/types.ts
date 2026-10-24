// Core types for LearnMate & Feature Pack integration

export type Lang = 'English' | 'Hindi' | 'Tamil' | 'Bengali' | 'Marathi' | 'Hinglish';

export interface PageText {
  page: number;
  text: string;
  label?: string;
}

export interface Topic {
  id: string;
  name: string;
  summary: string;
  description?: string;
  pages: number[];
  order?: number;
}

export type MasteryLevel = 'mastered' | 'learning' | 'weak';

export interface AttemptAnswer {
  selected?: string | number;
  confidence?: 'sure' | 'unsure' | 'guess';
  isCorrect?: boolean;
}

export interface Attempt {
  id: string;
  timestamp: number;
  score: number;
  totalQuestions?: number;
  topicMastery: Record<string, MasteryLevel>;
  answers: Record<string, AttemptAnswer>;
}

export interface Question {
  id: string;
  topicId: string;
  text: string;
  prompt?: string;
  options?: string[];
  answer?: string | number;
  explanation?: string;
  quote?: string;
  page?: number;
}

export interface PlanSession {
  day: number;
  topicId: string;
  focus: string;
  durationMinutes: number;
}

export interface Plan {
  id: string;
  createdAt: number;
  sessions: PlanSession[];
}

export interface CoreState {
  pages: PageText[];
  topics: Topic[];
  attempts: Attempt[];
  plan?: Plan | null;
}
