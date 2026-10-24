"use client";

import React, { useState } from 'react';
import { Topic, PageText } from '../../types';
import {
  calculateExamReadiness,
  getUnifiedTopicMastery,
  getConfidenceCalibrationReport
} from '../services/mastery';
import {
  getLeitnerSummary,
  recordTopicReview,
  getDueTodayTopics
} from '../services/spaced';
import { useFeatures } from './FeaturesProvider';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export interface MasteryTrackerProps {
  topics: Topic[];
  pages: PageText[];
  onOpenPracticePaper?: () => void;
  onOpenPlanner?: () => void;
}

export const MasteryTracker: React.FC<MasteryTrackerProps> = ({
  topics,
  pages,
  onOpenPracticePaper,
  onOpenPlanner
}) => {
  const { store } = useFeatures();
  const [activeTab, setActiveTab] = useState<'readiness' | 'spaced' | 'topics'>('readiness');

  const readiness = calculateExamReadiness(topics);
  const unified = getUnifiedTopicMastery(topics);
  const calibration = getConfidenceCalibrationReport();
  const leitner = getLeitnerSummary(topics);
  const dueTopics = getDueTodayTopics(topics);

  const topicNameMap = new Map(topics.map(t => [t.id, t.name]));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>🎯</span> Unified Mastery & Exam Readiness
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregates core quizzes, practice papers, answer checks, and spaced repetition in plain code.
            </p>
          </div>

          <div className="flex gap-2">
            {onOpenPracticePaper && (
              <Button
                onClick={onOpenPracticePaper}
                size="sm"
              >
                Target Weak Topics
              </Button>
            )}
            {onOpenPlanner && (
              <Button
                onClick={onOpenPlanner}
                variant="secondary"
                size="sm"
              >
                Adapt Study Plan
              </Button>
            )}
          </div>
        </div>

        {/* Readiness Score & Subcomponents Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
          <div className="sm:col-span-1 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-border pb-4 sm:pb-0 pr-0 sm:pr-4">
            <span className="text-[11px] uppercase font-bold tracking-wider text-primary mb-1">
              Exam Readiness
            </span>
            <div className="text-4xl font-black text-foreground">
              {readiness.score}
              <span className="text-lg font-normal text-muted-foreground">/100</span>
            </div>
            <span className="text-[10px] text-muted-foreground text-center mt-1">
              (50% Acc + 30% Cov + 20% Cal)
            </span>
          </div>

          <div className="sm:col-span-3 flex flex-col justify-between space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-card border border-border text-center">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Accuracy (50%)
                </span>
                <span className="text-base font-bold text-foreground">
                  {readiness.accuracyComponent}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border text-center">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Coverage (30%)
                </span>
                <span className="text-base font-bold text-foreground">
                  {readiness.coverageComponent}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border text-center">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Calibration (20%)
                </span>
                <span className="text-base font-bold text-foreground">
                  {readiness.calibrationComponent}%
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {readiness.summary}
            </p>
          </div>
        </div>

        {/* Confidence Calibration Report Card */}
        <div className="mt-4 p-4 rounded-xl bg-secondary/20 border border-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
            <span>🧠</span> Metacognitive Calibration Report
          </h4>
          <p className="text-xs text-foreground font-medium">
            "{calibration.statement}"
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-card p-2 rounded-md border border-border">
              <span className="text-muted-foreground block text-[10px]">When Sure</span>
              <span className="font-bold text-emerald-400">{calibration.sureAccuracy}% Correct</span>
            </div>
            <div className="bg-card p-2 rounded-md border border-border">
              <span className="text-muted-foreground block text-[10px]">When Unsure</span>
              <span className="font-bold text-amber-400">{calibration.unsureAccuracy}% Correct</span>
            </div>
            <div className="bg-card p-2 rounded-md border border-border">
              <span className="text-muted-foreground block text-[10px]">When Guessing</span>
              <span className="font-bold text-muted-foreground">{calibration.guessAccuracy}% Correct</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation tabs between Spaced Repetition and Per-Topic Mastery */}
      <div className="flex space-x-2 text-xs font-semibold border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('readiness')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'readiness'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card text-muted-foreground border border-border hover:text-foreground'
          }`}
        >
          Spaced Repetition (Leitner Boxes)
        </button>
        <button
          onClick={() => setActiveTab('topics')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'topics'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-card text-muted-foreground border border-border hover:text-foreground'
          }`}
        >
          Unified Topic Breakdown ({unified.length})
        </button>
      </div>

      {/* SPACIALLY REPEATED TOPICS (LEITNER BOXES) */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          {/* Due Today Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>🔔</span> Due Today for Spaced Review ({dueTopics.length})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                1 / 3 / 7 / 14 Day Intervals
              </span>
            </div>

            {dueTopics.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                🎉 All caught up! No spaced topics due today.
              </div>
            ) : (
              <div className="space-y-2">
                {dueTopics.map(t => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center justify-between flex-wrap gap-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{t.name}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.summary}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => recordTopicReview(t.id, false)}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7 text-xs px-2.5"
                      >
                        Needs Review ↺
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => recordTopicReview(t.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-2.5"
                      >
                        I Remembered ✓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 4 Leitner Boxes Visual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { num: 1, title: 'Box 1: Daily', interval: '1 day', topics: leitner.box1, color: 'border-destructive/30 bg-destructive/5' },
              { num: 2, title: 'Box 2: 3-Day', interval: '3 days', topics: leitner.box2, color: 'border-amber-500/30 bg-amber-500/5' },
              { num: 3, title: 'Box 3: Weekly', interval: '7 days', topics: leitner.box3, color: 'border-primary/30 bg-primary/5' },
              { num: 4, title: 'Box 4: Bi-Weekly', interval: '14 days', topics: leitner.box4, color: 'border-emerald-500/30 bg-emerald-500/5' }
            ].map(b => (
              <div
                key={b.num}
                className={`p-3.5 rounded-xl border ${b.color} bg-card flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{b.title}</span>
                    <span className="text-[10px] text-muted-foreground">{b.interval}</span>
                  </div>
                  <div className="text-xl font-black text-foreground mb-2">
                    {b.topics.length} <span className="text-xs font-normal text-muted-foreground">topics</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {b.topics.slice(0, 3).map(t => (
                    <div key={t.id} className="text-[11px] truncate text-muted-foreground">
                      • {t.name}
                    </div>
                  ))}
                  {b.topics.length > 3 && (
                    <span className="text-[10px] text-muted-foreground/70 block">+{b.topics.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNIFIED TOPIC BREAKDOWN TABLE */}
      {activeTab === 'topics' && (
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Per-Topic Unified Mastery & Data Sources
          </h3>

          <div className="divide-y divide-border">
            {unified.map(u => {
              const name = topicNameMap.get(u.topicId) || u.topicId;
              const badgeVariants = {
                mastered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                learning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                weak: 'bg-destructive/15 text-weak border-destructive/30'
              };

              return (
                <div key={u.topicId} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{name}</h4>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Sources: {u.sources.coreQuiz} core quizzes · {u.sources.practicePaper} papers ·{' '}
                      {u.sources.answerCheck} checks · {u.sources.flashcards} flashcards
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {Math.round(u.accuracy * 100)}%
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeVariants[u.mastery]}`}>
                      {u.mastery}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
