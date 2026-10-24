"use client";

import React, { useState, useEffect } from "react";
import { usePersonalStore } from "../services/personalStore";
import { detectHardDay } from "../utils/hardDay";
import { getGoalInfo } from "../services/dataAdapter";
import { WhyPopover } from "./WhyPopover";
import { Sparkles, X, Heart, RefreshCw } from "lucide-react";

export interface HardDayBannerProps {
  recentAttempts?: Array<{ score: number; totalQuestions?: number }>;
  onOpenMotivationTab?: () => void;
  className?: string;
}

export const HardDayBanner: React.FC<HardDayBannerProps> = ({
  recentAttempts = [],
  onOpenMotivationTab,
  className = "",
}) => {
  const { store, dismissWhyStudyingToday } = usePersonalStore();
  const goalInfo = getGoalInfo();
  const [manualBoostRequested, setManualBoostRequested] = useState(false);
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  const isDismissed =
    store.whyStudying.dismissedToday && Boolean(todayStr) && store.whyStudying.lastShownDate === todayStr;

  const hardDayResult = detectHardDay({
    todayMinutes: goalInfo.todayMinutesCompleted || 0,
    dailyGoalMinutes: goalInfo.dailyMinutes || 20,
    recentAttempts,
    recentEvents: store.events,
    relaxMode: store.relaxMode,
    manualBoost: manualBoostRequested,
    now: todayStr ? new Date() : undefined,
  });

  // If not a hard day and no manual boost, or dismissed and no manual boost, do not render banner
  if ((!hardDayResult.isHardDay || isDismissed) && !manualBoostRequested) {
    return null;
  }

  const handleDismiss = () => {
    setManualBoostRequested(false);
    dismissWhyStudyingToday();
  };

  return (
    <div
      role="region"
      aria-label="Daily Motivational Reflection"
      className={`p-4 sm:p-5 rounded-2xl border border-[#98473E]/20 bg-gradient-to-r from-[#FAF0CA]/40 via-[var(--surface-raised)] to-[#FAF0CA]/30 text-[var(--text)] shadow-xs animate-fade-in ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-[#98473E]/10 text-[#98473E] flex items-center justify-center shrink-0 border border-[#98473E]/20 text-xl shadow-xs">
            {store.whyStudying.emoji || "🌱"}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#98473E] flex items-center gap-1">
                <Heart className="h-3 w-3 fill-current" />
                <span>{hardDayResult.headline}</span>
              </span>
              <WhyPopover reason={hardDayResult.reason} />
            </div>

            <div className="text-sm font-bold text-[var(--text)] italic leading-relaxed">
              &ldquo;{store.whyStudying.text}&rdquo;
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {hardDayResult.supportingText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenMotivationTab && (
            <button
              type="button"
              onClick={onOpenMotivationTab}
              title="Edit Motivation Note"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors text-xs font-semibold cursor-pointer"
            >
              Edit
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss motivation banner for today"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
