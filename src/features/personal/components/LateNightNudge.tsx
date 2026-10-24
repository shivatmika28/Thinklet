// [PERSONAL] Late-night nudge component showing gentle bedtime wrap-up and tomorrow's quest preview
"use client";

import React from 'react';
import { Moon, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WhyPopover } from './WhyPopover';

export interface LateNightNudgeProps {
  isOpen: boolean;
  lateNightHour: number;
  tomorrowQuests: Array<{ title: string; topicName: string }>;
  onDismiss: () => void;
  onOpenPlanner?: () => void;
}

export function LateNightNudge({
  isOpen,
  lateNightHour,
  tomorrowQuests,
  onDismiss,
  onOpenPlanner,
}: LateNightNudgeProps) {
  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Late-night study wrap-up suggestion"
      className="fixed bottom-6 left-6 z-50 max-w-sm w-full p-5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-clay-card)] animate-slide-up text-left"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Moon className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Circadian Care
            </span>
            <h3 className="text-xs font-bold text-[var(--text)]">Time to Wrap Up Tonight</h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <WhyPopover
            reason={{
              rule: 'Late-night circadian health guideline',
              data: [
                `Device time is past ${lateNightHour}:00`,
                `Memory consolidation occurs during deep sleep stages`,
                `Shown at most once per night`,
              ],
            }}
            title="Why Late Night Nudge Appeared"
          />
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss late night reminder"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
        Good sleep turns today's facts into lasting memories. You did great work today—let your mind
        recharge for tomorrow.
      </p>

      {/* Tomorrow's Quest Preview */}
      {tomorrowQuests.length > 0 && (
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)] mb-3 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
            Queued for Tomorrow
          </span>
          <div className="space-y-1">
            {tomorrowQuests.slice(0, 2).map((q, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-[var(--text)]">
                <CheckCircle2 className="h-3 w-3 text-[#98473E] shrink-0" />
                <span className="truncate font-medium">{q.title || q.topicName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#98473E] text-white hover:bg-[#823C34] transition-colors shadow-sm cursor-pointer text-center"
        >
          Wrap Up for Tonight
        </button>

        {onOpenPlanner && (
          <button
            type="button"
            onClick={onOpenPlanner}
            className="py-2 px-3 rounded-xl text-xs font-medium text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-soft)] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Plan</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
