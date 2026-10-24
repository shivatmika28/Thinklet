/**
 * Structured Reason Model for Personalisation
 * Every recommendation or adaptive prompt carries: { rule, data[] }
 */

import { StructuredReason } from '../types';

export function createReason(rule: string, data: string[]): StructuredReason {
  return {
    rule,
    data: [...data],
  };
}

export const REASON_RULES = {
  WEAK_TOPIC_FOCUS: 'Targeted revision based on topics with accuracy below 60%',
  SPACED_REPETITION_DUE: 'Spaced repetition schedule indicates this card or quest is due for review',
  HARD_DAY_BOOST: 'Motivational encouragement triggered by high error rate or low daily completion',
  RELAX_BREAK_SUGGESTION: 'Gentle rest suggestion triggered by continuous active study time',
  LATE_NIGHT_NUDGE: 'Healthy sleep nudge triggered by late evening study session',
  DEVICE_OPTIMIZED: 'Activity tailored to current device form factor and input mode',
  STREAK_MOMENTUM: 'Encouraging study momentum based on your consecutive study streak',
  GOAL_PROGRESSION: 'Pacing suggestion based on your daily study goal and exam deadline',
  RACE_PAST_SELF: 'Encouraging reflection comparing current weekly progress with your own prior week',
  BADGE_UNLOCK: 'Milestone badge awarded for completing personal study achievement',
  REWARD_PROGRESS: 'Self-set motivational reward progress tracked against study activity',
};
