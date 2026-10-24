// [PERSONAL] Break suggestion modal rotating between stretch, water, and eye rest with Snooze and WhyPopover
"use client";

import React from 'react';
import { X, Sparkles, Coffee, Droplets, Eye, Clock, Smile } from 'lucide-react';
import { BreakType } from '../types';
import { WhyPopover } from './WhyPopover';

export interface BreakSuggestionModalProps {
  isOpen: boolean;
  breakType: BreakType;
  intervalMinutes: number;
  relaxMode: boolean;
  onTakeBreak: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

const BREAK_DETAILS: Record<
  BreakType,
  { title: string; subtitle: string; icon: any; actionPrompt: string; color: string }
> = {
  stretch: {
    title: 'Time for a Mindful Stretch',
    subtitle: 'Stand up, roll your shoulders backward, and loosen your neck to release study tension.',
    icon: Smile,
    actionPrompt: 'Roll your shoulders & stretch',
    color: '#98473E',
  },
  water: {
    title: 'Hydration Refresh',
    subtitle: 'Brain cells need hydration to process and store new concepts effectively.',
    icon: Droplets,
    actionPrompt: 'Grab a cool glass of water',
    color: '#52796F',
  },
  eye_rest: {
    title: '20-20-20 Eye Rest',
    subtitle: 'Look away from the screen at an object 20 feet away for 20 peaceful seconds.',
    icon: Eye,
    actionPrompt: 'Rest your eyes on something distant',
    color: '#A37C40',
  },
};

export function BreakSuggestionModal({
  isOpen,
  breakType,
  intervalMinutes,
  relaxMode,
  onTakeBreak,
  onSnooze,
  onDismiss,
}: BreakSuggestionModalProps) {
  if (!isOpen) return null;

  const current = BREAK_DETAILS[breakType] || BREAK_DETAILS.stretch;
  const IconComp = current.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Study break suggestion"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-clay-card)] animate-slide-up text-left"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-xl text-white shadow-sm flex items-center justify-center"
            style={{ backgroundColor: current.color }}
          >
            <IconComp className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#98473E] flex items-center gap-1">
              <span>Study Wellbeing</span>
              {relaxMode && (
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">(Relax Mode)</span>
              )}
            </span>
            <h3 className="text-xs font-bold text-[var(--text)]">{current.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <WhyPopover
            reason={{
              rule: 'Continuous study duration threshold',
              data: [
                `Continuous session reached ${intervalMinutes} minutes`,
                `Relax mode pacing: ${relaxMode ? 'Active (30m)' : 'Standard (45m)'}`,
                `Rotation type: ${breakType}`,
              ],
            }}
            title="Why Break Was Suggested"
          />
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss break reminder"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
        {current.subtitle}
      </p>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onTakeBreak}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#98473E] text-white hover:bg-[#823C34] transition-colors shadow-sm cursor-pointer text-center"
        >
          Take a 5m Break
        </button>

        <button
          type="button"
          onClick={() => onSnooze(10)}
          className="py-2 px-3 rounded-xl text-xs font-medium text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border-soft)] transition-colors cursor-pointer flex items-center gap-1"
        >
          <Clock className="h-3 w-3 text-[var(--text-muted)]" />
          <span>Snooze 10m</span>
        </button>
      </div>
    </div>
  );
}
