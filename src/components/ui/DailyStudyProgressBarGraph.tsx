"use client";

import React, { useState, useMemo } from "react";
import { useFeatures } from "@/features/components/FeaturesProvider";
import { getDailyStudyStats, recordStudySession, DayStudyStat } from "@/features/services/featureStore";
import { StudyBuddyMascot } from "@/components/ui/StudyBuddyMascot";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  BarChart3,
  Calendar,
  Clock,
  Target,
  Sparkles,
  TrendingUp,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

export interface DailyStudyProgressBarGraphProps {
  className?: string;
  onStartSprint?: () => void;
}

export const DailyStudyProgressBarGraph: React.FC<DailyStudyProgressBarGraphProps> = ({
  className = "",
  onStartSprint,
}) => {
  const { store } = useFeatures();
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
  const [quickLogFeedback, setQuickLogFeedback] = useState<string | null>(null);

  // Compute aggregated real study statistics
  const stats = useMemo(() => {
    return getDailyStudyStats(timeRange, store);
  }, [timeRange, store]);

  // Determine scaling ceiling for Y-axis (with headroom)
  const maxDayMinutes = useMemo(() => {
    const rawMax = Math.max(...stats.days.map((d) => d.totalMinutes), 0);
    const goal = stats.dailyGoalMinutes || 20;
    // Ensure the Y-axis has sufficient scale, at least 30m or max + 10m
    const target = Math.max(rawMax, goal, 30);
    // Round up to nice intervals of 15 or 30
    return Math.ceil(target / 15) * 15;
  }, [stats]);

  // Y-axis grid tick marks (3 ticks: 0, midpoint, max)
  const yTicks = useMemo(() => {
    const mid = Math.round(maxDayMinutes / 2);
    return [maxDayMinutes, mid, 0];
  }, [maxDayMinutes]);

  const activeDay: DayStudyStat | null =
    activeTooltipIndex !== null && stats.days[activeTooltipIndex]
      ? stats.days[activeTooltipIndex]
      : null;

  const handleQuickLog = (mins: number) => {
    recordStudySession(mins, "sprint", undefined, "Quick study session log");
    setQuickLogFeedback(`+${mins}m logged! ✨`);
    setTimeout(() => setQuickLogFeedback(null), 2500);
  };

  const formatMinutesPretty = (mins: number) => {
    if (mins === 0) return "0 mins";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr${h > 1 ? "s" : ""}`;
    return `${m} mins`;
  };

  // SVG dimensions & layout
  const chartHeight = 180;
  const chartTopPadding = 24;
  const chartBottomPadding = 32;
  const effectiveGraphHeight = chartHeight - chartTopPadding - chartBottomPadding;

  // Percentage position of the goal line on Y-axis
  const goalLineY =
    chartTopPadding +
    effectiveGraphHeight * (1 - Math.min(1, stats.dailyGoalMinutes / maxDayMinutes));

  return (
    <div
      className={`rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] p-5 sm:p-6 shadow-[var(--shadow)] thinklet-card-hover transition-all duration-300 ${className}`}
    >
      {/* 1. Top Section: Header, Summary Badges & Week/Month Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-soft)] flex items-center justify-center text-[#98473E] shadow-xs hover:scale-105 transition-transform">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--text)] font-['Quicksand',sans-serif] tracking-tight">
                Daily Study Progress
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Track focused learning duration from real recorded sessions
              </p>
            </div>
          </div>
        </div>

        {/* Time Filters: Week vs Month */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex p-1 rounded-full bg-[var(--surface-hover)] border border-[var(--border-soft)] shadow-inner">
            <button
              type="button"
              onClick={() => {
                setTimeRange("week");
                setActiveTooltipIndex(null);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer thinklet-btn-hover ${
                timeRange === "week"
                  ? "bg-[#98473E] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/60"
              }`}
            >
              Week (7d)
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeRange("month");
                setActiveTooltipIndex(null);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer thinklet-btn-hover ${
                timeRange === "month"
                  ? "bg-[#98473E] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/60"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        {/* Today's Study Time */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-soft)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] thinklet-tile-hover">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            <span>Today's Time</span>
            <Clock className="h-3.5 w-3.5 text-[#98473E]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[var(--text)]">
            {stats.todayMinutes}m
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-medium block mt-0.5">
            Goal: {stats.dailyGoalMinutes}m
          </span>
        </div>

        {/* Weekly / Period Total */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-soft)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] thinklet-tile-hover">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            <span>{timeRange === "week" ? "Week Total" : "Month Total"}</span>
            <TrendingUp className="h-3.5 w-3.5 text-[#A37C40]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#A37C40]">
            {stats.periodTotalMinutes}m
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-medium block mt-0.5">
            {timeRange === "week"
              ? `${Math.round(stats.periodTotalMinutes / 7)}m daily avg`
              : `${Math.round(stats.periodTotalMinutes / stats.days.length)}m daily avg`}
          </span>
        </div>

        {/* Daily Goal Completion % */}
        <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-soft)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] thinklet-tile-hover">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            <span>Goal Completed</span>
            <Target className="h-3.5 w-3.5 text-[#7F9274]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#98473E]">
              {stats.goalCompletionPercent}%
            </span>
            <Badge
              variant={stats.goalCompletionPercent >= 100 ? "success" : "secondary"}
              className="text-[10px] px-1.5 py-0 h-4 font-bold"
            >
              {stats.goalCompletionPercent >= 100 ? "Goal Met! 🎯" : "In Progress"}
            </Badge>
          </div>
          <div className="mt-1.5 h-1.5 w-full bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--border-soft)]">
            <div
              className="h-full bg-gradient-to-r from-[#98473E] to-[#A37C40] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.goalCompletionPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Chart Canvas Area */}
      <div className="relative pt-2 pb-1">
        {/* Interactive Floating Tooltip */}
        {activeDay && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-200 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${
                ((activeTooltipIndex! + 0.5) / stats.days.length) * 100
              }%`,
              top: `${Math.max(
                10,
                chartTopPadding +
                  effectiveGraphHeight *
                    (1 - Math.min(1, activeDay.totalMinutes / maxDayMinutes)) -
                  8
              )}px`,
            }}
          >
            <div className="bg-[#30251F] text-[#F7EFE5] text-xs rounded-xl px-3 py-2 shadow-[0_8px_20px_rgba(48,37,31,0.35)] border border-[var(--border-soft)] whitespace-nowrap animate-fade-in flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#F7EFE5]">
                <Calendar className="h-3 w-3 text-[#A37C40]" />
                <span>{activeDay.fullDate}</span>
                {activeDay.isToday && (
                  <span className="bg-[#98473E] text-white text-[9px] px-1.5 py-0 rounded-full font-bold">
                    Today
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black font-mono text-[#F7EFE5]">
                  {formatMinutesPretty(activeDay.totalMinutes)}
                </span>
                <span className="text-[#D0BFB2] text-[10px]">
                  • {activeDay.sessionCount}{" "}
                  {activeDay.sessionCount === 1 ? "session" : "sessions"}
                </span>
              </div>
              {/* Arrow */}
              <div className="w-2.5 h-2.5 bg-[#30251F] border-r border-b border-[var(--border-soft)] transform rotate-45 mx-auto -mb-3 mt-1" />
            </div>
          </div>
        )}

        {/* Empty State Banner when no study minutes recorded yet */}
        {!stats.hasData ? (
          <div className="relative rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)] p-6 sm:p-8 text-center overflow-hidden my-2">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
              <div className="p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[0_4px_12px_rgba(3,64,120,0.06)]">
                <StudyBuddyMascot mood="wave" size="md" className="animate-cute-bounce" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[var(--text)] font-['Quicksand',sans-serif]">
                  Your study journey starts here!
                </h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  No sessions recorded for this period yet. Complete a focus sprint or log your study time to see your daily progress grow.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {onStartSprint ? (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={onStartSprint}
                    className="gap-1.5 font-bold text-xs rounded-full"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Start Focus Sprint</span>
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleQuickLog(25)}
                    className="gap-1.5 font-bold text-xs rounded-full"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Log 25m Session</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLog(15)}
                  className="text-xs font-semibold rounded-full"
                >
                  Quick Log +15m
                </Button>
              </div>

              {quickLogFeedback && (
                <div className="text-xs font-bold text-[#98473E] flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{quickLogFeedback}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Real Data Bar Graph */
          <div className="relative w-full select-none">
            {/* SVG Chart for Crisp Rendering & Scaling */}
            <div className="w-full overflow-x-auto pb-1">
              <div className="min-w-[320px]">
                <svg
                  viewBox={`0 0 600 ${chartHeight}`}
                  className="w-full h-44 overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    {/* Terracotta Gradient for Regular Bars */}
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#98473E" />
                      <stop offset="100%" stopColor="#823C34" />
                    </linearGradient>

                    {/* Muted Copper to Terracotta Gradient for Today's Highlighted Bar */}
                    <linearGradient id="todayBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B49082" />
                      <stop offset="50%" stopColor="#A37C40" />
                      <stop offset="100%" stopColor="#98473E" />
                    </linearGradient>

                    {/* Bar Shadow Filter */}
                    <filter id="barShadow" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow
                        dx="0"
                        dy="3"
                        stdDeviation="2"
                        floodColor="#30251F"
                        floodOpacity="0.16"
                      />
                    </filter>
                  </defs>

                  {/* Horizontal Grid Lines & Y-axis labels */}
                  {yTicks.map((tickVal) => {
                    const yPos =
                      chartTopPadding +
                      effectiveGraphHeight * (1 - tickVal / maxDayMinutes);
                    return (
                      <g key={tickVal}>
                        <line
                          x1="35"
                          y1={yPos}
                          x2="590"
                          y2={yPos}
                          stroke="var(--chart-grid)"
                          strokeWidth="1"
                          strokeDasharray={tickVal === 0 ? "none" : "3,3"}
                        />
                        <text
                          x="28"
                          y={yPos + 3}
                          fill="var(--chart-text)"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {tickVal}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Dotted Daily Goal Line */}
                  {stats.dailyGoalMinutes <= maxDayMinutes && (
                    <g>
                      <line
                        x1="35"
                        y1={goalLineY}
                        x2="590"
                        y2={goalLineY}
                        stroke="#A37C40"
                        strokeWidth="1.2"
                        strokeDasharray="4,4"
                        strokeOpacity="0.8"
                      />
                      <rect
                        x="530"
                        y={goalLineY - 8}
                        width="60"
                        height="16"
                        rx="8"
                        fill="var(--surface-hover)"
                        stroke="var(--border-soft)"
                        strokeWidth="1"
                      />
                      <text
                        x="560"
                        y={goalLineY + 3}
                        fill="#A37C40"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        Goal {stats.dailyGoalMinutes}m
                      </text>
                    </g>
                  )}

                  {/* Daily Bars */}
                  {stats.days.map((day, idx) => {
                    const totalDays = stats.days.length;
                    const availableWidth = 590 - 45;
                    const columnWidth = availableWidth / totalDays;
                    const xCenter = 45 + idx * columnWidth + columnWidth / 2;

                    // Bar width tailored to timeRange (wider on week, narrower on month)
                    const barWidth =
                        timeRange === "week"
                        ? Math.min(36, columnWidth * 0.58)
                        : Math.min(14, columnWidth * 0.75);

                    const barX = xCenter - barWidth / 2;

                    // Bar Height calculation
                    const rawHeight =
                      effectiveGraphHeight * (day.totalMinutes / maxDayMinutes);
                    // Minimal indicator bar so 0m days are still interactive and visible
                    const barHeight = Math.max(day.totalMinutes > 0 ? 6 : 2, rawHeight);
                    const barY = chartTopPadding + effectiveGraphHeight - barHeight;

                    const isHovered = activeTooltipIndex === idx;

                    return (
                      <g
                        key={day.date}
                        className="cursor-pointer group"
                        onMouseEnter={() => setActiveTooltipIndex(idx)}
                        onMouseLeave={() => setActiveTooltipIndex(null)}
                        onClick={() =>
                          setActiveTooltipIndex(isHovered ? null : idx)
                        }
                      >
                        {/* Invisible Broad Hit Area for Easy Touch & Hover */}
                        <rect
                          x={xCenter - columnWidth / 2}
                          y={chartTopPadding}
                          width={columnWidth}
                          height={effectiveGraphHeight + chartBottomPadding}
                          fill="transparent"
                        />

                        {/* Bar Background Track */}
                        <rect
                          x={barX}
                          y={chartTopPadding}
                          width={barWidth}
                          height={effectiveGraphHeight}
                          rx={Math.min(6, barWidth / 2)}
                          fill={isHovered ? "var(--chart-track-hover)" : "var(--chart-track)"}
                          className="transition-colors duration-150"
                        />

                        {/* The Value Bar */}
                        <rect
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={barHeight}
                          rx={Math.min(6, barWidth / 2)}
                          fill={
                            day.isToday
                              ? "url(#todayBarGradient)"
                              : day.totalMinutes > 0
                              ? "url(#barGradient)"
                              : "var(--border-soft)"
                          }
                          filter="url(#barShadow)"
                          className={`transition-all duration-300 ${
                            isHovered
                              ? "brightness-110 filter drop-shadow-[0_0_10px_rgba(152,71,62,0.45)]"
                              : ""
                          }`}
                        />

                        {/* Special Glow or Outline for Current Day */}
                        {day.isToday && (
                          <rect
                            x={barX - 1.5}
                            y={barY - 1.5}
                            width={barWidth + 3}
                            height={barHeight + 3}
                            rx={Math.min(7, barWidth / 2 + 1)}
                            fill="none"
                            stroke="#A37C40"
                            strokeWidth="1.5"
                            strokeOpacity="0.8"
                            className="animate-pulse-glow"
                          />
                        )}

                        {/* X-Axis Day Label */}
                        <text
                          x={xCenter}
                          y={chartTopPadding + effectiveGraphHeight + 16}
                          fill={
                            day.isToday
                              ? "var(--text)"
                              : isHovered
                              ? "#98473E"
                              : "var(--chart-text)"
                          }
                          fontSize={timeRange === "week" ? "10" : "8"}
                          fontWeight={day.isToday || isHovered ? "bold" : "600"}
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {day.dayLabel}
                        </text>

                        {/* Today indicator dot */}
                        {day.isToday && (
                          <circle
                            cx={xCenter}
                            cy={chartTopPadding + effectiveGraphHeight + 23}
                            r="2"
                            fill="#98473E"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Quick Session Logging & Action Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#A37C40] ring-2 ring-[#98473E]/30" />
                <span className="font-semibold text-[var(--text)]">Highlighted:</span> Today
                <span className="mx-1">•</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#98473E]" />
                <span>Terracotta ({`#98473E`})</span>
                {quickLogFeedback && (
                  <span className="ml-2 font-bold text-[#98473E] animate-fade-in">
                    {quickLogFeedback}
                  </span>
                )}
              </div>

              {/* Quick Actions to add real session */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickLog(15)}
                  className="h-7 text-[11px] font-bold text-[#98473E] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-full px-2.5"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  +15m
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickLog(25)}
                  className="h-7 text-[11px] font-bold text-[#98473E] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-full px-2.5"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  +25m
                </Button>
                {onStartSprint && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onStartSprint}
                    className="h-7 text-[11px] font-bold rounded-full px-3"
                  >
                    Start Timer
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
