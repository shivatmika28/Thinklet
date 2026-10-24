export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface TopicItem {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface QuizQuestionData {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: string; // Hidden on client during quiz
  explanation?: string;
  topicName: string;
  pageReferences: string;
}

export interface QuizAttemptSummary {
  id: string;
  materialId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: string;
}

export interface UserAnswerEvaluation {
  questionId: string;
  questionText: string;
  topicName: string;
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  pageReferences: string;
}

export interface TopicAccuracy {
  topicName: string;
  total: number;
  correct: number;
  percentage: number;
  isWeak: boolean; // below 60%
}

export interface TargetedPracticeQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topicName: string;
  pageReferences: string;
}

export interface RevisionTaskItem {
  id: string;
  topicName: string;
  recommendedActivity: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "COMPLETED";
  createdAt: string;
}

export interface StudyMaterialSummary {
  id: string;
  title: string;
  sourceType: "pdf" | "text" | "demo";
  fileName?: string | null;
  pageCount: number;
  createdAt: string;
  topicsCount: number;
  attemptsCount: number;
  latestScore?: number | null;
}
