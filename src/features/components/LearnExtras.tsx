"use client";

import React from 'react';
import { useFeatures } from './FeaturesProvider';
import { Topic, PageText } from '../../types';
import { PreferencesBar } from './PreferencesBar';

import { Button } from '../../components/ui/Button';

export interface LearnExtrasProps {
  topic?: Topic;
  pages?: PageText[];
  onOpenTeachBack?: () => void;
  onOpenVisual?: () => void;
}

export const LearnExtras: React.FC<LearnExtrasProps> = ({
  topic,
  pages = [],
  onOpenTeachBack,
  onOpenVisual
}) => {
  const { settings } = useFeatures();

  if (!topic) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      {/* Quick Preferences Bar */}
      <PreferencesBar compact={true} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex gap-2">
          {settings.enableTeachBack && onOpenTeachBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTeachBack}
              className="gap-1.5"
            >
              <span>🗣️</span> Teach-Back Challenge
            </Button>
          )}

          {settings.enableVisualExplainer && onOpenVisual && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenVisual}
              className="gap-1.5"
            >
              <span>🗺️</span> View Concept Map
            </Button>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground">
          Quotes are grounded in source text
        </span>
      </div>
    </div>
  );
};
