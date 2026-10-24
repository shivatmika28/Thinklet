"use client";

import React from 'react';
import { useFeatures } from './FeaturesProvider';
import { Button } from '../../components/ui/Button';

export interface PlanExtrasProps {
  onOpenAdaptivePlanner?: () => void;
}

export const PlanExtras: React.FC<PlanExtrasProps> = ({ onOpenAdaptivePlanner }) => {
  const { settings, store } = useFeatures();

  if (!settings.enableAdaptivePlanner) return null;

  const versionCount = store.plans.length;

  return (
    <div className="mt-4 p-3 bg-secondary/40 border border-border rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs">
      <div>
        <span className="font-semibold text-foreground">
          Adaptive Planner Active:
        </span>{' '}
        <span className="text-muted-foreground">
          {versionCount > 0 ? `${versionCount} plan revision(s) saved.` : 'Ready to adapt as new results arrive.'}
        </span>
      </div>
      {onOpenAdaptivePlanner && (
        <Button
          size="sm"
          onClick={onOpenAdaptivePlanner}
        >
          View Adaptive Versions
        </Button>
      )}
    </div>
  );
};
