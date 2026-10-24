"use client";

import React, { useEffect } from 'react';
import { useFeatures } from './FeaturesProvider';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Tone, ExplanationLevel } from '../types.ext';
import { Lang } from '../../types';
import { FrostedPanel } from '@/components/ui/FrostedPanel';

export const SettingsPanel: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose
}) => {
  const { settings, updateSettings } = useFeatures();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      style={{
        backgroundColor: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        padding: "24px",
        color: "var(--text-primary)",
      }}
      className="space-y-6"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "14px" }}>
        <div>
          <h2 id="settings-title" style={{ fontSize: "17px", fontWeight: 700, color: "var(--heading)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚙️</span>
            <span>Learning preferences & feature controls</span>
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            Personalize your AI study partner, response style, and active feature modules.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
            className="focus-ring hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* SECTION 0: APPEARANCE & THEME */}
        <div>
          <h3 style={{ fontSize: "11px", fontWeight: 700, color: "var(--heading)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Appearance & Theme
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
            Choose your preferred color theme or match your system preferences.
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { mode: "light", label: "Light", icon: Sun },
              { mode: "dark", label: "Dark", icon: Moon },
              { mode: "system", label: "System", icon: Monitor },
            ].map(({ mode, label, icon: Icon }) => {
              const active = theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode as any)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-button)",
                    border: active ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                    backgroundColor: active ? "var(--secondary-surface)" : "var(--panel)",
                    color: active ? "var(--secondary-surface-text)" : "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: active ? 700 : 500,
                    transition: "all 150ms var(--ease-standard)",
                  }}
                  className="thinklet-btn-hover"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Interface Animations toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              marginTop: "12px",
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--panel)",
              cursor: "pointer",
            }}
            className="thinklet-btn-hover"
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                Interface animations
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Smooth card transitions, metric count-ups, and micro-interactions
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.enableAnimations !== false}
              onChange={e => updateSettings({ enableAnimations: e.target.checked })}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "var(--accent)",
                cursor: "pointer"
              }}
            />
          </label>

          {/* Mascot Animations toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              marginTop: "8px",
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--panel)",
              cursor: "pointer",
            }}
            className="thinklet-btn-hover"
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                Mascot animations
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Pip breathing, blinking, cursor look-at, and celebration reactions
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.enableMascotAnimations !== false}
              onChange={e => updateSettings({ enableMascotAnimations: e.target.checked })}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "var(--accent)",
                cursor: "pointer"
              }}
            />
          </label>

          {/* Mascot Tips toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              marginTop: "8px",
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--panel)",
              cursor: "pointer",
            }}
            className="thinklet-btn-hover"
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                Mascot tips & speech bubbles
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Helpful reminders, study advice, and quick access to AI Tutor
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.enableMascotTips !== false}
              onChange={e => updateSettings({ enableMascotTips: e.target.checked })}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "var(--accent)",
                cursor: "pointer"
              }}
            />
          </label>
        </div>

        {/* SECTION 1: LEARNING PREFERENCES */}
        <div>
          <h3 style={{ fontSize: "11px", fontWeight: 700, color: "var(--heading)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
            Persona & explanation preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tone */}
            <div>
              <label htmlFor="pref-tone" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Tutor tone
              </label>
              <select
                id="pref-tone"
                value={settings.tone}
                onChange={e => updateSettings({ tone: e.target.value as Tone })}
                style={{
                  width: "100%",
                  fontSize: "13px",
                  backgroundColor: "var(--raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-button)",
                  padding: "8px 10px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                className="focus-ring"
              >
                <option value="friendly" style={{ backgroundColor: "var(--panel)" }}>Friendly & supportive (encouraging)</option>
                <option value="formal" style={{ backgroundColor: "var(--panel)" }}>Formal & academic (precise)</option>
                <option value="exam_coach" style={{ backgroundColor: "var(--panel)" }}>Exam coach (high-yield & marking points)</option>
              </select>
            </div>

            {/* Explanation Level */}
            <div>
              <label htmlFor="pref-level" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Explanation depth
              </label>
              <select
                id="pref-level"
                value={settings.explanationLevel}
                onChange={e => updateSettings({ explanationLevel: e.target.value as ExplanationLevel })}
                style={{
                  width: "100%",
                  fontSize: "13px",
                  backgroundColor: "var(--raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-button)",
                  padding: "8px 10px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                className="focus-ring"
              >
                <option value="age_12" style={{ backgroundColor: "var(--panel)" }}>Explain like I'm 12 (analogies & simplicity)</option>
                <option value="standard" style={{ backgroundColor: "var(--panel)" }}>Standard (undergraduate / high school)</option>
                <option value="exam_level" style={{ backgroundColor: "var(--panel)" }}>Exam level (rigorous marking criteria)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="pref-lang" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Language
              </label>
              <select
                id="pref-lang"
                value={settings.language}
                onChange={e => updateSettings({ language: e.target.value as Lang })}
                style={{
                  width: "100%",
                  fontSize: "13px",
                  backgroundColor: "var(--raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-button)",
                  padding: "8px 10px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                className="focus-ring"
              >
                <option value="English" style={{ backgroundColor: "var(--panel)" }}>English</option>
                <option value="Hindi" style={{ backgroundColor: "var(--panel)" }}>Hindi (हिंदी)</option>
                <option value="Hinglish" style={{ backgroundColor: "var(--panel)" }}>Hinglish (Hindi in Latin script)</option>
                <option value="Tamil" style={{ backgroundColor: "var(--panel)" }}>Tamil (தமிழ்)</option>
                <option value="Bengali" style={{ backgroundColor: "var(--panel)" }}>Bengali (বাংলা)</option>
                <option value="Marathi" style={{ backgroundColor: "var(--panel)" }}>Marathi (मराठी)</option>
              </select>
            </div>

            {/* Dyslexia Mode */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "var(--raised)",
                borderRadius: "var(--radius-button)",
                border: "1px solid var(--border)",
              }}
            >
              <div>
                <label htmlFor="pref-dyslexia" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "block", cursor: "pointer" }}>
                  Dyslexia mode
                </label>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>
                  Lexend font, larger letter spacing, punchy sentences
                </span>
              </div>
              <input
                id="pref-dyslexia"
                type="checkbox"
                checked={settings.dyslexiaMode}
                onChange={e => updateSettings({ dyslexiaMode: e.target.checked })}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--button)",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: FEATURE TOGGLES */}
        <div>
          <h3 style={{ fontSize: "11px", fontWeight: 700, color: "var(--heading)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Feature pack modules
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
            Every feature is independently toggleable and degrades gracefully when disabled.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { key: 'enablePracticePaper', label: 'Practice paper generator', desc: 'Custom sections, timers, marks' },
              { key: 'enableAnswerChecker', label: 'Answer checker', desc: 'Instant grading with verified evidence' },
              { key: 'enableTeachBack', label: 'Teach-back mode', desc: 'Explain concepts in your own words' },
              { key: 'enableMasteryTracker', label: 'Unified mastery & calibration', desc: 'Confidence reports & exam readiness' },
              { key: 'enableSpacedRepetition', label: 'Spaced repetition (Leitner)', desc: '1/3/7/14-day review schedule' },
              { key: 'enableAdaptivePlanner', label: 'Adaptive planner (v1/v2)', desc: 'Goal-driven study schedules' },
              { key: 'enableSmartNotes', label: 'Smart notes & cheat sheets', desc: 'Mnemonics and printable sheets' },
              { key: 'enableVisualExplainer', label: 'Explain visually (cards & SVG)', desc: 'Concept maps and flow steps' },
              { key: 'enableImageInput', label: 'Image & handwritten upload', desc: 'OCR transcription with confirmation' },
              { key: 'enableVoice', label: 'Voice audio & read-aloud', desc: 'Speech synthesis and 60-second reviews' },
              { key: 'enableStudyTracker', label: 'Study tracker & streaks', desc: 'Focus timer and daily goals' },
              { key: 'enableShareCard', label: 'Progress share card', desc: 'Downloadable canvas achievement card' },
              { key: 'enableFlashcards', label: 'Flashcards & Anki export', desc: 'Active recall and .csv export' }
            ].map(item => {
              const active = (settings as any)[item.key];
              return (
                <label
                  key={item.key}
                  htmlFor={`toggle-${item.key}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-button)",
                    border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
                    backgroundColor: active ? "var(--secondary)" : "var(--card)",
                    cursor: "pointer",
                    transition: "all 150ms var(--ease-standard)",
                  }}
                  className="hover:border-primary/50"
                >
                  <div className="pr-2">
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>
                      {item.desc}
                    </span>
                  </div>
                  <input
                    id={`toggle-${item.key}`}
                    type="checkbox"
                    checked={Boolean(active)}
                    onChange={e => updateSettings({ [item.key]: e.target.checked })}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "var(--button)",
                      cursor: "pointer",
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <FrostedPanel
          intensity="standard"
          border={false}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            borderRadius: 0,
            cursor: "pointer",
          }}
          aria-hidden="true"
        />
        <div
          style={{
            position: "relative",
            zIndex: 51,
            maxWidth: "650px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 48px rgba(0,0,0,0.7)",
            borderRadius: "var(--radius-card)",
          }}
          className="animate-card-entrance"
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
};
