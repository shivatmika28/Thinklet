// [PERSONAL] Pre-test calm mode: 1-minute calming breathing screen with expanding/contracting circle and NO numbers or visible timer
"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, X, Heart } from 'lucide-react';

export interface PreTestCalmScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
  title?: string;
  subtitle?: string;
}

const PHASES = [
  { text: "Breathe in slowly...", sub: "Feel the calm expand within" },
  { text: "Hold gently...", sub: "Rest in the quiet stillness" },
  { text: "Release with ease...", sub: "Let go of all pressure and hurry" },
  { text: "Rest your mind...", sub: "You are centered and ready" },
];

export function PreTestCalmScreen({
  onComplete,
  onSkip,
  title = "Pre-Test Centering Breath",
  subtitle = "Take a moment to steady your pulse and ground your focus.",
}: PreTestCalmScreenProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Cycle breath phases every 4 seconds (16s full cycle, 4 cycles = ~64s total)
  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % PHASES.length);
    }, 4000);

    // Auto-advance after 1 minute (60 seconds)
    const totalTimer = setTimeout(() => {
      onComplete();
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(totalTimer);
    };
  }, [onComplete]);

  const currentPhase = PHASES[phaseIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pre-test breathing screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 bg-[var(--bg)]/95 backdrop-blur-md animate-fade-in"
    >
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Heart className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Mindful Transition
          </span>
        </div>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          >
            <span>Skip to Test</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Center Breathing Animation with NO Numbers or Timer */}
      <div className="flex flex-col items-center justify-center my-auto text-center space-y-8 select-none">
        {/* Expanding & Contracting Breathing Circle */}
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80">
          {/* Outermost gentle glow ring */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#98473E]/10 via-[#A37C40]/15 to-[#52796F]/10 blur-xl animate-pulse"
            aria-hidden="true"
          />

          {/* Breathing Circle Container */}
          <div
            className={`w-48 h-48 sm:w-60 sm:h-60 rounded-full flex items-center justify-center transition-all duration-4000 ease-in-out border-2 shadow-[0_12px_40px_rgba(152,71,62,0.12)] ${
              phaseIndex === 0
                ? 'scale-115 bg-gradient-to-tr from-[#98473E]/20 to-[#52796F]/25 border-[#52796F]/50 shadow-[0_16px_50px_rgba(82,121,111,0.25)]'
                : phaseIndex === 1
                ? 'scale-115 bg-gradient-to-tr from-[#52796F]/30 to-[#A37C40]/25 border-[#A37C40]/60 shadow-[0_16px_50px_rgba(163,124,64,0.25)]'
                : phaseIndex === 2
                ? 'scale-80 bg-gradient-to-tr from-[#A37C40]/15 to-[#98473E]/15 border-[#98473E]/40 shadow-[0_8px_25px_rgba(152,71,62,0.15)]'
                : 'scale-75 bg-[var(--surface-raised)] border-[var(--border)] shadow-inner'
            }`}
          >
            {/* Center icon / sparkle */}
            <div className="p-3 rounded-full bg-[var(--surface)] text-[#98473E] shadow-sm">
              <Sparkles className="h-6 w-6 animate-spin-slow opacity-80" />
            </div>
          </div>
        </div>

        {/* Phase Text */}
        <div className="space-y-2 max-w-md px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-['Quicksand',sans-serif] transition-opacity duration-700">
            {currentPhase.text}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium transition-opacity duration-700">
            {currentPhase.sub}
          </p>
        </div>
      </div>

      {/* Bottom Footer Action */}
      <div className="w-full max-w-sm text-center space-y-3">
        <button
          type="button"
          onClick={onComplete}
          className="w-full py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-[#98473E] text-white hover:bg-[#823C34] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <span>I Am Ready to Begin</span>
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-[11px] text-[var(--text-muted)]">
          Breathe at your natural rhythm. There is no rush.
        </p>
      </div>
    </div>
  );
}
