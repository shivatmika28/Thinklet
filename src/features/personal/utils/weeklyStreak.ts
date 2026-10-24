/**
 * Weekly Consistency Streak Logic (Pure Code)
 * A week counts when the student studies on at least N days (default 3, adjustable).
 * STRICT: Shown beside the daily streak inside My Space. Do NOT change existing dashboard streak card.
 */

import { DailySummary } from '../types';

export interface WeeklyStreakResult {
  weeklyStreakCount: number;
  daysStudiedThisWeek: number;
  targetDaysPerWeek: number;
  isGoalMetThisWeek: boolean;
  thisWeekDaysRemaining: number;
}

export function computeWeeklyConsistencyStreak(
  dailySummaries: Record<string, DailySummary>,
  targetDays: number = 3,
  now?: Date
): WeeklyStreakResult {
  const target = Math.max(1, Math.min(7, targetDays));
  if (!now) {
    return {
      weeklyStreakCount: 0,
      daysStudiedThisWeek: 0,
      targetDaysPerWeek: target,
      isGoalMetThisWeek: false,
      thisWeekDaysRemaining: 7,
    };
  }

  // Build a set of unique dates with active study (> 0 minutes or sessions)
  const activeDates = new Set<string>();
  Object.entries(dailySummaries).forEach(([dateStr, summary]) => {
    if ((summary.studyMinutes || 0) > 0 || (summary.sessionsCount || 0) > 0) {
      activeDates.add(dateStr);
    }
  });

  // Calculate this week's active days
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() + mondayOffset);
  startOfThisWeek.setHours(0, 0, 0, 0);

  let daysStudiedThisWeek = 0;
  for (let i = 0; i <= (currentDay === 0 ? 6 : currentDay - 1); i++) {
    const d = new Date(startOfThisWeek);
    d.setDate(startOfThisWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    if (activeDates.has(dateStr)) {
      daysStudiedThisWeek++;
    }
  }

  const daysRemainingInWeek = currentDay === 0 ? 0 : 7 - currentDay;
  const isGoalMetThisWeek = daysStudiedThisWeek >= target;

  // Count past consecutive weeks meeting the target
  let weeklyStreakCount = isGoalMetThisWeek ? 1 : 0;
  let checkMonday = new Date(startOfThisWeek);

  // Look back up to 52 past weeks
  for (let weekOffset = 1; weekOffset <= 52; weekOffset++) {
    checkMonday.setDate(checkMonday.getDate() - 7);
    let daysInWeek = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(checkMonday);
      d.setDate(checkMonday.getDate() + dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) {
        daysInWeek++;
      }
    }

    if (daysInWeek >= target) {
      // If current week hasn't met the goal yet, but is still open, the streak carries over
      if (!isGoalMetThisWeek && weekOffset === 1) {
        weeklyStreakCount = 1;
      } else {
        weeklyStreakCount++;
      }
    } else {
      // Streak breaks at the first incomplete week in the past
      break;
    }
  }

  return {
    weeklyStreakCount,
    daysStudiedThisWeek,
    targetDaysPerWeek: target,
    isGoalMetThisWeek,
    thisWeekDaysRemaining: daysRemainingInWeek,
  };
}
