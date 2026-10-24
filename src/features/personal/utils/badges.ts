/**
 * Personalised Badges System (Pure Code)
 * Rules table in code checking for milestone achievements.
 *
 * Required Badges:
 * 1. First mastered topic
 * 2. Comeback after a 3+ day break
 * 3. 100 questions answered
 * 4. First 7-day streak
 * 5. First practice paper completed
 */

import { PersonalBadge, PersonalStoreData } from '../types';

export const BADGE_DEFINITIONS: PersonalBadge[] = [
  {
    id: 'first_mastered_topic',
    title: 'First Peak Scaled',
    description: 'Mastered your first study topic with high comprehension accuracy.',
    icon: '🏔️',
    ruleKey: 'Topic status changed to Mastered',
  },
  {
    id: 'comeback_break',
    title: 'The Great Return',
    description: 'Returned to study after a 3+ day break with renewed curiosity.',
    icon: '🌱',
    ruleKey: 'Studied after a gap of 3 or more days',
  },
  {
    id: 'questions_100',
    title: 'Century Scholar',
    description: 'Answered over 100 diagnostic and revision questions.',
    icon: '💯',
    ruleKey: 'Answered 100 or more total quiz questions',
  },
  {
    id: 'streak_7_days',
    title: 'Iron Consistency',
    description: 'Maintained an unbroken daily study streak for 7 consecutive days.',
    icon: '🔥',
    ruleKey: 'Reached a 7-day study streak milestone',
  },
  {
    id: 'first_practice_paper',
    title: 'Exam Pioneer',
    description: 'Completed your first full simulated practice test paper.',
    icon: '📝',
    ruleKey: 'Finished at least 1 mock or practice exam paper',
  },
  {
    id: 'sprint_master',
    title: 'Deep Flow',
    description: 'Completed 5 dedicated Pomodoro focus sprints.',
    icon: '⏱️',
    ruleKey: 'Logged 5 or more completed focus sprints',
  },
  {
    id: 'mindful_scholar',
    title: 'Calm Waters',
    description: 'Spent over 30 minutes learning peacefully in Relax Mode.',
    icon: '🍃',
    ruleKey: 'Studied with Relax Mode active for 30+ minutes',
  },
];

export interface BadgeEvaluationContext {
  topicsMasteredCount: number;
  longestStreak: number;
  totalQuestionsAnswered: number;
  practicePapersCount: number;
  daysSinceLastSession: number;
  totalSprintsCompleted: number;
  relaxModeMinutes: number;
}

export function evaluateEligibleBadges(
  store: PersonalStoreData,
  context: BadgeEvaluationContext
): string[] {
  const eligibleIds: string[] = [];
  const currentUnlocked = store.badges || {};

  // 1. First mastered topic
  if (!currentUnlocked['first_mastered_topic'] && context.topicsMasteredCount >= 1) {
    eligibleIds.push('first_mastered_topic');
  }

  // 2. Comeback after 3+ day break
  if (!currentUnlocked['comeback_break'] && context.daysSinceLastSession >= 3) {
    eligibleIds.push('comeback_break');
  }

  // 3. 100 questions answered
  if (!currentUnlocked['questions_100'] && context.totalQuestionsAnswered >= 100) {
    eligibleIds.push('questions_100');
  }

  // 4. 7-day streak
  if (!currentUnlocked['streak_7_days'] && context.longestStreak >= 7) {
    eligibleIds.push('streak_7_days');
  }

  // 5. First practice paper
  if (!currentUnlocked['first_practice_paper'] && context.practicePapersCount >= 1) {
    eligibleIds.push('first_practice_paper');
  }

  // 6. 5 focus sprints
  if (!currentUnlocked['sprint_master'] && context.totalSprintsCompleted >= 5) {
    eligibleIds.push('sprint_master');
  }

  // 7. 30m in Relax Mode
  if (!currentUnlocked['mindful_scholar'] && context.relaxModeMinutes >= 30) {
    eligibleIds.push('mindful_scholar');
  }

  return eligibleIds;
}
