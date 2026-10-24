// [PERSONAL] Wellbeing Tab in My Space: Pre-test calm mode, break intervals, late-night nudges, device tips, commute mode & offline pack
"use client";

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Droplets,
  Eye,
  Smile,
  Moon,
  Laptop,
  Smartphone,
  Headphones,
  Download,
  Clock,
  Sparkles,
  Check,
  Play,
  FileText,
} from 'lucide-react';
import { usePersonalStore } from '../services/personalStore';
import { WhyPopover } from './WhyPopover';
import { detectDeviceContext, getDeviceAwareSuggestion } from '../utils/deviceContext';
import { DeviceType } from '../types';
import {
  generateOfflineHtml,
  downloadBlob,
  OfflinePackData,
} from '../utils/offlinePack';
import { getTopics, getGoalInfo, getStreakInfo, getAttempts } from '../services/dataAdapter';

export interface WellbeingTabProps {
  onShowToast?: (msg: string) => void;
  onOpenBreathe?: () => void;
  onOpenCommute?: () => void;
}

export function WellbeingTab({
  onShowToast,
  onOpenBreathe,
  onOpenCommute,
}: WellbeingTabProps) {
  const {
    store,
    updateSwitches,
    updateWellbeingSettings,
    effectiveBreakMinutes,
  } = usePersonalStore();

  const [deviceInfo, setDeviceInfo] = useState({
    deviceType: 'desktop' as DeviceType,
    isTouch: false,
    isSmallScreen: false,
  });
  const [screenWidth, setScreenWidth] = useState<number>(1200);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setDeviceInfo(detectDeviceContext());
    setScreenWidth(window.innerWidth);
  }, []);

  const deviceSuggestion = getDeviceAwareSuggestion(deviceInfo.deviceType);

  // Pre-test calm switch handler
  const handleTogglePreTestCalm = (checked: boolean) => {
    updateSwitches({ preTestCalmDefault: checked });
    onShowToast?.(
      checked
        ? 'Pre-test calm breathing enabled before quizzes.'
        : 'Pre-test calm breathing set to optional.'
    );
  };

  // Build offline pack payload
  const buildOfflinePackData = (): OfflinePackData => {
    const goal = getGoalInfo();
    const streak = getStreakInfo();
    const topics = getTopics();

    return {
      studentName: 'Thinklet Scholar',
      generatedDate: new Date().toISOString().split('T')[0],
      dailyGoalMinutes: goal.dailyMinutes || 20,
      completedMinutes: goal.todayMinutesCompleted || 0,
      streakDays: streak.currentStreak || 0,
      quests: topics.slice(0, 5).map((t) => {
        const attempts = getAttempts();
        const latest = attempts[attempts.length - 1];
        const m = latest?.topicMastery?.[t.id];
        return {
          title: `Master ${t.name}`,
          topicName: t.name,
          completed: m === 'mastered',
        };
      }),
      notes: topics.slice(0, 3).map((t) => ({
        title: `${t.name} — Core Concepts`,
        topic: t.name,
        summary: `Key review notes and high-yield foundations for ${t.name}.`,
        keyPoints: [
          `Fundamental definition and biological significance of ${t.name}.`,
          'Key equations, rates of reaction, and biochemical pathways.',
          'Common examination pitfalls and misconceptions.',
        ],
      })),
      flashcards: [
        {
          id: 'fc-1',
          topic: 'Biology',
          question: 'What is the primary role of RuBisCO in the Calvin cycle?',
          answer: 'RuBisCO catalyzes the carboxylation of ribulose-1,5-bisphosphate (RuBP) with CO2 to produce 3-PGA.',
        },
        {
          id: 'fc-2',
          topic: 'Chemistry',
          question: 'What defines Le Chatelier’s principle for dynamic equilibrium?',
          answer: 'If a dynamic equilibrium is disturbed by changing conditions, the position of equilibrium moves to counteract the change.',
        },
        {
          id: 'fc-3',
          topic: 'Physics',
          question: 'State Newton’s Second Law in terms of momentum.',
          answer: 'The rate of change of momentum of a body is directly proportional to the applied resultant force and occurs in the direction of the force.',
        },
      ],
    };
  };

  const handleDownloadHtmlPack = () => {
    setDownloading(true);
    try {
      const data = buildOfflinePackData();
      const html = generateOfflineHtml(data);
      const filename = `thinklet-offline-pack-${data.generatedDate}.html`;
      downloadBlob(html, filename, 'text/html');
      onShowToast?.('Interactive Offline Pack downloaded (.html)');
    } catch (err) {
      console.error(err);
      onShowToast?.('Failed to export offline pack.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadJsonPack = () => {
    try {
      const data = buildOfflinePackData();
      const json = JSON.stringify(data, null, 2);
      const filename = `thinklet-study-data-${data.generatedDate}.json`;
      downloadBlob(json, filename, 'application/json');
      onShowToast?.('Study data downloaded (.json)');
    } catch (err) {
      console.error(err);
      onShowToast?.('Failed to export JSON data.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Pre-Test Calm Mode Card */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[var(--text)]">Pre-Test Calm Mode</h3>
                <WhyPopover
                  reason={{
                    rule: 'Sympathetic nervous system down-regulation',
                    data: [
                      '1-minute paced breathing reduces test-induced cognitive tunnel vision',
                      'No visible numbers or timers to prevent anxiety anticipation',
                      `Active status: ${
                        store.relaxMode || store.switches.preTestCalmDefault
                          ? 'Active'
                          : 'Off'
                      }`,
                    ],
                  }}
                  title="Why Pre-Test Calm Mode"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Shows a 1-minute calming breath screen before diagnostic quizzes and practice papers.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={store.switches.preTestCalmDefault || store.relaxMode}
              disabled={store.relaxMode}
              onChange={(e) => handleTogglePreTestCalm(e.target.checked)}
              className="sr-only peer"
              aria-label="Pre-test calm mode switch"
            />
            <div className="w-10 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#98473E]" />
          </label>
        </div>

        {store.relaxMode && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Pre-Test Calm Mode is automatically ON while Relax Mode is active.</span>
          </div>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              if (onOpenBreathe) onOpenBreathe();
              else window.dispatchEvent(new CustomEvent('thinklet:open-breathe'));
            }}
            className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-soft)] text-[var(--text)] transition-colors cursor-pointer"
          >
            <span>🌬️</span>
            <span>Try 1-Minute Centering Breath Now</span>
          </button>
        </div>
      </div>

      {/* 2. Smart Break Reminders */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#A37C40]/10 text-[#A37C40]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[var(--text)]">Smart Study Break Reminders</h3>
                <WhyPopover
                  reason={{
                    rule: 'Cognitive fatigue mitigation',
                    data: [
                      `Current interval: ${effectiveBreakMinutes} minutes`,
                      'Rotates among physical stretch, hydration, and 20-20-20 eye rest',
                      `Relax mode cap: ${store.relaxMode ? '30m' : 'Standard 45m'}`,
                    ],
                  }}
                  title="Break Interval Logic"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Suggests gentle restorative breaks during continuous deep study blocks.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={store.breakSuggestionsEnabled}
              onChange={(e) =>
                updateWellbeingSettings({ breakSuggestionsEnabled: e.target.checked })
              }
              className="sr-only peer"
              aria-label="Break suggestions switch"
            />
            <div className="w-10 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#98473E]" />
          </label>
        </div>

        {/* Interval Slider */}
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text)]">Remind me every:</span>
            <span className="text-[#98473E] font-bold">
              {effectiveBreakMinutes} minutes
              {store.relaxMode && ' (Relax Mode Pacing)'}
            </span>
          </div>

          <input
            type="range"
            min="25"
            max="60"
            step="5"
            disabled={store.relaxMode}
            value={effectiveBreakMinutes}
            onChange={(e) =>
              updateWellbeingSettings({
                breakIntervalMinutes: parseInt(e.target.value, 10),
              })
            }
            aria-label="Break interval slider"
            className="w-full accent-[#98473E] cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium">
            <span>25 min (Frequent)</span>
            <span>45 min (Standard)</span>
            <span>60 min (Extended)</span>
          </div>
        </div>

        {/* 3 Rotating Break Types Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#98473E]">
              <Smile className="h-3.5 w-3.5" />
              <span>Shoulder Stretch</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug">
              Standing neck release and deep chest opener.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#52796F]">
              <Droplets className="h-3.5 w-3.5" />
              <span>Water Refresh</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug">
              Glass of cool water to replenish brain hydration.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#A37C40]">
              <Eye className="h-3.5 w-3.5" />
              <span>20-20-20 Eye Rest</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug">
              Look 20 feet away for 20 restful seconds.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Late-Night Circadian Nudge */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[var(--text)]">Late-Night Study Nudge</h3>
                <WhyPopover
                  reason={{
                    rule: 'Circadian sleep hygiene & memory consolidation',
                    data: [
                      `Active cutoff hour: ${store.lateNightHour}:00`,
                      'Limits late-night study burnout by previewing tomorrow’s plan',
                      'Never blocks screen interactions and dismissible for tonight',
                    ],
                  }}
                  title="Late-Night Care Policy"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Gentle evening reminder to finish up and preview tomorrow’s study plan.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={store.lateNightNudgeEnabled}
              onChange={(e) =>
                updateWellbeingSettings({ lateNightNudgeEnabled: e.target.checked })
              }
              className="sr-only peer"
              aria-label="Late night nudge switch"
            />
            <div className="w-10 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#98473E]" />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <label className="text-xs font-semibold text-[var(--text)]">
            Suggested wrap-up hour:
          </label>
          <select
            value={store.lateNightHour}
            onChange={(e) =>
              updateWellbeingSettings({ lateNightHour: parseInt(e.target.value, 10) })
            }
            className="text-xs py-1.5 px-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-soft)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#98473E]"
          >
            <option value={21}>9:00 PM</option>
            <option value={22}>10:00 PM</option>
            <option value={23}>11:00 PM (Default)</option>
            <option value={24}>Midnight</option>
          </select>
        </div>
      </div>

      {/* 4. Device Context Recommendation */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#52796F]/10 text-[#52796F]">
              {deviceInfo.isSmallScreen ? (
                <Smartphone className="h-4 w-4" />
              ) : (
                <Laptop className="h-4 w-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[var(--text)]">Device-Aware Recommendation</h3>
                <WhyPopover
                  reason={{
                    rule: 'Ergonomic viewport & pointer adaptation',
                    data: [
                      `Detected device: ${deviceInfo.deviceType.toUpperCase()}`,
                      `Pointer type: ${deviceInfo.isTouch ? 'Touchscreen (Coarse)' : 'Precision Cursor (Fine)'}`,
                      `Screen width: ${screenWidth}px`,
                    ],
                  }}
                  title="Device Optimization"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Workflows customized to your physical screen size and input method.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold capitalize text-[#52796F] bg-[#52796F]/10 px-2.5 py-0.5 rounded-full border border-[#52796F]/20">
            {deviceInfo.deviceType} Detected
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{deviceSuggestion.icon}</span>
            <h4 className="text-xs font-bold text-[var(--text)]">{deviceSuggestion.title}</h4>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {deviceSuggestion.description}
          </p>
          <div className="pt-2">
            <a
              href={deviceSuggestion.actionHref}
              onClick={(e) => {
                if (deviceSuggestion.actionEvent) {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent(deviceSuggestion.actionEvent));
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#98473E] text-white hover:bg-[#823C34] transition-colors shadow-xs"
            >
              <span>{deviceSuggestion.actionText}</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>

      {/* 5. Commute Mode Audio Screen */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#98473E]/10 text-[#98473E]">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[var(--text)]">Commute Audio Mode</h3>
                <WhyPopover
                  reason={{
                    rule: 'Hands-free dual-coding memory listening',
                    data: [
                      'Screen Wake Lock prevents phone display sleep',
                      'Media Session integrates with headphone skip/pause controls',
                      'Reads flashcards with automatic answer pacing',
                    ],
                  }}
                  title="Commute Mode Capabilities"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Auditory study stream for travel, walks, or resting your eyes.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Features large accessible buttons, screen wake lock, and automatic audio playback of your
          flashcards, core notes, and priority weak topics.
        </p>

        <button
          type="button"
          onClick={() => {
            if (onOpenCommute) onOpenCommute();
            else window.dispatchEvent(new CustomEvent('thinklet:open-commute'));
          }}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold bg-[#98473E] text-white hover:bg-[#823C34] transition-all shadow-sm cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Launch Commute Mode Audio Player</span>
        </button>
      </div>

      {/* 6. Self-Contained Offline Study Pack */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#A37C40]/10 text-[#A37C40]">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[var(--text)]">Offline Study Pack</h3>
                <WhyPopover
                  reason={{
                    rule: 'Zero-cloud dependency study preservation',
                    data: [
                      'Standalone single-file HTML bundle',
                      'Self-contained CSS & vanilla JS flip cards',
                      'Includes today’s plan, notes, and flashcards',
                    ],
                  }}
                  title="Offline Pack Architecture"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Download today’s complete study plan, notes, and flashcards for offline study.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Going off-grid, traveling, or studying without Wi-Fi? Download ONE lightweight HTML file
          with embedded styling and interactive flashcards. No cloud connection or service worker required.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadHtmlPack}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold bg-[#98473E] text-white hover:bg-[#823C34] transition-all shadow-sm cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Interactive Pack (.html)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJsonPack}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-medium text-[var(--text)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-soft)] transition-colors cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span>Export JSON Copy (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
