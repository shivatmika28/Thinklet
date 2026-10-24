"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Topic, PageText } from '../../types';
import { getDueTodayTopics } from '../services/spaced';
import { getUnifiedTopicMastery } from '../services/mastery';
import {
  speakText,
  stopSpeaking,
  isSpeechSynthesisSupported,
  generate60SecondReviewScript
} from '../utils/speech';
import { useFeatures } from './FeaturesProvider';
import { useMaterial } from '@/context/MaterialContext';
import { recordStudySession } from '../services/featureStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';

export interface StudyTrackerProps {
  topics: Topic[];
  pages: PageText[];
}

export const StudyTracker: React.FC<StudyTrackerProps> = ({ topics, pages }) => {
  const { store, saveStore } = useFeatures();
  const { activeMaterial } = useMaterial();

  // Focus Timer state
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // In-app reminder banner dismiss state
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // Voice Review Audio state
  const [audioScript, setAudioScript] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Update streak logic on open
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const streak = store.streak;
    const last = streak.lastActiveDate;

    if (last !== todayStr) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newCurrent = streak.currentStreak;

      if (last === yesterday) {
        newCurrent += 1;
      } else if (!last) {
        newCurrent = 1;
      } else {
        newCurrent = 1; // Missed a day
      }

      const newLongest = Math.max(streak.longestStreak, newCurrent);
      saveStore({
        streak: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastActiveDate: todayStr
        },
        goal: {
          ...store.goal,
          todayMinutesCompleted: store.goal.lastGoalDate === todayStr ? store.goal.todayMinutesCompleted : 0,
          lastGoalDate: todayStr
        }
      });
    }
  }, []);

  // Focus Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            handleSessionComplete(timerMinutes);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMinutes]);

  const handleSessionComplete = (minutes: number) => {
    recordStudySession(minutes, 'focus_timer', activeMaterial?.id);
  };

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleResetTimer = (mins: number = timerMinutes) => {
    setIsTimerRunning(false);
    setTimerMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  // Due topics for reminder
  const dueTopics = getDueTodayTopics(topics);
  const isGoalUnmet = store.goal.todayMinutesCompleted < store.goal.dailyMinutes;
  const showReminder = !reminderDismissed && (isGoalUnmet || dueTopics.length > 0);

  // Light XP calculation: 10 XP per minute completed + 50 XP per paper + 20 XP per answer check
  const totalXP =
    store.goal.todayMinutesCompleted * 10 +
    store.practicePapers.length * 50 +
    store.answerChecks.length * 20;

  const level =
    totalXP >= 600 ? 'Level 4: Master' :
    totalXP >= 300 ? 'Level 3: Scholar' :
    totalXP >= 100 ? 'Level 2: Apprentice' : 'Level 1: Novice';

  // Weak topics for 60-second review
  const unified = getUnifiedTopicMastery(topics);
  const weakTopics = topics.filter(t => unified.find(u => u.topicId === t.id)?.mastery === 'weak');

  const handleGenerateAndPlayAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const script = await generate60SecondReviewScript(weakTopics, pages, store.settings.language);
      setAudioScript(script);
      setIsPlayingAudio(true);
      await speakText(script, store.settings.language);
      setIsPlayingAudio(false);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
  };

  // Plan items from active plan
  const activePlan = store.plans[0] || null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* IN-APP REMINDER BANNER ONLY (No push notifications) */}
      {showReminder && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between shadow-xs text-xs text-foreground">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <div>
              <span className="font-bold block">In-App Study Reminder:</span>
              <span className="text-muted-foreground">
                {isGoalUnmet && `Daily goal: ${store.goal.todayMinutesCompleted}/${store.goal.dailyMinutes} mins completed. `}
                {dueTopics.length > 0 && `${dueTopics.length} spaced repetition topic(s) due for recall today!`}
              </span>
            </div>
          </div>
          <button
            onClick={() => setReminderDismissed(true)}
            className="px-2.5 py-1 text-muted-foreground hover:text-foreground rounded font-medium cursor-pointer"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Main Focus & Habit Dashboard */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>⏱️</span> Study Tracker, Streaks & Focus Timer
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Maintain daily study streaks, run countdown study intervals, and listen to 60-second audio summaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 font-medium">
              {level} · {totalXP} XP
            </Badge>
          </div>
        </div>

        {/* Streaks & Daily Goal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Daily Streak */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Active Streak
            </span>
            <div className="text-3xl font-black text-foreground flex items-center gap-1.5">
              <span>🔥</span> {store.streak.currentStreak}
              <span className="text-xs font-normal text-muted-foreground">day(s)</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Longest: {store.streak.longestStreak} days
            </span>
          </div>

          {/* Daily Minutes Goal */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Daily Focus Goal
            </span>
            <div className="text-3xl font-black text-foreground">
              {store.goal.todayMinutesCompleted}
              <span className="text-xs font-normal text-muted-foreground"> / {store.goal.dailyMinutes} mins</span>
            </div>
            <div className="mt-3">
              <Progress
                value={Math.min(100, (store.goal.todayMinutesCompleted / store.goal.dailyMinutes) * 100)}
                className="h-1.5"
              />
            </div>
          </div>

          {/* Practice Sessions */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Evaluated Sessions
            </span>
            <div className="text-3xl font-black text-foreground">
              {store.practicePapers.length + store.answerChecks.length}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              {store.practicePapers.length} papers · {store.answerChecks.length} checks
            </span>
          </div>
        </div>

        {/* FOCUS COUNTDOWN TIMER */}
        <div className="p-6 bg-secondary/20 border border-border rounded-xl text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {[15, 25, 45].map(mins => (
              <Button
                key={mins}
                variant={timerMinutes === mins ? "default" : "outline"}
                size="sm"
                type="button"
                onClick={() => handleResetTimer(mins)}
                className="h-8 text-xs font-medium"
              >
                {mins} mins
              </Button>
            ))}
          </div>

          <div className="text-5xl font-mono font-bold text-foreground tracking-wider">
            {Math.floor(secondsRemaining / 60).toString().padStart(2, '0')}:
            {(secondsRemaining % 60).toString().padStart(2, '0')}
          </div>

          <div className="flex items-center justify-center gap-3">
            {!isTimerRunning ? (
              <Button
                variant="default"
                size="default"
                onClick={handleStartTimer}
                className="text-xs font-semibold"
              >
                ▶ Start Focus Session
              </Button>
            ) : (
              <Button
                variant="outline"
                size="default"
                onClick={handlePauseTimer}
                className="text-xs font-semibold"
              >
                ⏸ Pause
              </Button>
            )}

            <Button
              variant="secondary"
              size="default"
              onClick={() => handleResetTimer()}
              className="text-xs font-medium"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* 60-SECOND AUDIO WEAK TOPICS REVIEW (Voice SpeechSynthesis) */}
        <div className="p-5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <span>🎧</span> 60-Second Audio Review (Weak Topics)
              </h3>
              <p className="text-xs text-purple-800 dark:text-purple-300">
                AI synthesizes a rapid 60s spoken briefing from your weak topics. Spoken in {store.settings.language}.
              </p>
            </div>

            <div className="flex gap-2">
              {!isPlayingAudio ? (
                <button
                  onClick={handleGenerateAndPlayAudio}
                  disabled={isGeneratingAudio}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>▶</span> {isGeneratingAudio ? 'Synthesizing...' : 'Play 60s Briefing'}
                </button>
              ) : (
                <button
                  onClick={handleStopAudio}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  ■ Stop Audio
                </button>
              )}
            </div>
          </div>

          {audioScript && (
            <div className="p-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
              "{audioScript}"
            </div>
          )}
        </div>

        {/* ACTIVE PLAN CHECKLIST WITH TIMERS */}
        {activePlan && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Plan Day 1 Tasks (Plan v{activePlan.version})
            </h3>
            <div className="space-y-2">
              {activePlan.sessions.slice(0, 4).map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(s.completed)}
                      onChange={() => {
                        const updated = activePlan.sessions.map((item, i) =>
                          i === idx ? { ...item, completed: !item.completed } : item
                        );
                        saveStore({
                          plans: [{ ...activePlan, sessions: updated }, ...store.plans.slice(1)]
                        });
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={s.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800 dark:text-slate-200 font-semibold'}>
                      {s.focus}
                    </span>
                  </div>
                  <span className="font-mono text-slate-400">{s.durationMinutes}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
