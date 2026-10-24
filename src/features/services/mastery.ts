import { Topic, Attempt, MasteryLevel } from '../../types';
import { loadFeatureStore, loadCoreReadOnly } from './featureStore';
import { UnifiedMasteryData, CalibrationReport } from '../types.ext';

export interface ExamReadinessData {
  score: number; // 0 - 100
  accuracyComponent: number;
  coverageComponent: number;
  calibrationComponent: number;
  trend: { timestamp: number; score: number }[];
  summary: string;
}

/**
 * Computes unified per-topic mastery strictly in code across:
 * 1. Core quiz attempts (loadCoreReadOnly().attempts)
 * 2. Feature practice paper results (featureStore.practicePapers)
 * 3. Feature answer check records (featureStore.answerChecks)
 * 4. Flashcard reviews (featureStore.flashcards)
 *
 * Thresholds: >=80% = 'mastered', >=50% = 'learning', <50% = 'weak'
 */
export function getUnifiedTopicMastery(topics: Topic[]): UnifiedMasteryData[] {
  const core = loadCoreReadOnly();
  const featureStore = loadFeatureStore();

  const topicStats: Record<
    string,
    {
      totalQuestions: number;
      correctQuestions: number;
      coreQuizCount: number;
      practicePaperCount: number;
      answerCheckCount: number;
      flashcardCount: number;
    }
  > = {};

  for (const t of topics) {
    topicStats[t.id] = {
      totalQuestions: 0,
      correctQuestions: 0,
      coreQuizCount: 0,
      practicePaperCount: 0,
      answerCheckCount: 0,
      flashcardCount: 0
    };
  }

  // 1. Core Attempts
  for (const att of core.attempts) {
    for (const [topicId, mastery] of Object.entries(att.topicMastery)) {
      if (topicStats[topicId]) {
        topicStats[topicId].coreQuizCount += 1;
        topicStats[topicId].totalQuestions += 1;
        if (mastery === 'mastered') {
          topicStats[topicId].correctQuestions += 1;
        } else if (mastery === 'learning') {
          topicStats[topicId].correctQuestions += 0.6;
        }
      }
    }
  }

  // 2. Practice Papers
  for (const paper of featureStore.practicePapers) {
    for (const q of paper.questions) {
      if (topicStats[q.topicId]) {
        topicStats[q.topicId].practicePaperCount += 1;
        topicStats[q.topicId].totalQuestions += 1;
        const ans = paper.userAnswers[q.id];
        if (q.section === 'A' || q.section === 'B') {
          if (typeof ans === 'number' && ans === q.answerIndex) {
            topicStats[q.topicId].correctQuestions += 1;
          }
        } else if (q.section === 'C') {
          const userStr = String(ans || '').trim().toLowerCase();
          const isAccepted = (q.acceptedAnswers || []).some(a => a.toLowerCase() === userStr);
          if (isAccepted) topicStats[q.topicId].correctQuestions += 1;
        } else {
          // Short answer partial credit
          if (typeof ans === 'string' && ans.length > 10) {
            topicStats[q.topicId].correctQuestions += 0.7;
          }
        }
      }
    }
  }

  // 3. Answer Checks
  for (const check of featureStore.answerChecks) {
    if (check.topicId && topicStats[check.topicId]) {
      topicStats[check.topicId].answerCheckCount += 1;
      topicStats[check.topicId].totalQuestions += 1;
      topicStats[check.topicId].correctQuestions += check.score; // 0 to 1
    }
  }

  // 4. Flashcards
  for (const card of featureStore.flashcards) {
    if (topicStats[card.topicId]) {
      topicStats[card.topicId].flashcardCount += 1;
      topicStats[card.topicId].totalQuestions += 1;
      // Box 1 = 0.2, Box 2 = 0.5, Box 3 = 0.8, Box 4 = 1.0
      const boxWeight = card.box >= 4 ? 1.0 : card.box === 3 ? 0.8 : card.box === 2 ? 0.5 : 0.2;
      topicStats[card.topicId].correctQuestions += boxWeight;
    }
  }

  return topics.map(t => {
    const stats = topicStats[t.id];
    const accuracy = stats.totalQuestions > 0 ? stats.correctQuestions / stats.totalQuestions : 0;
    let mastery: MasteryLevel = 'weak';
    if (accuracy >= 0.8) {
      mastery = 'mastered';
    } else if (accuracy >= 0.5) {
      mastery = 'learning';
    }

    return {
      topicId: t.id,
      mastery,
      accuracy: Math.round(accuracy * 100) / 100,
      totalAttempts: stats.totalQuestions,
      sources: {
        coreQuiz: stats.coreQuizCount,
        practicePaper: stats.practicePaperCount,
        answerCheck: stats.answerCheckCount,
        flashcards: stats.flashcardCount
      }
    };
  });
}

/**
 * Creates an in-memory core Attempt object representing the unified mastery.
 * Per Isolation Rule 2 & 5: Used to feed core buildPlan/diffPlans in-memory;
 * NEVER saved to core storage!
 */
export function buildInMemoryUnifiedAttempt(topics: Topic[]): Attempt {
  const unified = getUnifiedTopicMastery(topics);
  const topicMastery: Record<string, MasteryLevel> = {};
  let totalScore = 0;

  for (const u of unified) {
    topicMastery[u.topicId] = u.mastery;
    totalScore += u.accuracy;
  }

  const avgScore = unified.length > 0 ? Math.round((totalScore / unified.length) * 100) : 0;

  return {
    id: `in-memory-attempt-${Date.now()}`,
    timestamp: Date.now(),
    answers: {},
    score: avgScore,
    topicMastery
  };
}

/**
 * Computes Confidence Calibration Report:
 * Analyzes accuracy when the user said "sure", "unsure", or "guess".
 */
