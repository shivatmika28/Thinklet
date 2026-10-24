"use client";

import React from 'react';
import { Sun, Clock, Target, Sparkles, AlertCircle } from 'lucide-react';
import { LearningProfileData } from '../types';
import { WhyPopover } from './WhyPopover';

export interface LearningProfileCardProps {
  profile: LearningProfileData;
}

export function LearningProfileCard({ profile }: LearningProfileCardProps) {
  const {
    bestTimeOfDay,
    bestTimeReason,
    strongestQuestionType,
    strongestTypeAccuracy,
    usualSessionMinutes,
    totalSessionsRecorded,
    hasEnoughData,
    reason,
  } = profile;

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-5 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--surface-hover)] text-[#98473E]">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)] font-['Quicksand',sans-serif]">
              Personal Learning Profile
            </h3>
            <WhyPopover reason={reason} />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Synthesized from your study timestamp patterns, quiz accuracy, and session duration
          </p>
        </div>

        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-soft)]">
          Autonomous
        </span>
      </div>

      {/* Not Enough Data State */}
      {!hasEnoughData && (
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <div className="font-bold">Building your profile calibration</div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              Completed {totalSessionsRecorded} of 5 required study sessions or quiz attempts.
              Showing preliminary pattern estimations below.
            </p>
            {/* Progress bar towards 5 sessions */}
            <div className="w-full bg-amber-200/60 dark:bg-amber-900/60 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-amber-600 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalSessionsRecorded / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid of Profile Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Best Time of Day */}
        <div className="p-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
            <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Optimal Study Time</span>
          </div>
          <div className="text-sm font-bold text-[var(--text)]">
            {bestTimeOfDay || 'Morning (6:00 AM – 12:00 PM)'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
            {bestTimeReason}
          </p>
        </div>

        {/* 2. Strongest Question Type */}
        <div className="p-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
            <Target className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Strongest Question Type</span>
          </div>
          <div className="text-sm font-bold text-[var(--text)]">
            {strongestQuestionType || 'Multiple Choice (MCQ)'}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[var(--surface-hover)] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${strongestTypeAccuracy || 80}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              {strongestTypeAccuracy || 80}% acc
            </span>
          </div>
        </div>

        {/* 3. Usual Session Length */}
        <div className="p-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
            <Clock className="h-3.5 w-3.5 text-[#98473E] shrink-0" />
            <span>Usual Session Length</span>
          </div>
          <div className="text-sm font-bold text-[var(--text)]">
            {usualSessionMinutes || 25} minutes
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Ideal burst interval for maximum cognitive retention before fatigue sets in.
          </p>
        </div>
      </div>
    </div>
  );
}
