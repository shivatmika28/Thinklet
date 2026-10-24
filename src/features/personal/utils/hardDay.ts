/**
 * Hard Day Detection Logic (Pure Code)
 * Triggers motivational "Why I'm studying" reminder gently when study is challenging.
 *
 * Rules:
 * 1. Daily goal is under 25% done by 5 PM (17:00) device time.
 * 2. Most recent quiz score is below 40%.
 * 3. Two or more wrong answers in a row in recent quiz events.
 * 4. Relax mode is ON and the student explicitly requests a boost.
 */

import { StructuredReason, PersonalEvent } from '../types';
import { createReason, REASON_RULES } from './reasonModel';

export interface HardDayCheckInput {
  todayMinutes: number;
  dailyGoalMinutes: number;
  recentAttempts?: Array<{ score: number; totalQuestions?: number }>;
  recentEvents?: PersonalEvent[];
  relaxMode?: boolean;
  manualBoost?: boolean;
  now?: Date;
}

export interface HardDayResult {
  isHardDay: boolean;
  triggerKey: 'goal_lag' | 'low_quiz' | 'consecutive_errors' | 'manual_boost' | 'none';
  headline: string;
  supportingText: string;
  reason: StructuredReason;
}

export function detectHardDay(input: HardDayCheckInput): HardDayResult {
  const currentHour = input.now ? input.now.getHours() : 12;
  const dailyGoal = Math.max(10, input.dailyGoalMinutes || 20);
  const goalProgressRatio = input.todayMinutes / dailyGoal;

  // 1. Manual Boost in Relax mode or anytime
  if (input.manualBoost) {
    return {
      isHardDay: true,
      triggerKey: 'manual_boost',
      headline: 'A Moment to Refocus',
      supportingText: 'Take a gentle breath. Here is why your learning journey matters to you:',
      reason: createReason(REASON_RULES.HARD_DAY_BOOST, [
        'Requested motivational boost',
        `Relax mode: ${input.relaxMode ? 'Active' : 'Standard'}`,
        'Self-care focus pause',
      ]),
    };
  }

  // 2. Recent quiz score < 40%
  const attempts = input.recentAttempts || [];
  if (attempts.length > 0) {
    const lastAttempt = attempts[attempts.length - 1];
    const totalQ = lastAttempt.totalQuestions || 5;
    const scorePct = totalQ > 0 ? (lastAttempt.score / totalQ) * 100 : 0;
    if (scorePct < 40) {
      return {
        isHardDay: true,
        triggerKey: 'low_quiz',
        headline: 'Challenging Quiz Behind You',
        supportingText: 'Tough topics build the strongest neural paths. Be proud of wrestling with hard questions.',
        reason: createReason(REASON_RULES.HARD_DAY_BOOST, [
          `Latest quiz accuracy: ${Math.round(scorePct)}% (< 40% threshold)`,
          'Mistakes are key stepping stones to deep mastery',
        ]),
      };
    }
  }

  // 3. Two or more wrong answers in a row
  const events = input.recentEvents || [];
  const quizAnswerEvents = events
    .filter((e) => e.type === 'quiz_answered' && typeof e.meta?.isCorrect === 'boolean')
    .slice(-4);

  if (quizAnswerEvents.length >= 2) {
    const lastTwo = quizAnswerEvents.slice(-2);
    const bothWrong = lastTwo.every((e) => e.meta?.isCorrect === false);
    if (bothWrong) {
      return {
        isHardDay: true,
        triggerKey: 'consecutive_errors',
        headline: 'Every Expert Was Once a Beginner',
        supportingText: 'Hit a tricky patch? Take a quick pause, check your grounding notes, and keep your spirits up.',
        reason: createReason(REASON_RULES.HARD_DAY_BOOST, [
          'Two consecutive challenging questions encountered',
          'Gentle encouragement to prevent frustration',
        ]),
      };
    }
  }

  // 4. Daily goal < 25% done by 5:00 PM (17:00)
  if (currentHour >= 17 && goalProgressRatio < 0.25) {
    return {
      isHardDay: true,
      triggerKey: 'goal_lag',
      headline: 'Evening Check-in',
      supportingText: 'Busy day? Even just a 5-minute flashcard sprint keeps your momentum alive.',
      reason: createReason(REASON_RULES.HARD_DAY_BOOST, [
        `Time: ${currentHour}:00 (after 17:00)`,
        `Goal completed: ${Math.round(goalProgressRatio * 100)}% (< 25% target threshold)`,
        `Minutes studied: ${input.todayMinutes}m of ${dailyGoal}m`,
      ]),
    };
  }

  return {
    isHardDay: false,
    triggerKey: 'none',
    headline: 'Steady Momentum',
    supportingText: 'Your learning pacing is on track today.',
    reason: createReason(REASON_RULES.HARD_DAY_BOOST, ['Pacing is steady and healthy']),
  };
}
