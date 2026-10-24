"use client";

import React, { useState, useEffect } from 'react';
import { Topic, PageText, Plan, PlanSession } from '../../types';
import { buildPlan, diffPlans, PlanDiff } from '../../services/plan';
import { buildInMemoryUnifiedAttempt, getUnifiedTopicMastery } from '../services/mastery';
import { getDueTodayTopics, recordTopicReview } from '../services/spaced';
import { FeaturePlanVersion } from '../types.ext';
import { getStyleSuffix } from '../promptStyle';
import { askJson } from '../../services/gemini';
import { useFeatures } from './FeaturesProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SleepyClockMascot } from '@/components/ui/illustrations';

export interface PlannerProps {
  topics: Topic[];
  pages: PageText[];
}

type PlannerView = 'today' | 'week' | 'month';

export const Planner: React.FC<PlannerProps> = ({ topics, pages }) => {
  const { store, saveStore, settings } = useFeatures();

  const [activeView, setActiveView] = useState<PlannerView>('today');
  const [examDate, setExamDate] = useState<string>(store.goal.examDate || '');
  const [dailyMinutes, setDailyMinutes] = useState<number>(store.goal.dailyMinutes || 25);
  const [loading, setLoading] = useState(false);
  const [diffComparison, setDiffComparison] = useState<{
    diff: PlanDiff;
    vOld: number;
    vNew: number;
  } | null>(null);

  // Synchronize local goal states when external store updates
  useEffect(() => {
    if (store.goal.examDate !== undefined) {
      setExamDate(store.goal.examDate || '');
    }
    if (store.goal.dailyMinutes !== undefined) {
      setDailyMinutes(store.goal.dailyMinutes);
    }
  }, [store.goal.examDate, store.goal.dailyMinutes]);

  // Five-minute revision timer
  const [revisionTimer, setRevisionTimer] = useState<number | null>(null);

  const plans = store.plans;
  const currentVersion: FeaturePlanVersion | null = plans.length > 0 ? plans[0] : null;
  const previousVersion: FeaturePlanVersion | null = plans.length > 1 ? plans[1] : null;

  // Save updated goals
  const handleSaveGoals = (newExamDate?: string, newMinutes?: number) => {
    const updatedExam = newExamDate !== undefined ? newExamDate : examDate;
    const updatedMins = newMinutes !== undefined ? newMinutes : dailyMinutes;
    setExamDate(updatedExam);
    setDailyMinutes(updatedMins);
    saveStore({
      goal: {
        ...store.goal,
        examDate: updatedExam || undefined,
        dailyMinutes: updatedMins
      }
    });
  };

  // Re-generate or adapt plan
  const handleGeneratePlan = async () => {
    setLoading(true);
    setDiffComparison(null);

    try {
      // 1. Build in-memory Attempt from unified mastery (never saved to core storage)
      const inMemoryAttempt = buildInMemoryUnifiedAttempt(topics);

      // 2. Reuse core buildPlan in plain code
      const corePlan: Plan = buildPlan(inMemoryAttempt, topics);

      // Scale durations according to dailyMinutes goal in plain code
      const ratio = dailyMinutes / 25;
      const scaledSessions = corePlan.sessions.map(s => ({
        ...s,
        durationMinutes: Math.max(10, Math.round(s.durationMinutes * ratio))
      }));

      // 3. Ask Gemini for short coaching lines per session
      const topicMap = new Map(topics.map(t => [t.id, t.name]));
      const sessionDescriptions = scaledSessions
        .slice(0, 10)
        .map(s => `Day ${s.day} (${topicMap.get(s.topicId) || s.topicId}): ${s.focus}`)
        .join('\n');

      const styleSuffix = settings ? getStyleSuffix(settings) : '';
      const prompt = `Write a short, high-yield coaching tip (max 10 words) for each of these study sessions to maximize student retention:
${sessionDescriptions}
${styleSuffix ? '\n' + styleSuffix : ''}`;

      const schema = {
        type: 'OBJECT',
        properties: {
          coachingTips: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        },
        required: ['coachingTips']
      };

      let tips: string[] = [];
      try {
        const res = await askJson<{ coachingTips: string[] }>(
          prompt,
          schema,
          v => Boolean(v && Array.isArray((v as any).coachingTips))
        );
        tips = res.coachingTips || [];
      } catch {
        tips = scaledSessions.map(() => 'Focus on verified definitions and active recall.');
      }

      const sessionsWithCoaching = scaledSessions.map((s, idx) => ({
        day: s.day,
        topicId: s.topicId,
        focus: s.focus,
        durationMinutes: s.durationMinutes,
        coachingLine: tips[idx] || 'Focus on active recall and verified keywords.',
        completed: false
      }));

      const nextVersionNum = plans.length > 0 ? plans[0].version + 1 : 1;
      const newPlanVersion: FeaturePlanVersion = {
        version: nextVersionNum,
        createdAt: Date.now(),
        reason: nextVersionNum === 1
          ? 'Initial plan created from baseline diagnostic mastery.'
          : 'Adaptively recalibrated to target your current weak topics and review schedule.',
        sessions: sessionsWithCoaching
      };

      // Compute diff if previous plan version existed
      if (currentVersion) {
        const planA: Plan = {
          id: `plan-v${currentVersion.version}`,
          createdAt: currentVersion.createdAt,
          sessions: currentVersion.sessions.map(s => ({
            day: s.day,
            topicId: s.topicId,
            focus: s.focus,
            durationMinutes: s.durationMinutes
          }))
        };
        const planB: Plan = {
          id: `plan-v${newPlanVersion.version}`,
          createdAt: newPlanVersion.createdAt,
          sessions: corePlan.sessions
        };
        const diff = diffPlans(planA, planB);
        setDiffComparison({
          diff,
          vOld: currentVersion.version,
          vNew: newPlanVersion.version
        });
      }

      saveStore({
        plans: [newPlanVersion, ...plans.slice(0, 9)]
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionComplete = (versionNum: number, sessionIdx: number) => {
    const updatedPlans = plans.map(p => {
      if (p.version !== versionNum) return p;
      const nextSessions = [...p.sessions];
      nextSessions[sessionIdx] = {
        ...nextSessions[sessionIdx],
        completed: !nextSessions[sessionIdx].completed
      };
      return { ...p, sessions: nextSessions };
    });
    saveStore({ plans: updatedPlans });
  };

  // Due topics for daily 5-minute revision
  const dueTopics = getDueTodayTopics(topics);
  const unified = getUnifiedTopicMastery(topics);
  const weakTopics = topics.filter(t => unified.find(u => u.topicId === t.id)?.mastery === 'weak');

  // Combined unique daily revision topics (due + weak)
  const dailyRevisionTopics = Array.from(
    new Map([...dueTopics, ...weakTopics].map(t => [t.id, t])).values()
  );

  const topicNameMap = new Map(topics.map(t => [t.id, t.name]));

  // Days left to exam calculation
  const [daysToExam, setDaysToExam] = useState<number | null>(null);
  useEffect(() => {
    if (examDate) {
      const target = new Date(examDate).getTime();
      const diffDays = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
      setDaysToExam(Math.max(0, diffDays));
    } else {
      setDaysToExam(null);
    }
  }, [examDate]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card & Goal Configuration */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>📅</span> Adaptive Study Planner
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Recalibrates your daily sessions dynamically as you master topics and review spaced cards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleGeneratePlan}
              disabled={loading}
              loading={loading}
              className="text-xs font-semibold"
            >
              {loading
                ? 'Adapting Schedule...'
                : plans.length > 0
                ? 'Regenerate Plan (v' + (plans[0].version + 1) + ')'
                : 'Build Plan v1'}
            </Button>
          </div>
        </div>

        {/* Goals & Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-secondary/30 border border-border text-xs">
          <div>
            <label htmlFor="plan-exam-date" className="block font-semibold text-foreground mb-1">
              Target Exam Date (Optional)
            </label>
            <Input
              id="plan-exam-date"
              type="date"
              value={examDate}
              onChange={e => handleSaveGoals(e.target.value, undefined)}
              className="w-full text-xs"
            />
            {daysToExam !== null && (
              <span className="text-[11px] font-medium text-emerald-400 mt-1 block">
                {daysToExam > 0 ? `⏳ ${daysToExam} days remaining` : 'Exam is today!'}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="plan-daily-mins" className="block font-semibold text-foreground mb-1">
              Daily Study Goal (Minutes)
            </label>
            <Input
              id="plan-daily-mins"
              type="number"
              min={10}
              max={180}
              step={5}
              value={dailyMinutes}
              onChange={e => handleSaveGoals(undefined, parseInt(e.target.value) || 25)}
              className="w-full text-xs"
            />
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Auto-scales session lengths across topics.
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Active Plan Revision
            </span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {currentVersion ? `Plan v${currentVersion.version}` : 'Not Generated'}
            </span>
            <span className="text-[11px] text-slate-400">
              {currentVersion ? `${currentVersion.sessions.length} sessions scheduled` : 'Click build to start'}
            </span>
          </div>
        </div>

        {/* Plan Diff Comparison Alert (What moved and why) */}
        {diffComparison && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold flex items-center gap-1.5">
                <span>🔄</span> Plan Recalibrated: v{diffComparison.vOld} → v{diffComparison.vNew}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                What moved & why
              </span>
            </div>
            <p className="mb-2 text-slate-700 dark:text-slate-300">
              {currentVersion?.reason}
            </p>
            {diffComparison.diff.added.length > 0 && (
              <div className="text-emerald-700 dark:text-emerald-300">
                + Added {diffComparison.diff.added.length} session(s) targeting newly detected weak topics.
              </div>
            )}
            {diffComparison.diff.removed.length > 0 && (
              <div className="text-slate-500">
                - Removed {diffComparison.diff.removed.length} session(s) as topics reached mastery.
              </div>
            )}
            {diffComparison.diff.changed.map((c, i) => (
              <div key={i} className="text-slate-600 dark:text-slate-400">• {c}</div>
            ))}
          </div>
        )}
      </div>

      {/* View Switcher: Today, Week, Month (NO yearly view per instruction) */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex space-x-2 text-xs font-semibold">
          <button
            onClick={() => setActiveView('today')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'today'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-secondary/40 text-muted-foreground border border-border hover:bg-secondary hover:text-foreground'
            }`}
          >
            Today's Focus & Daily 5m
          </button>
          <button
            onClick={() => setActiveView('week')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'week'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-secondary/40 text-muted-foreground border border-border hover:bg-secondary hover:text-foreground'
            }`}
          >
            Week View (7 Days)
          </button>
          <button
            onClick={() => setActiveView('month')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'month'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-secondary/40 text-muted-foreground border border-border hover:bg-secondary hover:text-foreground'
            }`}
          >
            Month View (Agenda)
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          Showing {activeView.toUpperCase()} view
        </span>
      </div>

      {/* TODAY VIEW: Daily 5-minute revision + Today's session */}
      {activeView === 'today' && (
        <div className="space-y-6">
          {/* Daily 5-Minute Rapid Revision of Due + Weak Topics */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                    Daily 5-Minute Micro-Revision (Due + Weak Topics)
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    Quick-fire reinforcement of {dailyRevisionTopics.length} topic(s) due for spaced review or marked weak.
                  </p>
                </div>
              </div>

              {/* Timer control */}
              <div className="flex items-center gap-2">
                {revisionTimer === null ? (
                  <button
                    onClick={() => setRevisionTimer(300)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Start 5m Timer
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-900 dark:text-amber-200">
                      {Math.floor(revisionTimer / 60)}:{(revisionTimer % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => setRevisionTimer(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* List of due + weak topics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {dailyRevisionTopics.map(t => {
                const isWeak = weakTopics.some(w => w.id === t.id);
                return (
                  <div
                    key={t.id}
                    className="p-3 bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{t.name}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{t.summary}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      {isWeak && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Weak
                        </span>
                      )}
                      <button
                        onClick={() => recordTopicReview(t.id, true)}
                        title="Mark reviewed"
                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded font-semibold border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                      >
                        ✓ Recall
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Scheduled Plan Session */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>🎯</span> Today's Core Session (Day 1)
            </h3>

            {currentVersion && currentVersion.sessions.length > 0 ? (
              <div className="space-y-3">
                {currentVersion.sessions
                  .filter(s => s.day === 1)
                  .map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        s.completed
                          ? 'bg-emerald-50/40 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800 opacity-80'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(s.completed)}
                          onChange={() => toggleSessionComplete(currentVersion.version, idx)}
                          className="w-5 h-5 mt-0.5 rounded text-[#98473E] focus:ring-[#98473E] cursor-pointer"
                        />
                        <div>
                          <h4 className={`text-sm font-bold ${s.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                            {topicNameMap.get(s.topicId) || s.topicId}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {s.focus}
                          </p>
                          {s.coachingLine && (
                            <div className="mt-2 text-[11px] font-medium text-[#98473E] dark:text-[#E8D8C6] bg-[#98473E]/10 dark:bg-[#98473E]/20 px-2.5 py-1 rounded-md border border-[#98473E]/20 dark:border-[#98473E]/40 inline-block">
                              💡 Coach: "{s.coachingLine}"
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        ⏱ {s.durationMinutes} mins
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                <div className="flex justify-center mb-3">
                  <SleepyClockMascot size="lg" className="animate-gentle-bounce" />
                </div>
                <p className="font-semibold text-sm text-[var(--text)] mb-1">No active study sessions scheduled yet</p>
                <p className="text-xs text-[var(--text-muted)]">Click &quot;Build Plan v1&quot; above to generate your personalized revision schedule.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WEEK VIEW: 7 Days Grid */}
      {activeView === 'week' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            7-Day Revision Itinerary
          </h3>

          {currentVersion ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentVersion.sessions.slice(0, 7).map((s, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex flex-col justify-between thinklet-tile-hover"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#98473E] dark:text-[#E8D8C6]">
                        Day {s.day}
                      </span>
                      <span className="text-slate-400">⏱ {s.durationMinutes}m</span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {topicNameMap.get(s.topicId) || s.topicId}
                    </div>
                    <p className="text-slate-500 mt-1">{s.focus}</p>
                  </div>
                  {s.coachingLine && (
                    <div className="mt-2 text-[11px] text-[#A37C40] dark:text-[#C49B59] italic">
                      "{s.coachingLine}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Plan not yet built.
            </div>
          )}
        </div>
      )}

      {/* MONTH VIEW: 30-Day Agenda (NO yearly view) */}
      {activeView === 'month' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>30-Day Milestone Overview</span>
            {examDate && <span className="text-xs text-[#98473E] font-semibold">Exam: {examDate}</span>}
          </h3>

          {currentVersion ? (
            <div className="space-y-2 text-xs">
              {currentVersion.sessions.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/30 thinklet-tile-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 font-bold text-slate-500">Day {s.day}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {topicNameMap.get(s.topicId) || s.topicId}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">— {s.focus}</span>
                  </div>
                  <span className="font-mono text-slate-500">{s.durationMinutes}m</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Build a plan to see your 30-day allocation.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
