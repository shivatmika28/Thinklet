"use client";

import React from 'react';
import { useFeatures } from './FeaturesProvider';
import { Tone, ExplanationLevel } from '../types.ext';
import { Lang } from '../../types';

export const PreferencesBar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { settings, updateSettings } = useFeatures();

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs bg-secondary/30 p-2.5 rounded-lg border border-border">
      <span className="text-muted-foreground font-medium flex items-center gap-1">
        <span>🎨</span> Style:
      </span>

      {/* Tone Select */}
      <select
        value={settings.tone}
        onChange={e => updateSettings({ tone: e.target.value as Tone })}
        aria-label="Tutor Tone"
        className="bg-background border border-input rounded-md px-2.5 py-1 text-foreground shadow-xs text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="friendly">Tone: Friendly</option>
        <option value="formal">Tone: Formal</option>
        <option value="exam_coach">Tone: Exam Coach</option>
      </select>

      {/* Explanation Level Select */}
      <select
        value={settings.explanationLevel}
        onChange={e => updateSettings({ explanationLevel: e.target.value as ExplanationLevel })}
        aria-label="Explanation Level"
        className="bg-background border border-input rounded-md px-2.5 py-1 text-foreground shadow-xs text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="age_12">Level: Explain like 12</option>
        <option value="standard">Level: Standard</option>
        <option value="exam_level">Level: Exam Level</option>
      </select>

      {/* Language Select */}
      <select
        value={settings.language}
        onChange={e => updateSettings({ language: e.target.value as Lang })}
        aria-label="Language"
        className="bg-background border border-input rounded-md px-2.5 py-1 text-foreground shadow-xs text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="English">English</option>
        <option value="Hinglish">Hinglish</option>
        <option value="Hindi">Hindi (हिंदी)</option>
        <option value="Tamil">Tamil (தமிழ்)</option>
        <option value="Bengali">Bengali (বাংলা)</option>
        <option value="Marathi">Marathi (मराठी)</option>
      </select>

      {/* Dyslexia Mode Toggle */}
      <label
        htmlFor="bar-dyslexia-toggle"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition-colors text-xs ${
          settings.dyslexiaMode
            ? 'bg-primary/15 text-primary border-primary/30 font-medium'
            : 'bg-background text-muted-foreground border-input'
        }`}
      >
        <input
          id="bar-dyslexia-toggle"
          type="checkbox"
          checked={settings.dyslexiaMode}
          onChange={e => updateSettings({ dyslexiaMode: e.target.checked })}
          className="w-3.5 h-3.5 rounded accent-primary"
        />
        <span>Dyslexia Mode</span>
      </label>
    </div>
  );
};
