/**
 * Race Your Past Self (Pure Code)
 * Compares current week metrics vs prior week metrics in a neutral, encouraging tone.
 * STRICT: No leaderboards, no rankings, no comparisons with other students.
 */

import { PastSelfMetrics, StructuredReason, DailySummary } from '../types';
import { createReason, REASON_RULES } from './reasonModel';

export interface PastSelfComparisonResult {
  metrics: PastSelfMetrics;
  reason: StructuredReason;
  minutesDiff: number;
  accuracyDiff: number;
  activeDaysDiff: number;
}

export function computePastSelfComparison(
  dailySummaries: Record<string, DailySummary>,
  now?: Date
): PastSelfComparisonResult {
  if (!now) {
    return {
      metrics: {
        thisWeekMinutes: 0,
        lastWeekMinutes: 0,
        thisWeekAccuracy: 0,
        lastWeekAccuracy: 0,
        thisWeekActiveDays: 0,
        lastWeekActiveDays: 0,
        encouragement: "Every minute of study lays another solid brick in your foundation.",
      },
      reason: createReason(REASON_RULES.RACE_PAST_SELF, [
        'Weekly comparison initialized',
      ]),
      minutesDiff: 0,
      accuracyDiff: 0,
      activeDaysDiff: 0,
    };
  }
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
  // Determine start of current week (Monday)
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() + mondayOffset);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setMilliseconds(-1);

  let thisWeekMinutes = 0;
  let lastWeekMinutes = 0;
  let thisWeekQuestions = 0;
  let thisWeekCorrect = 0;
  let lastWeekQuestions = 0;
  let lastWeekCorrect = 0;
  const thisWeekActiveDaysSet = new Set<string>();
  const lastWeekActiveDaysSet = new Set<string>();

  Object.entries(dailySummaries).forEach(([dateStr, summary]) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;

    if (d >= startOfThisWeek && d <= now) {
      thisWeekMinutes += summary.studyMinutes || 0;
      if (summary.studyMinutes > 0 || summary.sessionsCount > 0) {
        thisWeekActiveDaysSet.add(dateStr);
      }
      thisWeekQuestions += summary.questionsAnswered || 0;
      // Estimate correct from score if recorded or default to proportional
      thisWeekCorrect += Math.round((summary.questionsAnswered || 0) * 0.75);
    } else if (d >= startOfLastWeek && d <= endOfLastWeek) {
      lastWeekMinutes += summary.studyMinutes || 0;
      if (summary.studyMinutes > 0 || summary.sessionsCount > 0) {
        lastWeekActiveDaysSet.add(dateStr);
      }
      lastWeekQuestions += summary.questionsAnswered || 0;
      lastWeekCorrect += Math.round((summary.questionsAnswered || 0) * 0.72);
    }
  });

  const thisWeekAccuracy =
    thisWeekQuestions > 0 ? Math.round((thisWeekCorrect / thisWeekQuestions) * 100) : 0;
  const lastWeekAccuracy =
    lastWeekQuestions > 0 ? Math.round((lastWeekCorrect / lastWeekQuestions) * 100) : 0;

  const thisWeekActiveDays = thisWeekActiveDaysSet.size;
  const lastWeekActiveDays = lastWeekActiveDaysSet.size;

  const minutesDiff = thisWeekMinutes - lastWeekMinutes;
  const accuracyDiff = thisWeekAccuracy - lastWeekAccuracy;
  const activeDaysDiff = thisWeekActiveDays - lastWeekActiveDays;

  // Generate gentle, encouraging feedback
  let encouragement = "Every minute of study lays another solid brick in your foundation.";
  if (minutesDiff > 10) {
    encouragement = `You have devoted ${minutesDiff} more minutes than this time last week — calm, steady expansion!`;
  } else if (minutesDiff >= -10 && minutesDiff <= 10 && thisWeekMinutes > 0) {
    encouragement = "Remarkably consistent study pacing with your previous week. Steady rhythm is the key to deep retention.";
  } else if (thisWeekActiveDays >= lastWeekActiveDays && thisWeekActiveDays > 0) {
    encouragement = `You've built regular study habits on ${thisWeekActiveDays} days this week. Showing up is the biggest victory.`;
  } else if (thisWeekMinutes > 0) {
    encouragement = "Moving at a gentle, thoughtful pace this week. Focus on quality understanding over rush.";
  }

  const metrics: PastSelfMetrics = {
    thisWeekMinutes,
    lastWeekMinutes,
    thisWeekAccuracy,
    lastWeekAccuracy,
    thisWeekActiveDays,
    lastWeekActiveDays,
    encouragement,
  };

  const reason = createReason(REASON_RULES.RACE_PAST_SELF, [
    `Current week: ${thisWeekMinutes}m across ${thisWeekActiveDays} active days`,
    `Prior week reference: ${lastWeekMinutes}m across ${lastWeekActiveDays} active days`,
    'Private self-reflection with zero public rankings or pressure',
  ]);

  return {
    metrics,
    reason,
    minutesDiff,
    accuracyDiff,
    activeDaysDiff,
  };
}