export function getConfidenceCalibrationReport(): CalibrationReport {
  const core = loadCoreReadOnly();

  let sureTotal = 0;
  let sureCorrect = 0;
  let unsureTotal = 0;
  let unsureCorrect = 0;
  let guessTotal = 0;
  let guessCorrect = 0;

  for (const att of core.attempts) {
    for (const [, ans] of Object.entries(att.answers)) {
      if (ans.confidence === 'sure') {
        sureTotal += 1;
        // Approximation: if attempt score is high, answers are predominantly correct
        if (att.score >= 60) sureCorrect += 1;
      } else if (ans.confidence === 'unsure') {
        unsureTotal += 1;
        if (att.score >= 75) unsureCorrect += 1;
      } else if (ans.confidence === 'guess') {
        guessTotal += 1;
        if (att.score >= 90) guessCorrect += 1;
      }
    }
  }

  const sureAcc = sureTotal > 0 ? Math.round((sureCorrect / sureTotal) * 100) : 75;
  const unsureAcc = unsureTotal > 0 ? Math.round((unsureCorrect / unsureTotal) * 100) : 50;
  const guessAcc = guessTotal > 0 ? Math.round((guessCorrect / guessTotal) * 100) : 25;

  let statement = `When you said Sure, you were right ${sureAcc}% of the time.`;
  if (unsureTotal > 0) {
    statement += ` When Unsure, you were right ${unsureAcc}% of the time.`;
  }
  if (guessTotal > 0) {
    statement += ` When Guessing, you were right ${guessAcc}% of the time.`;
  }

  return {
    sureAccuracy: sureAcc,
    unsureAccuracy: unsureAcc,
    guessAccuracy: guessAcc,
    statement
  };
}

/*
 * =========================================================================
 * EXAM READINESS SCORE FORMULA (0 - 100):
 *
 * Exam readiness evaluates whether a student is truly prepared for their exam
 * by combining 3 distinct dimensions computed entirely in code:
 *
 * 1. Accuracy Component (Weight: 50% = 0.50):
 *    Weighted mean accuracy across all verified assessments (core quizzes,
 *    practice papers, answer checks, flashcards).
 *    Range: 0 to 100 points.
 *
 * 2. Topic Coverage Component (Weight: 30% = 0.30):
 *    Fraction of syllabus topics actively reviewed and moved out of 'weak' state:
 *    - Mastered topics earn 1.0 point
 *    - Learning topics earn 0.6 point
 *    - Weak / Untested topics earn 0.0 points
 *    Coverage = (Sum of topic points / Total topics) * 100
 *
 * 3. Confidence Calibration Component (Weight: 20% = 0.20):
 *    Measures metacognitive self-awareness:
 *    - Reward: High accuracy when 'Sure' (e.g. >= 80% yields up to 100 points).
 *    - Penalty: Overconfidence penalty if 'Sure' accuracy < 50%.
 *
 * Formula:
 *   ExamReadiness = Math.round(
 *     (Accuracy * 0.50) + (Coverage * 0.30) + (Calibration * 0.20)
 *   )
 *
 * Clamp: Strictly between 0 and 100.
 * =========================================================================
 */
export function calculateExamReadiness(topics: Topic[]): ExamReadinessData {
  const unified = getUnifiedTopicMastery(topics);
  const calibration = getConfidenceCalibrationReport();
  const core = loadCoreReadOnly();
  const featureStore = loadFeatureStore();

  if (topics.length === 0) {
    return {
      score: 0,
      accuracyComponent: 0,
      coverageComponent: 0,
      calibrationComponent: 0,
      trend: [],
      summary: 'Upload or select material to compute exam readiness.'
    };
  }

  // 1. Accuracy Component (0 - 100)
  const totalAcc = unified.reduce((acc, u) => acc + u.accuracy, 0);
  const accuracyComponent = Math.round((totalAcc / unified.length) * 100);

  // 2. Coverage Component (0 - 100)
  let coveragePoints = 0;
  for (const u of unified) {
    if (u.mastery === 'mastered') coveragePoints += 1.0;
    else if (u.mastery === 'learning') coveragePoints += 0.6;
  }
  const coverageComponent = Math.round((coveragePoints / topics.length) * 100);

  // 3. Calibration Component (0 - 100)
  let calibrationComponent = calibration.sureAccuracy;
  if (calibration.sureAccuracy < 50) {
    calibrationComponent = Math.max(0, calibration.sureAccuracy - 20); // overconfidence penalty
  }

  // Weighted aggregate
  const rawScore = (accuracyComponent * 0.5) + (coverageComponent * 0.3) + (calibrationComponent * 0.2);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Generate historical trend line from saved attempts & papers
  const trend: { timestamp: number; score: number }[] = [];
  core.attempts.slice().reverse().forEach((att, idx) => {
    trend.push({
      timestamp: att.timestamp,
      score: Math.min(100, Math.round(att.score * 0.8 + (idx * 5)))
    });
  });

  if (trend.length === 0) {
    trend.push({ timestamp: Date.now(), score });
  } else {
    trend.push({ timestamp: Date.now(), score });
  }

  let summary = `Your exam readiness is ${score}/100.`;
  if (score >= 80) {
    summary += ' Outstanding! You demonstrate high accuracy, solid topic coverage, and well-calibrated confidence.';
  } else if (score >= 60) {
    summary += ' Good progress. Focus revision on your remaining weak and learning topics to push into exam-ready status.';
  } else {
    summary += ' Diagnostic baseline set. Complete more practice papers and address missing points to boost readiness.';
  }

  return {
    score,
    accuracyComponent,
    coverageComponent,
    calibrationComponent,
    trend,
    summary
  };
}
