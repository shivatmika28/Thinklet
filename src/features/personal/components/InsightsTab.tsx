"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Calendar, Layers } from 'lucide-react';
import { usePersonalStore } from '../services/personalStore';
import { ThinkletWrappedData } from '../types';
import {
  getAttempts,
  getTopics,
  getStudySessions,
  getStreakInfo,
} from '../services/dataAdapter';
import {
  computeLearningProfile,
  extractWrongAnswers,
  computeTopicJourney,
  computeThinkletWrapped,
} from '../utils/insightsAnalysis';
import { LearningProfileCard } from './LearningProfileCard';
import { MistakePatternsCard } from './MistakePatternsCard';
import { TopicJourneyTimeline } from './TopicJourneyTimeline';
import { ThinkletWrappedModal } from './ThinkletWrappedModal';

export interface InsightsTabProps {
  onShowToast?: (msg: string) => void;
}

export function InsightsTab({ onShowToast }: InsightsTabProps) {
  const { store, saveMistakeAnalysis } = usePersonalStore();
  const [showWrappedModal, setShowWrappedModal] = useState(false);

  // Read data through data adapter
  const attempts = useMemo(() => getAttempts(), []);
  const topics = useMemo(() => getTopics(), []);
  const studySessions = useMemo(() => getStudySessions(), []);
  const streakInfo = useMemo(() => getStreakInfo(), []);

  // Compute profile
  const profile = useMemo(
    () => computeLearningProfile(store.events, studySessions, attempts),
    [store.events, studySessions, attempts]
  );

  // Compute wrong answers
  const wrongAnswers = useMemo(
    () => extractWrongAnswers(attempts, topics),
    [attempts, topics]
  );

  // Compute topic journey
  const journeyData = useMemo(
    () => computeTopicJourney(topics, attempts),
    [topics, attempts]
  );

  // Compute monthly wrapped data
  const [wrappedData, setWrappedData] = useState<ThinkletWrappedData>(() =>
    computeThinkletWrapped(
      studySessions,
      attempts,
      streakInfo.currentStreak || 0,
      topics
    )
  );

  useEffect(() => {
    setWrappedData(
      computeThinkletWrapped(
        studySessions,
        attempts,
        streakInfo.currentStreak || 0,
        topics,
        new Date()
      )
    );
  }, [studySessions, attempts, streakInfo, topics]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Monthly Wrapped Banner Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-[#98473E]/30 bg-gradient-to-r from-[#98473E]/10 via-[var(--surface-raised)] to-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-[#98473E] uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Monthly Special</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-['Quicksand',sans-serif]">
            {wrappedData.monthName} Wrapped is Ready!
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md">
            Review your study hours, greatest topic leaps, and export a shareable graphic to celebrate your consistency.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowWrappedModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#98473E] hover:bg-[#803B33] text-xs font-bold text-white shadow-sm cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Calendar className="h-4 w-4" />
          <span>View My Wrapped</span>
        </button>
      </div>

      {/* 1. Learning Profile Card */}
      <LearningProfileCard profile={profile} />

      {/* 2. Mistake Patterns Card */}
      <MistakePatternsCard
        wrongAnswers={wrongAnswers}
        cachedAnalysis={store.mistakeAnalysis}
        onSaveAnalysis={saveMistakeAnalysis}
        onShowToast={onShowToast}
      />

      {/* 3. Topic Journey Timeline */}
      <TopicJourneyTimeline topics={topics} journeyData={journeyData} />

      {/* Thinklet Wrapped Modal */}
      <ThinkletWrappedModal
        wrappedData={wrappedData}
        isOpen={showWrappedModal}
        onClose={() => setShowWrappedModal(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
}
