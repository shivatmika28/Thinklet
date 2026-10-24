"use client";

import React from 'react';
import { useFeatures } from './FeaturesProvider';

export const QuizExtras: React.FC = () => {
  const { settings } = useFeatures();
  return (
    <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-right">
      <span>AI Mode: {settings.tone} · Confidence scoring enabled</span>
    </div>
  );
};
