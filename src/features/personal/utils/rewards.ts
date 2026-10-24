/**
 * Self-set Rewards Calculation (Pure Code)
 * Computes progress toward student's custom rewards and claim conditions.
 */

import { StudentReward } from '../types';

export interface RewardContextStats {
  totalSessions: number;
  totalMinutes: number;
  totalQuestsCompleted: number;
  currentStreak: number;
}

export interface EvaluatedReward extends StudentReward {
  currentValue: number;
  progressPercent: number;
  isUnlocked: boolean;
}

export function evaluateReward(
  reward: StudentReward,
  stats: RewardContextStats
): EvaluatedReward {
  let currentValue = 0;

  switch (reward.type) {
    case 'sessions':
      currentValue = stats.totalSessions;
      break;
    case 'minutes':
      currentValue = stats.totalMinutes;
      break;
    case 'quests':
      currentValue = stats.totalQuestsCompleted;
      break;
    case 'streak':
      currentValue = stats.currentStreak;
      break;
    default:
      currentValue = 0;
  }

  const target = Math.max(1, reward.target);
  const progressPercent = Math.min(100, Math.round((currentValue / target) * 100));
  const isUnlocked = currentValue >= target && !reward.claimed;

  return {
    ...reward,
    currentValue,
    progressPercent,
    isUnlocked,
  };
}

export function formatRewardCondition(type: StudentReward['type'], target: number): string {
  switch (type) {
    case 'sessions':
      return `${target} study session${target > 1 ? 's' : ''}`;
    case 'minutes':
      return `${target} focus minute${target > 1 ? 's' : ''}`;
    case 'quests':
      return `${target} quest${target > 1 ? 's' : ''} cleared`;
    case 'streak':
      return `${target}-day study streak`;
    default:
      return `${target} points`;
  }
}
