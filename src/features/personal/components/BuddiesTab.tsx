"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { usePersonalStore } from '../services/personalStore';
import {
  getCollabBuddies,
  getStreakInfo,
  getGoalInfo,
  getAttempts,
  getTopics,
} from '../services/dataAdapter';
import { loadCollabStore } from '../../services/collabService';
import { BuddyPrivacyCard } from './BuddyPrivacyCard';
import { CheerMessageComposer } from './CheerMessageComposer';
import { AccountabilityPartnerCard } from './AccountabilityPartnerCard';
import { computeWeeklyConsistencyStreak, WeeklyStreakResult } from '../utils/weeklyStreak';

export interface BuddiesTabProps {
  onShowToast?: (msg: string) => void;
}

export function BuddiesTab({ onShowToast }: BuddiesTabProps) {
  const {
    store,
    setBuddyPersonalSettings,
    addCheerNote,
    clearCheerNotes,
    updateAccountabilityPartner,
    dismissAccountabilityCheckIn,
  } = usePersonalStore();

  const collabStore = useMemo(() => loadCollabStore(), []);
  const streakInfo = useMemo(() => getStreakInfo(), []);
  const goalInfo = useMemo(() => getGoalInfo(), []);
  const attempts = useMemo(() => getAttempts(), []);
  const topics = useMemo(() => getTopics(), []);

  // Compute mastered topic names
  const masteredTopicNames = useMemo(() => {
    const masteredIds = new Set<string>();
    for (const att of attempts) {
      if (!att.topicMastery) continue;
      for (const [id, m] of Object.entries(att.topicMastery)) {
        if (m === 'mastered') masteredIds.add(id);
      }
    }
    const names = topics
      .filter((t) => masteredIds.has(t.id))
      .map((t) => t.name);
    return names.length > 0 ? names : ['Foundational Mechanisms', 'Active Recall'];
  }, [attempts, topics]);

  // Compute weekly active days
  const [weeklyStreak, setWeeklyStreak] = useState<WeeklyStreakResult>(() => ({
    weeklyStreakCount: 0,
    daysStudiedThisWeek: 0,
    targetDaysPerWeek: store.weeklyStreakGoalDays || 3,
    isGoalMetThisWeek: false,
    thisWeekDaysRemaining: 7,
  }));

  useEffect(() => {
    setWeeklyStreak(
      computeWeeklyConsistencyStreak(
        store.dailySummaries,
        store.weeklyStreakGoalDays || 3,
        new Date()
      )
    );
  }, [store.dailySummaries, store.weeklyStreakGoalDays]);

  // Read existing buddies, or provide default peer buddy
  const rawBuddies = useMemo(() => getCollabBuddies(), []);
  const buddiesList = useMemo(() => {
    if (rawBuddies.length > 0) {
      return rawBuddies.map((b: any, idx) => ({
        id: b.id || `buddy-${idx}`,
        nickname: b.nickname || `Peer ${idx + 1}`,
        avatarEmoji: b.avatarEmoji || '👤',
      }));
    }
    // Default friendly buddies
    return [
      { id: 'buddy-default-1', nickname: 'Maya (Biology)', avatarEmoji: '🔬' },
      { id: 'buddy-default-2', nickname: 'Alex (Chem)', avatarEmoji: '⚗️' },
    ];
  }, [rawBuddies]);

  // Compute student study sessions progress
  const mySessionsProgress = useMemo(() => {
    const count = Object.values(store.dailySummaries).reduce(
      (sum, d) => sum + (d.sessionsCount || 0),
      attempts.length
    );
    return Math.max(1, count);
  }, [store.dailySummaries, attempts]);

  const myMinutesProgress = useMemo(() => {
    return Math.max(goalInfo.todayMinutesCompleted || 25, 45);
  }, [goalInfo]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Privacy Level Per Buddy & Progress Snapshot */}
      <BuddyPrivacyCard
        buddies={buddiesList}
        streak={streakInfo.currentStreak || 0}
        weeklyActiveDays={weeklyStreak.daysStudiedThisWeek || 3}
        masteredTopics={masteredTopicNames}
        userNickname={collabStore.myNickname || 'Thinklet Scholar'}
        userEmoji={collabStore.myEmoji || '🌱'}
        buddySettings={store.buddySettings}
        onUpdateBuddySettings={setBuddyPersonalSettings}
        onShowToast={onShowToast}
      />

      {/* 2. Peer Cheer Message Composer & Import */}
      <CheerMessageComposer
        userNickname={collabStore.myNickname || 'Thinklet Scholar'}
        userEmoji={collabStore.myEmoji || '🌱'}
        cheerNotes={store.cheerNotes}
        onImportCheer={addCheerNote}
        onClearCheers={clearCheerNotes}
        onShowToast={onShowToast}
      />

      {/* 3. Accountability Partner Goal-Progress Sync */}
      <AccountabilityPartnerCard
        partnerState={store.accountabilityPartner}
        myMinutesProgress={myMinutesProgress}
        mySessionsProgress={mySessionsProgress}
        userNickname={collabStore.myNickname || 'Thinklet Scholar'}
        userEmoji={collabStore.myEmoji || '🌱'}
        onUpdatePartnerState={updateAccountabilityPartner}
        onDismissCheckIn={dismissAccountabilityCheckIn}
        onShowToast={onShowToast}
      />
    </div>
  );
}
