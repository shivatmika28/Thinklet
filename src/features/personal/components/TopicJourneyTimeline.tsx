"use client";

import React, { useState } from 'react';
import { TrendingUp, Award, Calendar } from 'lucide-react';
import { Topic } from '../../../types';
import { TopicJourneyPoint } from '../types';
import { WhyPopover } from './WhyPopover';
import { createReason } from '../utils/reasonModel';

export interface TopicJourneyTimelineProps {
  topics: Topic[];
  journeyData: Record<string, TopicJourneyPoint[]>;
}

export function TopicJourneyTimeline({ topics, journeyData }: TopicJourneyTimelineProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    topics[0]?.id || ''
  );

  const activePoints = journeyData[selectedTopicId] || [];
  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  const firstPoint = activePoints[0];
  const lastPoint = activePoints[activePoints.length - 1];
  const delta = (lastPoint?.scorePercent || 0) - (firstPoint?.scorePercent || 0);

  // SVG Chart Geometry
  const width = 560;
  const height = 180;
  const paddingX = 45;
  const paddingY = 30;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Calculate coordinates
  const coords = activePoints.map((pt, idx) => {
    const x =
      activePoints.length <= 1
        ? width / 2
        : paddingX + (idx / (activePoints.length - 1)) * chartW;
    // Score is 0 - 100, invert for SVG y
    const normalizedScore = Math.max(0, Math.min(100, pt.scorePercent));
    const y = paddingY + chartH - (normalizedScore / 100) * chartH;
    return { x, y, pt };
  });

  // Construct SVG Path
  const pathD = coords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = coords[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, '');

  // Construct Area Path for gradient fill
  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-5">
      {/* Header and Topic Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--surface-hover)] text-[#98473E]">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)] font-['Quicksand',sans-serif]">
              Topic Journey Timeline
            </h3>
            <WhyPopover
              reason={createReason(
                'Per-topic chronological score and mastery milestone tracking across assessment attempts',
                [
                  `Topic: ${selectedTopic?.name || 'Selected'}`,
                  `Milestone checkpoints: ${activePoints.length} evaluations recorded`,
                  `Net change: ${delta >= 0 ? `+${delta}%` : `${delta}%`}`,
                ]
              )}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Visualise your step-by-step progress from initial baseline to current mastery
          </p>
        </div>

        {/* Topic Dropdown */}
        {topics.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#98473E] cursor-pointer"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] text-center">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            Baseline
          </div>
          <div className="text-base sm:text-lg font-bold text-[var(--text)] mt-0.5">
            {firstPoint ? `${firstPoint.scorePercent}%` : '--'}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] text-center">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            Current
          </div>
          <div className="text-base sm:text-lg font-bold text-[#98473E] mt-0.5">
            {lastPoint ? `${lastPoint.scorePercent}%` : '--'}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] text-center">
          <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            Mastery Delta
          </div>
          <div
            className={`text-base sm:text-lg font-bold mt-0.5 ${
              delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {delta >= 0 ? `+${delta}%` : `${delta}%`}
          </div>
        </div>
      </div>

      {/* Lightweight SVG Timeline Graphic */}
      <div className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[480px] max-h-[220px]"
        >
          <defs>
            <linearGradient id="journey-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#98473E" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#98473E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Guideline lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            className="text-[var(--border-soft)] opacity-40"
            strokeDasharray="3 3"
          />
          <text
            x={paddingX - 8}
            y={paddingY + 3}
            textAnchor="end"
            fontSize="9"
            fill="currentColor"
            className="text-[var(--text-muted)]"
          >
            100%
          </text>

          <line
            x1={paddingX}
            y1={paddingY + chartH / 2}
            x2={width - paddingX}
            y2={paddingY + chartH / 2}
            stroke="currentColor"
            className="text-[var(--border-soft)] opacity-40"
            strokeDasharray="3 3"
          />
          <text
            x={paddingX - 8}
            y={paddingY + chartH / 2 + 3}
            textAnchor="end"
            fontSize="9"
            fill="currentColor"
            className="text-[var(--text-muted)]"
          >
            50%
          </text>

          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-[var(--border-soft)] opacity-60"
          />
          <text
            x={paddingX - 8}
            y={height - paddingY + 3}
            textAnchor="end"
            fontSize="9"
            fill="currentColor"
            className="text-[var(--text-muted)]"
          >
            0%
          </text>

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#journey-grad)" />}

          {/* Connecting Curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#98473E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Node Points */}
          {coords.map(({ x, y, pt }, idx) => {
            const isMastered = pt.mastery === 'mastered';
            const nodeFill = isMastered ? '#10b981' : pt.mastery === 'learning' ? '#f59e0b' : '#ef4444';

            return (
              <g key={idx} className="group cursor-pointer">
                {/* Outer halo */}
                <circle
                  cx={x}
                  y={y}
                  r="7"
                  fill={nodeFill}
                  opacity="0.2"
                />
                {/* Core node */}
                <circle
                  cx={x}
                  y={y}
                  r="4.5"
                  fill={nodeFill}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* Score label above node */}
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="currentColor"
                  className="text-[var(--text)]"
                >
                  {pt.scorePercent}%
                </text>
                {/* Date label on X axis */}
                <text
                  x={x}
                  y={height - paddingY + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  className="text-[var(--text-muted)]"
                >
                  {pt.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
        <span className="flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-emerald-500" />
          <span>Green = Mastered (85%+)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-[#98473E]" />
          <span>Tracked across recent review intervals</span>
        </span>
      </div>
    </div>
  );
}
