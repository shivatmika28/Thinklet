"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Leaf,
  Calendar,
  Flame,
  Clock,
  Heart,
  Smile,
  Activity,
  BarChart2,
  Users,
  Shield,
  X,
  Download,
  RotateCcw,
  Trash2,
  Check,
  AlertTriangle,
  Info,
  ToggleLeft,
  ToggleRight,
  Sun,
  Moon,
} from "lucide-react";
import {
  usePersonalStore,
  setRelaxMode,
  setPausePersonalisation,
  updatePersonalSwitches,
  resetPersonalStore,
  forgetDocumentData,
} from "../services/personalStore";
import { getTopics, getAttempts, getGoalInfo, getStreakInfo } from "../services/dataAdapter";
import { WhyPopover } from "./WhyPopover";
import { createReason, REASON_RULES } from "../utils/reasonModel";
import { useMaterial } from "@/context/MaterialContext";
import { MotivationTab } from "./MotivationTab";
import { HardDayBanner } from "./HardDayBanner";
import { CelebrationEffects } from "./CelebrationEffects";
import { computeWeeklyConsistencyStreak, WeeklyStreakResult } from "../utils/weeklyStreak";
import { MascotTab } from "./MascotTab";
import { WellbeingTab } from "./WellbeingTab";
import { InsightsTab } from "./InsightsTab";
import { BuddiesTab } from "./BuddiesTab";
import { WellbeingManager } from "./WellbeingManager";
import { detectDeviceContext, getDeviceAwareSuggestion } from "../utils/deviceContext";
import { DeviceType } from "../types";

export type MySpaceTab =
  | "today"
  | "motivation"
  | "mascot"
  | "wellbeing"
  | "insights"
  | "buddies"
  | "privacy";

export interface MySpaceDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: MySpaceTab;
  embedded?: boolean; // When rendered directly in /myspace page
}

