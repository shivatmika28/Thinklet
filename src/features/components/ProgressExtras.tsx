"use client";

import React from 'react';
import { useFeatures } from './FeaturesProvider';
import { Button } from '../../components/ui/Button';

export interface ProgressExtrasProps {
  onOpenMastery?: () => void;
  onOpenShareCard?: () => void;
}

export const ProgressExtras: React.FC<ProgressExtrasProps> = ({
  onOpenMastery,
  onOpenShareCard
}) => {
  const { settings, store } = useFeatures();

  if (!settings.enableMasteryTracker && !settings.enableShareCard) return null;

  return (
    <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border flex items-center justify-between flex-wrap gap-3">
      <div>
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📊</span> Unified Performance Insights
        </h4>
        <p className="text-xs text-muted-foreground">
          Streak: <span className="font-semibold text-foreground">{store.streak.currentStreak} day(s)</span> · Completed papers:{' '}
          <span className="font-semibold text-foreground">{store.practicePapers.length}</span> · Answer checks:{' '}
          <span className="font-semibold text-foreground">{store.answerChecks.length}</span>
        </p>
      </div>

      <div className="flex gap-2">
        {settings.enableMasteryTracker && onOpenMastery && (
          <Button
            size="sm"
            onClick={onOpenMastery}
          >
            Exam Readiness Report
          </Button>
        )}
        {settings.enableShareCard && onOpenShareCard && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenShareCard}
          >
            Generate Share Card
          </Button>
        )}
      </div>
    </div>
  );
};
