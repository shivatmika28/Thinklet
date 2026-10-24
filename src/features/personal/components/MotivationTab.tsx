"use client";

import React, { useState, useEffect } from "react";
import { usePersonalStore } from "../services/personalStore";
import {
  getCoreState,
  getFeatureState,
  getStudySessions,
  getAttempts,
  getTopics,
} from "../services/dataAdapter";
import { getUnifiedTopicMastery } from "../../services/mastery";
import { evaluateReward, formatRewardCondition } from "../utils/rewards";
import { computePastSelfComparison, PastSelfComparisonResult } from "../utils/pastSelf";
import { computeWeeklyConsistencyStreak, WeeklyStreakResult } from "../utils/weeklyStreak";
import { BADGE_DEFINITIONS, evaluateEligibleBadges } from "../utils/badges";
import { StudyRoom } from "./StudyRoom";
import { WhyPopover } from "./WhyPopover";
import { triggerCelebration } from "./CelebrationEffects";
import {
  Heart,
  Trophy,
  Gift,
  Plus,
  Flame,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  Trash2,
} from "lucide-react";
import { RewardConditionType, RoomSlot } from "../types";

export interface MotivationTabProps {
  onShowToast: (msg: string) => void;
}

export const MotivationTab: React.FC<MotivationTabProps> = ({ onShowToast }) => {
  const {
    store,
    updateWhyStudying,
    addStudentReward,
    claimStudentReward,
    deleteStudentReward,
    updateRoomPlacement,
    setWeeklyStreakGoalDays,
    unlockBadge,
    effectiveCelebrationIntensity,
  } = usePersonalStore();

  // Read data from adapters safely
  const core = getCoreState();
  const feat = getFeatureState();
  const attempts = getAttempts();
  const topics = getTopics();
  const sessions = getStudySessions();

  // Compute Scholar Level and XP
  const completedTasksCount =
    store.events.filter((e) => e.type === "quest_completed").length ||
    Object.values(store.dailySummaries).reduce((acc, d) => acc + (d.questsCompleted || 0), 0);
  const attemptsScore = attempts.reduce((acc, a) => acc + (a.score || 0) * 10, 0);
  const totalMinutes = (feat.studySessions || []).reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalXP = attemptsScore + completedTasksCount * 25 + (feat.goal?.todayMinutesCompleted || 0) * 5;
  const scholarLevel = Math.max(1, Math.floor(totalXP / 200) + 1);

  // 1. "Why I'm Studying" Local State
  const [noteText, setNoteText] = useState(store.whyStudying.text);
  const [selectedEmoji, setSelectedEmoji] = useState(store.whyStudying.emoji || "🌱");
  const [isEditingNote, setIsEditingNote] = useState(false);

  // 2. Add Reward Modal / Form State
  const [showAddReward, setShowAddReward] = useState(false);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardType, setRewardType] = useState<RewardConditionType>("sessions");
  const [rewardTarget, setRewardTarget] = useState(3);

  // 3. Evaluate Badges automatically on mount / render
  useEffect(() => {
    const unifiedMastery = getUnifiedTopicMastery(topics);
    const masteredCount = unifiedMastery.filter((m) => m.mastery === "mastered").length;
    const questionsAnswered = attempts.reduce(
      (sum, a) => sum + (a.answers ? Object.keys(a.answers).length : (a.totalQuestions || 5)),
      0
    );
    const sprintsCount = sessions.filter((s) => s.type === "sprint").length;

    const eligible = evaluateEligibleBadges(store, {
      topicsMasteredCount: masteredCount,
      longestStreak: feat.streak?.longestStreak || 0,
      totalQuestionsAnswered: questionsAnswered,
      practicePapersCount:
        attempts.filter((a) => a.id.includes("paper")).length ||
        store.events.filter((e) => e.type === "quiz_finished" && Boolean(e.meta?.isPaper)).length,
      daysSinceLastSession: 0,
      totalSprintsCompleted: sprintsCount,
      relaxModeMinutes: store.relaxMode ? 35 : 0,
    });

    eligible.forEach((bId) => {
      const unlocked = unlockBadge(bId);
      if (unlocked) {
        const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === bId);
        onShowToast(`Milestone Unlocked: ${badgeDef?.title || "New Badge"}! 🏆`);
        triggerCelebration(effectiveCelebrationIntensity, `Badge Unlocked: ${badgeDef?.title}`);
      }
    });
  }, [store, topics, attempts, feat.streak, sessions, unlockBadge, effectiveCelebrationIntensity, onShowToast]);

  // 4. Past Self Comparison
  const [pastSelfResult, setPastSelfResult] = useState<PastSelfComparisonResult>(() =>
    computePastSelfComparison(store.dailySummaries)
  );

  // 5. Weekly Consistency Streak
  const [weeklyStreak, setWeeklyStreak] = useState<WeeklyStreakResult>(() => ({
    weeklyStreakCount: 0,
    daysStudiedThisWeek: 0,
    targetDaysPerWeek: store.weeklyStreakGoalDays || 3,
    isGoalMetThisWeek: false,
    thisWeekDaysRemaining: 7,
  }));

  useEffect(() => {
    setPastSelfResult(computePastSelfComparison(store.dailySummaries, new Date()));
    setWeeklyStreak(
      computeWeeklyConsistencyStreak(
        store.dailySummaries,
        store.weeklyStreakGoalDays || 3,
        new Date()
      )
    );
  }, [store.dailySummaries, store.weeklyStreakGoalDays]);

  // Handle Note Save
  const handleSaveNote = () => {
    updateWhyStudying({ text: noteText, emoji: selectedEmoji });
    setIsEditingNote(false);
    onShowToast("Motivation statement saved!");
  };

  // Handle Create Reward
  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim()) return;
    addStudentReward({
      title: rewardTitle.trim(),
      type: rewardType,
      target: rewardTarget,
    });
    setRewardTitle("");
    setRewardTarget(3);
    setShowAddReward(false);
    onShowToast("Personal reward created!");
  };

  // Handle Claim Reward
  const handleClaimReward = (rewardId: string, title: string) => {
    claimStudentReward(rewardId);
    triggerCelebration(effectiveCelebrationIntensity, `Reward Claimed: ${title}! 🎉`);
    onShowToast(`Claimed: "${title}". Great work studying!`);
  };

  const rewardStats = {
    totalSessions: sessions.length,
    totalMinutes: totalMinutes,
    totalQuestsCompleted: completedTasksCount,
    currentStreak: feat.streak?.currentStreak || 0,
  };

  const emojiList = ["🌱", "🎓", "🚀", "💫", "📚", "⭐", "🎯", "🌊", "☕", "🏆"];

  return (
    <div className="space-y-6">
      {/* ================= SECTION 1: "WHY I'M STUDYING" ANCHOR NOTE ================= */}
      <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#98473E]/10 text-[#98473E] flex items-center justify-center font-bold">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif]">
                My Personal &ldquo;Why&rdquo;
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Shown gently when your energy is low or study gets challenging.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingNote((prev) => !prev)}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-colors cursor-pointer"
          >
            {isEditingNote ? "Cancel" : "Edit Anchor"}
          </button>
        </div>

        {isEditingNote ? (
          <div className="space-y-3 pt-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="What makes your learning meaningful? E.g., 'To ace my finals and become a wildlife researcher!'"
              className="w-full p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#98473E] resize-none h-20"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {emojiList.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                      selectedEmoji === emoji
                        ? "bg-[#98473E]/20 border border-[#98473E] scale-110"
                        : "bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#98473E] hover:bg-[#803B33] text-white shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3">
            <span className="text-2xl">{store.whyStudying.emoji || "🌱"}</span>
            <div className="text-xs font-medium text-[var(--text)] italic leading-relaxed">
              &ldquo;{store.whyStudying.text}&rdquo;
            </div>
          </div>
        )}
      </div>

      {/* ================= SECTION 2: SELF-SET REWARDS ================= */}
      <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#A37C40]/10 text-[#A37C40] flex items-center justify-center">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif]">
                Self-Set Rewards
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Celebrate healthy milestones with treats you choose for yourself.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddReward((prev) => !prev)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#A37C40] hover:bg-[#8F6A33] text-white transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Reward</span>
          </button>
        </div>

        {/* Add Reward Form */}
        {showAddReward && (
          <form
            onSubmit={handleCreateReward}
            className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-3 animate-fade-in"
          >
            <div className="font-bold text-xs text-[var(--text)]">Create a Personal Treat</div>
            <input
              type="text"
              value={rewardTitle}
              onChange={(e) => setRewardTitle(e.target.value)}
              placeholder="e.g., Watch an episode of anime, order bubble tea, 30m gaming"
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#A37C40]"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Condition Type
                </label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value as RewardConditionType)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#A37C40]"
                >
                  <option value="sessions">Study Sessions Completed</option>
                  <option value="minutes">Total Minutes Studied</option>
                  <option value="quests">Quests Cleared</option>
                  <option value="streak">Daily Streak Days</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={rewardTarget}
                  onChange={(e) => setRewardTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#A37C40]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddReward(false)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#A37C40] text-white hover:bg-[#8F6A33] transition-colors cursor-pointer"
              >
                Save Reward
              </button>
            </div>
          </form>
        )}

        {/* Reward Cards List */}
        <div className="space-y-2.5">
          {store.rewards.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic text-center py-4">
              No rewards created yet. Add one above to celebrate your focus!
            </p>
          ) : (
            store.rewards.map((reward) => {
              const evalReward = evaluateReward(reward, rewardStats);
              return (
                <div
                  key={reward.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    reward.claimed
                      ? "bg-[var(--surface-raised)]/50 border-[var(--border)] opacity-60"
                      : evalReward.isUnlocked
                      ? "bg-[#A37C40]/15 border-[#A37C40]/40 shadow-xs"
                      : "bg-[var(--surface-raised)] border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{reward.claimed ? "🎁" : "🎯"}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[var(--text)] truncate">
                          {reward.title}
                        </h4>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Requires: {formatRewardCondition(reward.type, reward.target)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {reward.claimed ? (
                        <span className="text-[10px] font-bold text-[#7F9274] flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Claimed</span>
                        </span>
                      ) : evalReward.isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => handleClaimReward(reward.id, reward.title)}
                          className="px-3 py-1 rounded-full text-xs font-bold bg-[#A37C40] hover:bg-[#8F6A33] text-white shadow-xs animate-bounce cursor-pointer"
                        >
                          Claim Treat! 🎉
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                          {evalReward.currentValue} / {reward.target}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteStudentReward(reward.id)}
                        aria-label="Delete reward"
                        className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!reward.claimed && (
                    <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden border border-[var(--border-soft)]">
                      <div
                        className="bg-[#A37C40] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${evalReward.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= SECTION 3: RACE YOUR PAST SELF ================= */}
      <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#7F9274]/10 text-[#7F9274] flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif] flex items-center gap-1.5">
                <span>Race Your Past Self</span>
                <WhyPopover reason={pastSelfResult.reason} />
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Comparing this week with your own prior week — zero pressure, zero outside comparisons.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Minutes Comparison */}
          <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Study Time</span>
            </span>
            <div className="text-base font-extrabold text-[var(--text)]">
              {pastSelfResult.metrics.thisWeekMinutes}m
              <span className="text-xs font-normal text-[var(--text-muted)] ml-1">
                (vs {pastSelfResult.metrics.lastWeekMinutes}m prior)
              </span>
            </div>
            <div
              className={`text-[10px] font-bold ${
                pastSelfResult.minutesDiff >= 0 ? "text-[#7F9274]" : "text-[var(--text-muted)]"
              }`}
            >
              {pastSelfResult.minutesDiff >= 0
                ? `+${pastSelfResult.minutesDiff}m ahead`
                : `${pastSelfResult.minutesDiff}m steady pacing`}
            </div>
          </div>

          {/* Accuracy Comparison */}
          <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Quiz Accuracy</span>
            </span>
            <div className="text-base font-extrabold text-[var(--text)]">
              {pastSelfResult.metrics.thisWeekAccuracy}%
              <span className="text-xs font-normal text-[var(--text-muted)] ml-1">
                (vs {pastSelfResult.metrics.lastWeekAccuracy}% prior)
              </span>
            </div>
            <div
              className={`text-[10px] font-bold ${
                pastSelfResult.accuracyDiff >= 0 ? "text-[#7F9274]" : "text-[var(--text-muted)]"
              }`}
            >
              {pastSelfResult.accuracyDiff >= 0
                ? `+${pastSelfResult.accuracyDiff}% comprehension`
                : `${pastSelfResult.accuracyDiff}% learning challenge`}
            </div>
          </div>

          {/* Active Days */}
          <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Active Study Days</span>
            </span>
            <div className="text-base font-extrabold text-[var(--text)]">
              {pastSelfResult.metrics.thisWeekActiveDays} days
              <span className="text-xs font-normal text-[var(--text-muted)] ml-1">
                (vs {pastSelfResult.metrics.lastWeekActiveDays} prior)
              </span>
            </div>
            <div className="text-[10px] font-bold text-[#7F9274]">
              {pastSelfResult.activeDaysDiff >= 0
                ? `+${pastSelfResult.activeDaysDiff} days habit strength`
                : "Active rhythm building"}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface)]/70 border border-[var(--border-soft)] text-xs text-[var(--text-muted)] leading-relaxed italic">
          &ldquo;{pastSelfResult.metrics.encouragement}&rdquo;
        </div>
      </div>

      {/* ================= SECTION 4: WEEKLY CONSISTENCY STREAK ================= */}
      <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#F4A261]/10 text-[#F4A261] flex items-center justify-center font-bold">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif]">
                Weekly Consistency Streak
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                A week counts when you study on at least {store.weeklyStreakGoalDays || 3} days.
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-extrabold text-[var(--text)]">
              {weeklyStreak.weeklyStreakCount} {weeklyStreak.weeklyStreakCount === 1 ? "Week" : "Weeks"}
            </div>
            <span className="text-[10px] font-bold text-[#7F9274]">
              {weeklyStreak.isGoalMetThisWeek ? "Goal Met This Week! 🔥" : `${weeklyStreak.daysStudiedThisWeek} / ${weeklyStreak.targetDaysPerWeek} days`}
            </span>
          </div>
        </div>

        {/* Stepper to adjust target days per week */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs">
          <span className="font-semibold text-[var(--text)]">
            Weekly Goal: Study at least
          </span>
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setWeeklyStreakGoalDays(days)}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  (store.weeklyStreakGoalDays || 3) === days
                    ? "bg-[#98473E] text-white shadow-xs"
                    : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= SECTION 5: PERSONALISED BADGES ================= */}
      <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#98473E]/10 text-[#98473E] flex items-center justify-center">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif]">
                Personalised Badges
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Recognising persistence, comebacks, and comprehension milestones.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[var(--text-muted)]">
            {Object.keys(store.badges || {}).length} / {BADGE_DEFINITIONS.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BADGE_DEFINITIONS.map((badge) => {
            const isUnlocked = Boolean(store.badges?.[badge.id]);
            const unlockedAt = store.badges?.[badge.id]?.unlockedAt;

            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  isUnlocked
                    ? "bg-[var(--surface)] border-[var(--border)] shadow-xs"
                    : "bg-[var(--surface)]/40 border-[var(--border-soft)] opacity-60"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                    isUnlocked
                      ? "bg-[#FAF0CA] border-[#A37C40]/30 shadow-xs"
                      : "bg-[var(--surface-raised)] border-[var(--border)] text-gray-400"
                  }`}
                >
                  {isUnlocked ? badge.icon : <Lock className="h-4 w-4 text-[var(--text-muted)]" />}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[var(--text)] truncate">
                      {badge.title}
                    </h4>
                    {isUnlocked && (
                      <span className="text-[9px] font-bold text-[#7F9274] bg-[#7F9274]/15 px-1.5 py-0.5 rounded-full">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {badge.description}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] block pt-1">
                    Criteria: {badge.ruleKey}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 6: MASCOT STUDY ROOM ================= */}
      <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#7F9274]/10 text-[#7F9274] flex items-center justify-center font-bold">
              <span>🏠</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] font-['Quicksand',sans-serif]">
                Pip&apos;s Cozy Study Room
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Items unlock at Level / XP thresholds. Decorate Pip&apos;s study sanctuary without spending any XP!
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[var(--text)] bg-[var(--surface-raised)] px-2.5 py-1 rounded-full border border-[var(--border)]">
            Scholar Level {scholarLevel} • {totalXP} XP
          </span>
        </div>

        <StudyRoom
          roomPlacements={store.roomPlacements}
          studentLevel={scholarLevel}
          totalXp={totalXP}
          onUpdatePlacement={(slot, itemId) => {
            updateRoomPlacement(slot, itemId);
            onShowToast(itemId ? `Placed in ${slot} slot!` : `Removed item from ${slot}`);
          }}
        />
      </div>
    </div>
  );
};