export const MySpaceDialog: React.FC<MySpaceDialogProps> = ({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  initialTab = "today",
  embedded = false,
}) => {
  const { store, effectiveCelebrationIntensity, effectiveBreakMinutes } = usePersonalStore();
  const { materials, refreshMaterials } = useMaterial();

  const [todayWeeklyStreak, setTodayWeeklyStreak] = useState<WeeklyStreakResult>(() => ({
    weeklyStreakCount: 0,
    daysStudiedThisWeek: 0,
    targetDaysPerWeek: store.weeklyStreakGoalDays || 3,
    isGoalMetThisWeek: false,
    thisWeekDaysRemaining: 7,
  }));

  const [deviceContext, setDeviceContext] = useState({
    deviceType: 'desktop' as DeviceType,
    isTouch: false,
    isSmallScreen: false,
  });
  const [screenWidth, setScreenWidth] = useState<number>(1200);

  useEffect(() => {
    setDeviceContext(detectDeviceContext());
    setScreenWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    setTodayWeeklyStreak(
      computeWeeklyConsistencyStreak(
        store.dailySummaries,
        store.weeklyStreakGoalDays || 3,
        new Date()
      )
    );
  }, [store.dailySummaries, store.weeklyStreakGoalDays]);

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof propsIsOpen === "boolean";
  const isOpen = embedded ? true : (isControlled ? propsIsOpen : internalIsOpen);

  const handleClose = () => {
    if (isControlled && propsOnClose) {
      propsOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Listen for global custom event 'thinklet:open-myspace'
  useEffect(() => {
    if (embedded) return;
    const handleOpen = () => setInternalIsOpen(true);
    window.addEventListener("thinklet:open-myspace", handleOpen);
    return () => window.removeEventListener("thinklet:open-myspace", handleOpen);
  }, [embedded]);

  const [activeTab, setActiveTab] = useState<MySpaceTab>(initialTab);
  const [selectedDocToForget, setSelectedDocToForget] = useState<string>("");
  const [alsoDeleteDocFromApp, setAlsoDeleteDocFromApp] = useState<boolean>(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen || embedded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, embedded, isControlled, propsOnClose]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(store, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `thinklet-personal-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Personal data exported successfully!");
    } catch {
      showToast("Failed to export data.");
    }
  };

  const handleForgetDocument = () => {
    if (!selectedDocToForget) return;
    const doc = materials.find((m) => m.id === selectedDocToForget);
    const docTitle = doc?.title || "selected document";

    if (
      window.confirm(
        `Are you sure you want to forget all personal signals, history, and memories tied to "${docTitle}"?`
      )
    ) {
      forgetDocumentData(selectedDocToForget);

      if (alsoDeleteDocFromApp) {
        fetch(`/api/materials/${selectedDocToForget}`, { method: "DELETE" })
          .then(() => refreshMaterials())
          .catch(() => {});
      }

      showToast(`Personal signals for "${docTitle}" forgotten.`);
      setSelectedDocToForget("");
      setAlsoDeleteDocFromApp(false);
    }
  };

  const handleConfirmReset = () => {
    resetPersonalStore();
    setResetConfirmOpen(false);
    showToast("Personalisation settings reset to factory defaults.");
  };

  if (!isOpen && !embedded) return <WellbeingManager />;

  const tabs: Array<{ id: MySpaceTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "today", label: "Today", icon: Sparkles },
    { id: "motivation", label: "Motivation", icon: Heart },
    { id: "mascot", label: "Mascot", icon: Smile },
    { id: "wellbeing", label: "Wellbeing", icon: Activity },
    { id: "insights", label: "Insights", icon: BarChart2 },
    { id: "buddies", label: "Buddies", icon: Users },
    { id: "privacy", label: "Privacy & Data", icon: Shield },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[var(--surface)] text-[var(--text)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--surface)] via-[var(--surface-raised)] to-[var(--surface-hover)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#98473E]/10 text-[#98473E] flex items-center justify-center border border-[#98473E]/20 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text)] font-['Quicksand',sans-serif] flex items-center gap-2">
              <span>My Space</span>
              {store.relaxMode && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7F9274]/20 text-[#7F9274] border border-[#7F9274]/40">
                  RELAX MODE ON
                </span>
              )}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Your personal study sanctuary, wellbeing pacing, and learning reflection.
            </p>
          </div>
        </div>

        {!embedded && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close My Space"
            className="h-8 w-8 rounded-full inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#98473E] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--surface)] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                isActive
                  ? "border-[#98473E] text-[#98473E]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-[#7F9274] text-white text-xs font-bold py-1.5 px-4 text-center animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Main Tab Panels */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        {/* ================= TAB 1: TODAY ================= */}
        {activeTab === "today" && (
          <div className="space-y-6 animate-fade-in">
            {/* Daily Motivational Reflection on Hard Days */}
            <HardDayBanner onOpenMotivationTab={() => setActiveTab("motivation")} />

            {/* Relax Mode Banner Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                store.relaxMode
                  ? "bg-[#7F9274]/10 border-[#7F9274]/30"
                  : "bg-[var(--surface-raised)] border-[var(--border)]"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      store.relaxMode
                        ? "bg-[#7F9274] text-white"
                        : "bg-[var(--surface-hover)] text-[var(--text-muted)]"
                    }`}
                  >
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                      <span>Relax Mode</span>
                      <WhyPopover
                        reason={createReason(
                          REASON_RULES.RELAX_BREAK_SUGGESTION,
                          [
                            `Current status: ${store.relaxMode ? "Active" : "Inactive"}`,
                            `Break interval: ${effectiveBreakMinutes} minutes`,
                            `Celebration intensity: ${effectiveCelebrationIntensity}`,
                            `Animation speed: ${store.relaxMode ? "30% calmer pace" : "Standard"}`,
                          ]
                        )}
                      />
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      {store.relaxMode
                        ? "Active: Gentle pacing, calm mascot demeanor, break reminders every 30m, and soft celebrations."
                        : "Off: Standard active learning pace and full confetti animations."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRelaxMode(!store.relaxMode)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    store.relaxMode
                      ? "bg-[#7F9274] text-white shadow-xs hover:bg-[#6E8064]"
                      : "bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]"
                  }`}
                >
                  {store.relaxMode ? "Turn Off Relax Mode" : "Turn On Relax Mode"}
                </button>
              </div>
            </div>

            {/* Today's Focus Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Flame className="h-3 w-3 text-[#F4A261]" />
                  <span>Weekly Streak</span>
                </span>
                <div className="text-xl font-extrabold text-[var(--text)]">
                  {todayWeeklyStreak.weeklyStreakCount} {todayWeeklyStreak.weeklyStreakCount === 1 ? "Week" : "Weeks"}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {todayWeeklyStreak.isGoalMetThisWeek
                    ? "Goal met this week! 🔥"
                    : `${todayWeeklyStreak.daysStudiedThisWeek}/${todayWeeklyStreak.targetDaysPerWeek} days target`}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Break Cadence</span>
                </span>
                <div className="text-xl font-extrabold text-[var(--text)]">
                  Every {effectiveBreakMinutes}m
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {store.relaxMode ? "Accelerated rest cadence" : "Standard 45m cadence"}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>Celebration Style</span>
                </span>
                <div className="text-xl font-extrabold text-[var(--text)] capitalize">
                  {effectiveCelebrationIntensity}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {store.relaxMode ? "Capped to gentle subtle style" : "Configured preference"}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>Personal Events Logged</span>
                </span>
                <div className="text-xl font-extrabold text-[var(--text)]">
                  {store.events.length}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {store.pausePersonalisation ? "Personalisation paused" : "Signals active"}
                </p>
              </div>
            </div>

            {/* Quick Actions in My Space */}
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] font-['Quicksand',sans-serif]">
                Quick Mindfulness & Pacing
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("thinklet:open-breathe"));
                    showToast("1-Minute Breathing Exercise activated.");
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left"
                >
                  <span className="text-lg">🌬️</span>
                  <div>
                    <div className="text-xs font-bold text-[var(--text)]">1-Minute Breathing</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Center your focus before revision</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("thinklet:open-commute"));
                    showToast("Commute Mode Audio ready.");
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left"
                >
                  <span className="text-lg">🎧</span>
                  <div>
                    <div className="text-xs font-bold text-[var(--text)]">Commute Mode</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Listen to key points hands-free</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Device-Aware Ergonomic Study Suggestion */}
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {deviceContext.deviceType === 'phone' ? '📱' : '💻'}
                  </span>
                  <span className="text-xs font-bold text-[var(--text)]">
                    {getDeviceAwareSuggestion(deviceContext.deviceType).title}
                  </span>
                </div>
                <WhyPopover
                  reason={{
                    rule: 'Ergonomic device & pointer adaptation',
                    data: [
                      `Device: ${deviceContext.deviceType}`,
                      `Screen width: ${screenWidth}px`,
                      `Tailored study activity`,
                    ],
                  }}
                  title="Why this suggestion"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {getDeviceAwareSuggestion(deviceContext.deviceType).description}
              </p>
              <div className="pt-1">
                <a
                  href={getDeviceAwareSuggestion(deviceContext.deviceType).actionHref}
                  onClick={(e) => {
                    const sugg = getDeviceAwareSuggestion(deviceContext.deviceType);
                    if (sugg.actionEvent) {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent(sugg.actionEvent));
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#98473E] text-white hover:bg-[#823C34] transition-colors shadow-xs"
                >
                  <span>{getDeviceAwareSuggestion(deviceContext.deviceType).actionText}</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MOTIVATION ================= */}
        {activeTab === "motivation" && (
          <div className="animate-fade-in">
            <MotivationTab onShowToast={showToast} />
          </div>
        )}

        {/* ================= TAB 3: MASCOT ================= */}
        {activeTab === "mascot" && (
          <div className="space-y-6 animate-fade-in">
            <MascotTab />
          </div>
        )}

        {/* ================= TAB 4: WELLBEING ================= */}
        {activeTab === "wellbeing" && (
          <div className="space-y-6 animate-fade-in">
            <WellbeingTab
              onShowToast={showToast}
              onOpenBreathe={() => window.dispatchEvent(new CustomEvent("thinklet:open-breathe"))}
              onOpenCommute={() => window.dispatchEvent(new CustomEvent("thinklet:open-commute"))}
            />
          </div>
        )}

        {/* ================= TAB 5: INSIGHTS ================= */}
        {activeTab === "insights" && (
          <InsightsTab onShowToast={showToast} />
        )}

        {/* ================= TAB 6: BUDDIES ================= */}
        {activeTab === "buddies" && (
          <BuddiesTab onShowToast={showToast} />
        )}

        {/* ================= TAB 7: PRIVACY & DATA ================= */}
        {activeTab === "privacy" && (
          <div className="space-y-6 animate-fade-in">
            {/* Master Pause Switch */}
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <span>Pause All Personalisation</span>
                  <WhyPopover
                    reason={createReason(
                      "Master privacy kill-switch to temporarily disable all personal event tracking and adaptive prompts",
                      [
                        `Current status: ${store.pausePersonalisation ? "Paused" : "Active"}`,
                        "No events will be logged while paused",
                      ]
                    )}
                  />
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Temporarily halt event logging and adaptive recommendations. Your existing saved data is kept safe.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={store.pausePersonalisation}
                onClick={() => setPausePersonalisation(!store.pausePersonalisation)}
                className="p-1 cursor-pointer"
              >
                {store.pausePersonalisation ? (
                  <ToggleRight className="h-7 w-7 text-[#98473E]" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-[var(--text-muted)]" />
                )}
              </button>
            </div>

            {/* Per-Feature Personalisation Switches */}
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] font-['Quicksand',sans-serif]">
                Feature Personalisation Controls
              </h3>

              <div className="divide-y divide-[var(--border-soft)] text-xs">
                {/* Adaptive Difficulty (disabled with note) */}
                <div className="py-3 flex items-center justify-between gap-4 opacity-60">
                  <div>
                    <div className="font-bold text-[var(--text)]">Adaptive Question Difficulty</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Standard syllabus pacing active. (Core app uses grounded curriculum difficulty)
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-muted)]">
                    Standard
                  </span>
                </div>

                {/* Mascot Memory */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-[var(--text)]">Mascot Memory</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Allow Pip to remember milestone moments and mastered topics locally
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={store.switches.mascotMemory}
                    onClick={() =>
                      updatePersonalSwitches({ mascotMemory: !store.switches.mascotMemory })
                    }
                    className="cursor-pointer"
                  >
                    {store.switches.mascotMemory ? (
                      <ToggleRight className="h-6 w-6 text-[#98473E]" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-[var(--text-muted)]" />
                    )}
                  </button>
                </div>

                {/* Mascot Tips */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-[var(--text)]">Mascot Speech Tips</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Display encouragement and revision suggestions in the mascot speech bubble
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={store.switches.mascotTips}
                    onClick={() =>
                      updatePersonalSwitches({ mascotTips: !store.switches.mascotTips })
                    }
                    className="cursor-pointer"
                  >
                    {store.switches.mascotTips ? (
                      <ToggleRight className="h-6 w-6 text-[#98473E]" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-[var(--text-muted)]" />
                    )}
                  </button>
                </div>

                {/* Wellbeing Nudges */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-[var(--text)]">Wellbeing & Rest Nudges</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Receive gentle hydration, stretch, and late-night wrap-up reminders
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={store.switches.nudges}
                    onClick={() =>
                      updatePersonalSwitches({ nudges: !store.switches.nudges })
                    }
                    className="cursor-pointer"
                  >
                    {store.switches.nudges ? (
                      <ToggleRight className="h-6 w-6 text-[#98473E]" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-[var(--text-muted)]" />
                    )}
                  </button>
                </div>

                {/* Learning Insights */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-[var(--text)]">Personal Learning Insights</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Compute study time preferences and question accuracy patterns from event logs
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={store.switches.insights}
                    onClick={() =>
                      updatePersonalSwitches({ insights: !store.switches.insights })
                    }
                    className="cursor-pointer"
                  >
                    {store.switches.insights ? (
                      <ToggleRight className="h-6 w-6 text-[#98473E]" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-[var(--text-muted)]" />
                    )}
                  </button>
                </div>

                {/* Celebration Intensity Selector */}
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-[var(--text)]">Celebration Intensity</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {store.relaxMode
                        ? "Relax mode currently caps celebrations at Subtle"
                        : "Visual reward style when completing quests and streaks"}
                    </div>
                  </div>
                  <select
                    value={store.switches.celebrationIntensity}
                    onChange={(e) =>
                      updatePersonalSwitches({
                        celebrationIntensity: e.target.value as any,
                      })
                    }
                    className="h-8 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 text-xs font-semibold text-[var(--text)] outline-none cursor-pointer"
                  >
                    <option value="off">Off (Quiet)</option>
                    <option value="subtle">Subtle</option>
                    <option value="standard">Standard</option>
                    <option value="confetti">Full Confetti</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Forget Document Section */}
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] font-['Quicksand',sans-serif]">
                Forget One Document
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Purge all personal events, memories, and learning insights associated with a specific study document.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <select
                  value={selectedDocToForget}
                  onChange={(e) => setSelectedDocToForget(e.target.value)}
                  className="flex-1 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-xs font-semibold text-[var(--text)] outline-none cursor-pointer"
                >
                  <option value="">-- Choose document to forget --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleForgetDocument}
                  disabled={!selectedDocToForget}
                  className="px-4 h-9 rounded-xl text-xs font-bold bg-[#98473E] text-white hover:bg-[#853C34] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Forget Signals</span>
                </button>
              </div>

              {selectedDocToForget && (
                <label className="flex items-center gap-2 pt-1 text-xs text-[var(--text-muted)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoDeleteDocFromApp}
                    onChange={(e) => setAlsoDeleteDocFromApp(e.target.checked)}
                    className="rounded text-[#98473E] focus:ring-[#98473E]"
                  />
                  <span>Also delete document itself from study materials</span>
                </label>
              )}
            </div>

            {/* Export & Reset Zone */}
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text)]">Export Personal Data</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Download a full JSON archive of your personal store, events, and summaries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="pt-3 border-t border-[var(--border-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#98473E]">Reset Personalisation</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Clears personal events and resets switches to factory defaults (only touches own keys).
                  </p>
                </div>

                {resetConfirmOpen ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setResetConfirmOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReset}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#98473E] text-white hover:bg-[#853C34] cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[#98473E]/30 text-[#98473E] hover:bg-[#98473E]/10 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Personal Store</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Celebration Overlay */}
      <CelebrationEffects />
    </div>
  );

  if (!isOpen && !embedded) {
    return null;
  }

  if (embedded) {
    return content;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="myspace-title"
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
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        className="animate-fade-in"
      />

      {/* Dialog Frame */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          zIndex: 51,
          maxWidth: "800px",
          width: "100%",
          height: "85vh",
          maxHeight: "800px",
        }}
        className="animate-card-entrance"
      >
        {content}
      </div>
    </div>
  );
};
