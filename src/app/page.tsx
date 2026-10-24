"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useMaterial } from "@/context/MaterialContext";
import { useFeatures } from "@/features/components/FeaturesProvider";
import {
  BookOpen,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Check,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Calendar,
  Layers,
  Timer,
  Flame,
  Clock,
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  Bell,
  Command,
  FileText,
  GraduationCap,
  Menu,
  Home,
} from "lucide-react";
import { RevisionTaskItem, QuizAttemptSummary, TopicItem } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { SettingsPanel } from "@/features/components/SettingsPanel";
import { StudyBuddyMascot } from "@/components/ui/StudyBuddyMascot";
import { DailyStudyProgressBarGraph } from "@/components/ui/DailyStudyProgressBarGraph";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { RelaxButton, logSessionStart, logSessionStop, logQuestCompleted, triggerCelebration, loadPersonalStore, recordMascotMemory, resolveMascotSpeech, speakMascotLine, MascotOutfitOverlay, detectDeviceContext, markCheerDelivered } from "@/features/personal"; // [PERSONAL]
import { recordStudySession } from "@/features/services/featureStore";
import { CuteBookMascot, CuriousPencilMascot } from "@/components/ui/illustrations";

function useCountUp(target: number, duration: number = 450, enabled: boolean = true): number {
  const [value, setValue] = useState<number>(() => (enabled ? 0 : target));
  const prevTargetRef = useRef<number>(target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const startVal = prevTargetRef.current !== target ? prevTargetRef.current : 0;
    prevTargetRef.current = target;
    if (startVal === target) {
      setValue(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * easeOut));
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration, enabled]);

  return value;
}

export default function DashboardPage() {
  const { activeMaterial, activeMaterialId, materials, loadDemoMaterial, setActiveMaterialId } = useMaterial();
  const { store, settings } = useFeatures();
  const [materialDetail, setMaterialDetail] = useState<{
    topics: TopicItem[];
    quizAttempts: QuizAttemptSummary[];
    revisionTasks: RevisionTaskItem[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [topicQuery, setTopicQuery] = useState("");
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<string[]>([]);
  const [taskNotice, setTaskNotice] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Pomodoro Dial Widget State
  const [timerSelectedPreset, setTimerSelectedPreset] = useState<number>(25);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Interactive Mascot State
  const [recentlyFinishedSprint, setRecentlyFinishedSprint] = useState(false);
  const [recentlyCompletedTask, setRecentlyCompletedTask] = useState(false);
  const [mascotTip, setMascotTip] = useState<string | null>(null);
  const [mascotTipReason, setMascotTipReason] = useState<any>(null); // [PERSONAL]
  const [tipIndex, setTipIndex] = useState(0);
  const lastAutoTipTimeRef = useRef<number>(0);
  useEffect(() => { if ((store.streak.currentStreak || 0) >= 3) recordMascotMemory('streak_milestone', `${store.streak.currentStreak}-Day Streak`, `Maintained study habit for ${store.streak.currentStreak} consecutive days!`); }, [store.streak.currentStreak]); // [PERSONAL]

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setRecentlyFinishedSprint(true);
            setTimeout(() => setRecentlyFinishedSprint(false), 5000);
            recordStudySession(
              timerSelectedPreset,
              "sprint",
              activeMaterialId || undefined,
              "Completed Focus Sprint"
            );
            logSessionStop(timerSelectedPreset, activeMaterialId || undefined); // [PERSONAL]
            triggerCelebration(loadPersonalStore().relaxMode ? "subtle" : loadPersonalStore().switches.celebrationIntensity, "Focus Sprint Cleared! 🌟"); // [PERSONAL]
            recordMascotMemory('sprint_champion', 'Focus Sprint Complete', `Completed a ${timerSelectedPreset}-minute focused study block.`); // [PERSONAL]
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSelectedPreset, activeMaterialId]);

  const handleSelectPreset = (minutes: number) => {
    setTimerSelectedPreset(minutes);
    setTimerSecondsLeft(minutes * 60);
    setIsTimerRunning(false);
  };

  const handleStartSprint = () => {
    setIsTimerRunning(true);
    logSessionStart(activeMaterialId || undefined); // [PERSONAL]
  };

  const handleLogSprintEarly = () => {
    const elapsedSeconds = timerSelectedPreset * 60 - timerSecondsLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    recordStudySession(
      elapsedMinutes,
      "sprint",
      activeMaterialId || undefined,
      "Logged focus sprint"
    );
    logSessionStop(elapsedMinutes, activeMaterialId || undefined); // [PERSONAL]
    setIsTimerRunning(false);
    setTimerSecondsLeft(timerSelectedPreset * 60);
  };

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    setTopicQuery("");
    setShowAllTopics(false);
    setTaskNotice(null);
    if (!activeMaterial?.id) {
      setMaterialDetail(null);
      setLoadingDetail(false);
      return;
    }

    const controller = new AbortController();
    setMaterialDetail(null);
    setLoadingDetail(true);
    fetch(`/api/materials/${activeMaterial.id}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.material) {
          setMaterialDetail({
            topics: data.material.topics || [],
            quizAttempts: data.material.quizAttempts || [],
            revisionTasks: data.material.revisionTasks || [],
          });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) console.error("Failed to load material detail:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingDetail(false);
      });

    return () => controller.abort();
  }, [activeMaterial?.id]);

  const pendingTasks = materialDetail?.revisionTasks.filter((t) => t.status === "PENDING") || [];
  const completedTasks = materialDetail?.revisionTasks.filter((t) => t.status === "COMPLETED") || [];
  const totalTasksCount = pendingTasks.length + completedTasks.length;
  const visibleRevisionTasks = [...pendingTasks, ...completedTasks].slice(0, 5);
  const topics = materialDetail?.topics || [];
  const matchingTopics = topics.filter((topic) =>
    `${topic.name} ${topic.description}`.toLowerCase().includes(topicQuery.trim().toLowerCase())
  );
  const isSearchingTopics = topicQuery.trim().length > 0;
  const visibleTopics = isSearchingTopics || showAllTopics ? matchingTopics : matchingTopics.slice(0, 4);

  // Dynamic Real-Data XP & Scholar Level Calculation
  const totalXP =
    (materialDetail?.quizAttempts || []).reduce((acc, q) => acc + q.score * 10, 0) +
    completedTasks.length * 25 +
    (store.goal.todayMinutesCompleted || 0) * 5;
  const scholarLevel = Math.max(1, Math.floor(totalXP / 200) + 1);
  const xpTowardsNextLevel = totalXP % 200;
  const xpPercent = Math.min(100, Math.round((xpTowardsNextLevel / 200) * 100));

  // Focus sprint calculation
  const sprintElapsedSeconds = timerSelectedPreset * 60 - timerSecondsLeft;
  const sprintProgressPercent = Math.min(100, Math.round((sprintElapsedSeconds / (timerSelectedPreset * 60)) * 100));

  const handleToggleTask = async (taskId: string, currentStatus: "PENDING" | "COMPLETED") => {
    if (updatingTaskIds.includes(taskId)) return;
    const newStatus = currentStatus === "PENDING" ? "COMPLETED" : "PENDING";
    setUpdatingTaskIds((current) => [...current, taskId]);
    setTaskNotice(null);
    setMaterialDetail((current) =>
      current
        ? {
            ...current,
            revisionTasks: current.revisionTasks.map((task) =>
              task.id === taskId ? { ...task, status: newStatus } : task
            ),
          }
        : current
    );

    try {
      const res = await fetch(`/api/revision/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update task");
      if (newStatus === "COMPLETED") {
        setRecentlyCompletedTask(true);
        setTimeout(() => setRecentlyCompletedTask(false), 4500);
        logQuestCompleted(taskId); // [PERSONAL]
        triggerCelebration(loadPersonalStore().relaxMode ? "subtle" : loadPersonalStore().switches.celebrationIntensity, "Quest Completed! ✨"); // [PERSONAL]
        const doneTask = materialDetail?.revisionTasks.find((t) => t.id === taskId); if (doneTask) recordMascotMemory('topic_mastered', `Quest: ${doneTask.topicName}`, `Mastered revision quest on ${doneTask.topicName}.`, doneTask.topicName, activeMaterialId || undefined); // [PERSONAL]
      }
      setTaskNotice(newStatus === "COMPLETED" ? "Task completed! ✨" : "Moved task back to pending.");
    } catch (err) {
      console.error("Failed to update task:", err);
      setMaterialDetail((current) =>
        current
          ? {
              ...current,
              revisionTasks: current.revisionTasks.map((task) =>
                task.id === taskId ? { ...task, status: currentStatus } : task
              ),
            }
          : current
      );
      setTaskNotice("Couldn't update that task. Please try again.");
    } finally {
      setUpdatingTaskIds((current) => current.filter((id) => id !== taskId));
    }
  };

  const handleOpenQuickActions = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-quick-actions"));
    }
  };

  // Micro-interaction animated counts for dashboard metrics
  const animatedEnabled = settings.enableAnimations !== false;
  const countMinutes = useCountUp(store.goal.todayMinutesCompleted || 0, 450, animatedEnabled);
  const countCompletedTasks = useCountUp(completedTasks.length, 450, animatedEnabled);
  const countStreak = useCountUp(store.streak.currentStreak || 0, 450, animatedEnabled);
  const countLevel = useCountUp(scholarLevel, 450, animatedEnabled);

  // Exam countdown
  const [examDaysLeft, setExamDaysLeft] = useState<number | null>(null);
  useEffect(() => {
    if (store.goal.examDate) {
      setExamDaysLeft(
        Math.max(0, Math.ceil((new Date(store.goal.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      );
    } else {
      setExamDaysLeft(null);
    }
  }, [store.goal.examDate]);

  // Contextual Mascot Tips & Mood System
  const getContextualTips = () => {
    const tips: string[] = [];
    if (isTimerRunning) {
      tips.push("Focus Sprint active! Let's eliminate all distractions for the next few minutes. 🎯");
    }
    if (store.goal.todayMinutesCompleted >= (store.goal.dailyMinutes || 20) && store.goal.todayMinutesCompleted > 0) {
      tips.push(`Daily goal achieved (${store.goal.todayMinutesCompleted}m)! Outstanding study momentum today! 🌟`);
    } else if (store.goal.todayMinutesCompleted > 0) {
      const remaining = Math.max(1, (store.goal.dailyMinutes || 20) - store.goal.todayMinutesCompleted);
      tips.push(`${remaining}m left to hit today's daily goal. You're making great progress!`);
    }
    if (pendingTasks.length > 0) {
      tips.push(`You have ${pendingTasks.length} revision quest${pendingTasks.length > 1 ? 's' : ''} waiting! Let's clear "${pendingTasks[0].topicName}" next.`);
    }
    if ((store.streak.currentStreak || 0) > 1) {
      tips.push(`${store.streak.currentStreak}-day study streak! Daily consistency is the secret to mastery.`);
    }
    if (examDaysLeft !== null) {
      tips.push(`Target exam in ${examDaysLeft} days! Reviewing priority cards today will solidify your foundation.`);
    }
    tips.push("Active recall tip: Testing yourself with flashcards is 40% more effective than passive re-reading.");
    tips.push("A 25-minute sprint with 5-minute pauses keeps your mind sharp and energized.");
    return tips;
  };

  const handleMascotClick = () => {
    if (settings.enableMascotTips === false) return;
    const pStore = loadPersonalStore(); // [PERSONAL]
    const unreadCheer = pStore.cheerNotes?.find((c) => !c.delivered); // [PERSONAL]
    const speech = resolveMascotSpeech({ personality: pStore.personality, memories: pStore.mascotMemories, relaxMode: pStore.relaxMode, streak: store.streak.currentStreak || 0, todayMinutes: store.goal.todayMinutesCompleted || 0, dailyMinutesGoal: store.goal.dailyMinutes || 20, pendingTasksCount: pendingTasks.length, isTimerRunning, deviceType: detectDeviceContext().deviceType, cheerNote: unreadCheer }); // [PERSONAL]
    if (unreadCheer) markCheerDelivered(unreadCheer.id); // [PERSONAL]
    setMascotTip(speech.text);
    setMascotTipReason(speech.reason); // [PERSONAL]
    if (pStore.personality.voiceEnabled) speakMascotLine(speech.voiceText || speech.text, { language: pStore.personality.language, speed: pStore.personality.voiceSpeed, voiceName: pStore.personality.selectedVoiceName }); // [PERSONAL]
    lastAutoTipTimeRef.current = Date.now();
  };

  useEffect(() => {
    if (settings.enableMascotTips === false) return;
    const now = Date.now();
    if (now - lastAutoTipTimeRef.current < 30000) return;

    const timer = setTimeout(() => {
      const pStore = loadPersonalStore(); // [PERSONAL]
      const unreadCheer = pStore.cheerNotes?.find((c) => !c.delivered); // [PERSONAL]
      const speech = resolveMascotSpeech({ personality: pStore.personality, memories: pStore.mascotMemories, relaxMode: pStore.relaxMode, streak: store.streak.currentStreak || 0, todayMinutes: store.goal.todayMinutesCompleted || 0, dailyMinutesGoal: store.goal.dailyMinutes || 20, pendingTasksCount: pendingTasks.length, isTimerRunning, deviceType: detectDeviceContext().deviceType, cheerNote: unreadCheer }); // [PERSONAL]
      if (unreadCheer) markCheerDelivered(unreadCheer.id); // [PERSONAL]
      if (!mascotTip) {
        setMascotTip(speech.text);
        setMascotTipReason(speech.reason); // [PERSONAL]
        if (pStore.personality.voiceEnabled) speakMascotLine(speech.voiceText || speech.text, { language: pStore.personality.language, speed: pStore.personality.voiceSpeed, voiceName: pStore.personality.selectedVoiceName }); // [PERSONAL]
        lastAutoTipTimeRef.current = Date.now();
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [settings.enableMascotTips]);

  let mascotMood: "wave" | "happy" | "thinking" | "celebrating" | "studying" | "sleepy" | "focused" = "wave";
  if (isTimerRunning) {
    mascotMood = "focused";
  } else if (recentlyFinishedSprint || recentlyCompletedTask) {
    mascotMood = loadPersonalStore().switches.celebrationIntensity === "off" ? "happy" : "celebrating"; // [PERSONAL]
  } else if ((store.goal.todayMinutesCompleted || 0) === 0 && (store.streak.currentStreak || 0) === 0) {
    mascotMood = "sleepy";
  } else if ((store.streak.currentStreak || 0) >= 3) {
    mascotMood = "celebrating";
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground pb-24 md:pb-12">
      {/* 1. Header (Thinklet Navigation Bar) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open-drawer"));
              }
            }}
            aria-label="Open navigation menu"
            className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)] cursor-pointer text-[var(--text-muted)]"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            <div className="shrink-0">
              <StudyBuddyMascot mood="wave" size="xs" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-[var(--text)] font-['Quicksand',sans-serif]">
              Thinklet
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />

          {/* Dynamic Scholar Badge */}
          <Badge variant="secondary" className="gap-1.5 font-bold hidden sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-[#98473E]" />
            <span>Level {scholarLevel} Scholar</span>
          </Badge>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Material Switcher Select */}
          {materials.length > 0 && (
            <div className="hidden sm:flex items-center">
              <select
                value={activeMaterialId || ""}
                onChange={(e) => setActiveMaterialId(e.target.value)}
                className="h-8.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)] shadow-xs outline-none focus:ring-2 focus:ring-[#98473E] cursor-pointer max-w-[200px] truncate"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Actions Search Trigger Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenQuickActions}
            className="hidden sm:inline-flex gap-2 text-[var(--text-muted)] h-8.5 text-xs font-medium"
          >
            <Search className="h-3.5 w-3.5 text-[#98473E]" />
            <span>Quick search...</span>
            <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-1.5 font-mono text-[10px] font-semibold text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </Button>

          {/* Settings Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            className="h-8.5 w-8.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="h-8.5 w-8.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] relative"
          >
            <Bell className="h-4 w-4" />
            {pendingTasks.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#98473E]" />
            )}
          </Button>

          {/* Relax Mode & My Space */}
          <RelaxButton /> {/* [PERSONAL] */}

          {/* Theme Mode Toggle (Light / Dark / System) */}
          <ThemeToggle />

          {/* User Avatar */}
          <div
            title={`${totalXP} total XP • ${xpTowardsNextLevel}/200 to Level ${scholarLevel + 1}`}
            className="h-8 w-8 rounded-full bg-gradient-to-br from-[#98473E] to-[#A37C40] border border-white/40 shadow-sm flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-105 transition-transform"
          >
            L{scholarLevel}
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Cute Claymorphic Welcome Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-raised)] to-[var(--surface-hover)] border border-[var(--border)] shadow-[var(--shadow)] thinklet-card-hover animate-card-entrance">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="shrink-0 p-1.5 rounded-2xl bg-[var(--mascot-tile-bg)] border border-[var(--mascot-tile-border)] shadow-[0_4px_12px_rgba(3,64,120,0.06)] relative">
                <StudyBuddyMascot
                  mood={mascotMood}
                  size="lg"
                  withSparkles={true}
                  interactive={true}
                  speechTip={mascotTip}
                  speechTipReason={mascotTipReason} // [PERSONAL]
                  onTipDismiss={() => setMascotTip(null)}
                  onMascotClick={handleMascotClick}
                  showAiTutorLink={true}
                />
                <MascotOutfitOverlay outfit={loadPersonalStore().mascotOutfit} /> {/* [PERSONAL] */}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#98473E] bg-[var(--surface-hover)] px-2.5 py-0.5 rounded-full border border-[var(--border-soft)]">
                    Study Companion
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-medium hidden sm:inline">
                    Daily Focus Flow
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)] font-['Quicksand',sans-serif]">
                  Welcome back to Thinklet!
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-xl leading-relaxed">
                  Your personalized study flow is ready. {pendingTasks.length > 0 ? `${pendingTasks.length} revision quests pending.` : "All quests cleared for now!"} Let's build mastery together.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link href="/tutorial" className="no-underline">
                <Button variant="outline" size="sm">
                  Tutorial Guide
                </Button>
              </Link>
              <Link href="/materials" className="no-underline">
                <Button variant="default" size="sm" icon={<Sparkles className="h-3.5 w-3.5 text-amber-200" />}>
                  Upload Notes
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. 4-Card Metrics Grid (Standard shadcn Dashboard Metric Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Metric 1: Study Time */}
          <Card className="group h-full flex flex-col justify-between rounded-2xl animate-card-entrance" style={{ animationDelay: "40ms" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Study Time Today
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground group-hover:scale-110 group-hover:text-[#98473E] transition-all duration-200" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-0">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {countMinutes}m
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Goal: {store.goal.dailyMinutes || 20}m daily
                </p>
              </div>
              <div className="mt-3">
                <Progress
                  value={Math.min(100, Math.round(((store.goal.todayMinutesCompleted || 0) / (store.goal.dailyMinutes || 20)) * 100))}
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Metric 2: Tasks Cleared */}
          <Card className="group h-full flex flex-col justify-between rounded-2xl animate-card-entrance" style={{ animationDelay: "80ms" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quests Cleared
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground group-hover:scale-110 group-hover:text-[#98473E] transition-all duration-200" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-0">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {countCompletedTasks}/{totalTasksCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingTasks.length} quests pending
                </p>
              </div>
              <div className="mt-3">
                <Progress
                  value={totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0}
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Metric 3: Flow Streak */}
          <Card
            className="group h-full flex flex-col justify-between rounded-2xl animate-card-entrance !border-2 !border-[#A95749] !bg-[#F3E1D5]"
            style={{
              animationDelay: "120ms",
              backgroundColor: "#F3E1D5",
              borderColor: "#A95749",
              borderWidth: "2px",
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Study Streak
              </CardTitle>
              <Flame className={`h-4 w-4 text-amber-500 group-hover:scale-110 group-hover:text-amber-400 transition-all duration-200 ${store.streak.currentStreak > 0 ? "animate-flame-pulse" : ""}`} />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-0">
              <div>
                <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <span>{countStreak}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {countStreak === 1 ? "day" : "days"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {store.streak.currentStreak > 0 ? "Momentum active" : "Start a session today"}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={store.streak.currentStreak > 0 ? "success" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                  {store.streak.currentStreak > 0 ? "Active Flow" : "Ready"}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Best: {Math.max(store.streak.currentStreak, store.streak.longestStreak || 0)}d
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Metric 4: Scholar XP */}
          <Card className="group h-full flex flex-col justify-between rounded-2xl animate-card-entrance" style={{ animationDelay: "160ms" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Scholar Level
              </CardTitle>
              <Sparkles className="h-4 w-4 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-all duration-200" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-0">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  Level {countLevel}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalXP} total XP earned
                </p>
              </div>
              <div className="mt-3">
                <Progress value={xpPercent} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Two-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Study Progress Bar Graph (Real-data, Week/Month Filters, Interactive Tooltips) */}
            <div className="animate-card-entrance" style={{ animationDelay: "200ms" }}>
              <DailyStudyProgressBarGraph onStartSprint={handleStartSprint} />
            </div>

            {/* Focus Sprint & Pomodoro Dial - Compact & Streamlined */}
            <Card
              variant="navy"
              className={`rounded-3xl overflow-hidden animate-card-entrance transition-all duration-300 ${
                isTimerRunning ? "animate-sprint-running" : ""
              }`}
              style={{ animationDelay: "240ms" }}
            >
              <CardHeader className="flex flex-row items-center justify-between py-2 px-4 sm:px-5 text-white border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-[#98473E]/30 border border-[#98473E]/50 flex items-center justify-center text-[#F7EFE5]">
                    <Timer className="h-3.5 w-3.5" />
                  </div>
                  <CardTitle className="text-xs sm:text-sm font-bold font-['Quicksand',sans-serif] text-white flex items-center gap-2">
                    Focus Sprint
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {sprintElapsedSeconds > 60 && (
                    <button
                      type="button"
                      onClick={handleLogSprintEarly}
                      className="text-[11px] font-bold text-[#C49B59] hover:underline cursor-pointer"
                    >
                      ✓ Log {Math.max(1, Math.round(sprintElapsedSeconds / 60))}m Now
                    </button>
                  )}
                  <Link href="/tracker" className="text-[11px] text-[#D0BFB2] hover:text-white transition-colors font-semibold no-underline">
                    Full Tracker →
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 p-3 sm:px-4 sm:py-3">
                {/* Horizontal Streamlined Sprint Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 sm:px-3 rounded-xl bg-black/25 border border-white/10 shadow-inner">
                  {/* Left: Presets Mini-Pills */}
                  <div className="flex items-center gap-1">
                    {[15, 25, 45, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSelectPreset(mins)}
                        className={`h-6 px-2 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                          timerSelectedPreset === mins
                            ? "bg-[#98473E] text-white shadow-xs"
                            : "text-white/70 bg-white/10 hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>

                  {/* Center: Scaled Timer Digits */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white drop-shadow">
                      {formatTimerDisplay(timerSecondsLeft)}
                    </span>
                    <span className="text-[10px] text-[#EFFCFB]/70 hidden md:inline">
                      {isTimerRunning ? "• in progress" : "• paused"}
                    </span>
                  </div>

                  {/* Right: Streamlined Start/Pause/Reset Controls */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant={isTimerRunning ? "secondary" : "accent"}
                      size="sm"
                      onClick={() => setIsTimerRunning((prev) => !prev)}
                      className="gap-1 px-3 h-7 text-[11px] font-bold rounded-full"
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="h-3 w-3" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          <span>Start</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSecondsLeft(timerSelectedPreset * 60);
                      }}
                      aria-label="Reset timer"
                      className="h-7 w-7 p-0 rounded-full text-white/80 hover:text-white hover:bg-white/15"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Compact Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#EFFCFB]/70">
                    <span>Sprint progress ({timerSelectedPreset}m target)</span>
                    <span className="font-semibold text-white">{sprintProgressPercent}%</span>
                  </div>
                  <Progress value={sprintProgressPercent} className="h-1 bg-white/15" indicatorClassName="bg-[#98473E]" />
                </div>
              </CardContent>
            </Card>

            {/* Today's Quest Log & Tasks */}
            <Card className="rounded-3xl animate-card-entrance" style={{ animationDelay: "280ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold font-['Quicksand',sans-serif] text-[var(--text)] flex items-center gap-2">
                    <CheckSquare className="h-4.5 w-4.5 text-[#98473E]" />
                    <span>Today's Quest Log</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-[var(--text-muted)]">
                    Priority-ordered revision tasks with source citations
                  </CardDescription>
                </div>
                <Link href="/revision" className="text-xs text-[#98473E] hover:text-[var(--text)] font-semibold no-underline">
                  All Quests →
                </Link>
              </CardHeader>

              <CardContent className="space-y-3 pt-4">
                {taskNotice && (
                  <div className="p-3 rounded-xl text-xs font-semibold bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border-soft)] shadow-xs">
                    {taskNotice}
                  </div>
                )}

                {visibleRevisionTasks.length > 0 ? (
                  <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-xs">
                    {visibleRevisionTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3.5 p-4 thinklet-row-hover ${
                          task.status === "COMPLETED" ? "bg-[var(--surface-hover)]/40" : "bg-[var(--surface)]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id, task.status)}
                          aria-label={`Mark task ${task.topicName} as ${task.status === "COMPLETED" ? "pending" : "completed"}`}
                          className={`mt-0.5 h-5 w-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 hover:scale-110 active:scale-95 ${
                            task.status === "COMPLETED"
                              ? "bg-[#98473E] border-[#98473E] text-white shadow-xs"
                              : "border-[var(--border)] bg-[var(--surface)] hover:border-[#98473E] shadow-inner"
                          }`}
                        >
                          {task.status === "COMPLETED" && <Check className="h-3.5 w-3.5 stroke-[3] animate-check-pop" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs sm:text-sm font-bold text-[var(--text)] truncate font-['Quicksand',sans-serif]">
                              {task.topicName}
                            </span>
                            <Badge
                              variant={task.priority === "HIGH" ? "destructive" : "secondary"}
                              className="text-[10px] px-2 py-0.5"
                            >
                              {task.priority === "HIGH" ? "High Priority" : "Medium"}
                            </Badge>
                          </div>
                          <p
                            className={`text-xs text-[var(--text-muted)] leading-relaxed ${
                              task.status === "COMPLETED" ? "line-through opacity-60" : ""
                            }`}
                          >
                            {task.recommendedActivity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
                    <div className="flex justify-center mb-3">
                      <CuriousPencilMascot size="lg" className="animate-gentle-bounce" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text)] mb-1 font-['Quicksand',sans-serif]">
                      No active quests yet!
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mb-4 max-w-sm mx-auto">
                      Load demo material or take a quiz to populate your personalized revision quest log.
                    </p>
                    <div className="flex items-center justify-center gap-2.5">
                      <Button variant="default" size="sm" onClick={() => loadDemoMaterial()}>
                        Load Demo Material
                      </Button>
                      <Link href="/quiz" className="no-underline">
                        <Button variant="outline" size="sm">
                          Take Quiz
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col on lg) */}
          <div className="space-y-6">
            {/* Quick Actions Hero Capsule Card */}
            <Card className="rounded-3xl border-[var(--border)] bg-[var(--surface)] animate-card-entrance" style={{ animationDelay: "320ms" }}>
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#98473E]" />
                  <span>AI Learning Suite</span>
                </CardTitle>
                <CardDescription className="text-xs text-[var(--text-muted)]">
                  Instant access to study modules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenQuickActions}
                  className="w-full justify-between h-9.5 text-xs font-semibold rounded-full"
                >
                  <span className="flex items-center gap-2">
                    <Command className="h-3.5 w-3.5 text-[#98473E]" />
                    <span>Open Command Palette</span>
                  </span>
                  <kbd className="h-4.5 px-1.5 font-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-hover)] rounded-full">⌘K</kbd>
                </Button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link href="/flashcards" className="no-underline">
                    <Button variant="secondary" size="sm" className="w-full justify-start gap-2 h-9 text-xs rounded-full group">
                      <Layers className="h-3.5 w-3.5 text-[#98473E] group-hover:scale-110 transition-all" />
                      <span>Flashcards</span>
                    </Button>
                  </Link>
                  <Link href="/learn" className="no-underline">
                    <Button variant="secondary" size="sm" className="w-full justify-start gap-2 h-9 text-xs rounded-full group">
                      <BookOpen className="h-3.5 w-3.5 text-[#98473E] group-hover:scale-110 transition-all" />
                      <span>AI Tutor</span>
                    </Button>
                  </Link>
                  <Link href="/quiz" className="no-underline">
                    <Button variant="secondary" size="sm" className="w-full justify-start gap-2 h-9 text-xs rounded-full group">
                      <FileQuestion className="h-3.5 w-3.5 text-[#98473E] group-hover:scale-110 transition-all" />
                      <span>Quizzes</span>
                    </Button>
                  </Link>
                  <Link href="/notes" className="no-underline">
                    <Button variant="secondary" size="sm" className="w-full justify-start gap-2 h-9 text-xs rounded-full group">
                      <FileText className="h-3.5 w-3.5 text-[#98473E] group-hover:scale-110 transition-all" />
                      <span>Smart Notes</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines / Target Exam */}
            <Card className="rounded-3xl animate-card-entrance" style={{ animationDelay: "360ms" }}>
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#98473E]" />
                  <span>Target Exam Countdown</span>
                </CardTitle>
                <CardDescription className="text-xs text-[var(--text-muted)]">
                  Active study goals & deadlines
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                {examDaysLeft !== null ? (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-raised)] shadow-xs thinklet-tile-hover">
                    <div>
                      <div className="text-2xl font-extrabold font-mono text-[var(--text)]">
                        {examDaysLeft} days
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Target: {store.goal.examDate}
                      </p>
                    </div>
                    <Badge variant={examDaysLeft <= 7 ? "destructive" : "warning"} className="text-xs font-bold">
                      {examDaysLeft <= 7 ? "Urgent" : "On Track"}
                    </Badge>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-2.5">
                      No target exam date configured yet.
                    </p>
                    <Link href="/planner" className="no-underline">
                      <Button variant="outline" size="sm" className="text-xs h-7.5 rounded-full">
                        Set Exam Date in Planner
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Decks Shelf */}
            <Card className="rounded-3xl animate-card-entrance" style={{ animationDelay: "400ms" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <CardTitle className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif]">
                    Study Materials
                  </CardTitle>
                  <CardDescription className="text-xs text-[var(--text-muted)]">
                    Uploaded source documents
                  </CardDescription>
                </div>
                <Link href="/materials" className="text-xs text-[#98473E] hover:text-[var(--text)] font-semibold no-underline">
                  Manage →
                </Link>
              </CardHeader>

              <CardContent className="space-y-2.5 pt-3">
                {materials.length > 0 ? (
                  materials.slice(0, 3).map((mat) => (
                    <Link key={mat.id} href={`/flashcards?materialId=${mat.id}`} className="block no-underline">
                      <div className="p-3.5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] shadow-xs thinklet-file-card-hover group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[var(--text)] font-['Quicksand',sans-serif] truncate max-w-[170px] group-hover:text-[#98473E] transition-colors">
                            {mat.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 group-hover:border-[#98473E] transition-colors">
                            {mat.topicsCount} Topics
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                          <span>{mat.pageCount} pages</span>
                          <span className="text-[#98473E] group-hover:text-[#7A362F] inline-flex items-center gap-1 font-bold transition-colors">
                            Study <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-5 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
                    <div className="flex justify-center mb-2.5">
                      <CuteBookMascot size="sm" className="animate-gentle-bounce" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-2.5">No materials loaded yet.</p>
                    <Button variant="outline" size="sm" onClick={() => loadDemoMaterial()} className="text-xs h-7.5 rounded-full">
                      Load Sample PDF
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsPanel isOpen={true} onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Mobile Floating Bottom Bar */}
      <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-[400px]">
        <nav className="flex items-center justify-around h-14 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-2 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
          <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-[#98473E] no-underline py-1 px-3 rounded-full bg-[var(--surface-hover)] transition-all hover:scale-105 active:scale-95">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link href="/notes" className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] no-underline py-1 px-3 rounded-full hover:bg-[var(--surface-hover)] transition-all hover:scale-105 active:scale-95">
            <FileText className="h-4 w-4" />
            <span>Notes</span>
          </Link>
          <Link href="/planner" className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] no-underline py-1 px-3 rounded-full hover:bg-[var(--surface-hover)] transition-all hover:scale-105 active:scale-95">
            <Calendar className="h-4 w-4" />
            <span>Planner</span>
          </Link>
          <Link href="/tracker" className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] no-underline py-1 px-3 rounded-full hover:bg-[var(--surface-hover)] transition-all hover:scale-105 active:scale-95">
            <Timer className="h-4 w-4" />
            <span>Timer</span>
          </Link>
          <Link href="/learn" className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] no-underline py-1 px-3 rounded-full hover:bg-[var(--surface-hover)] transition-all hover:scale-105 active:scale-95">
            <BookOpen className="h-4 w-4" />
            <span>Study</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
