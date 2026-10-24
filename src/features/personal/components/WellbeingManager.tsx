// [PERSONAL] Global Wellbeing Manager managing continuous study break suggestions, late night nudges, and commute mode dialogs
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePersonalStore } from '../services/personalStore';
import { BreakType, CommuteAudioItem } from '../types';
import { BreakSuggestionModal } from './BreakSuggestionModal';
import { LateNightNudge } from './LateNightNudge';
import { PreTestCalmScreen } from './PreTestCalmScreen';
import { CommuteModeDialog } from './CommuteModeDialog';
import { getTopics, getAttempts } from '../services/dataAdapter';

export function WellbeingManager() {
  const {
    store,
    effectiveBreakMinutes,
    dismissBreakSuggestion,
    dismissLateNightNudge,
  } = usePersonalStore();

  const [showCalmModal, setShowCalmModal] = useState(false);
  const [showCommuteModal, setShowCommuteModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakType, setBreakType] = useState<BreakType>('stretch');
  const [showLateNightNudge, setShowLateNightNudge] = useState(false);

  const sessionStartTimeRef = useRef<number>(0);
  const breakRotationIndexRef = useRef<number>(0);

  // 1. Listen for global custom events from Relax popover, command palette, or tabs
  useEffect(() => {
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now();
    }
    const handleOpenBreathe = () => setShowCalmModal(true);
    const handleOpenCommute = () => setShowCommuteModal(true);

    window.addEventListener('thinklet:open-breathe', handleOpenBreathe);
    window.addEventListener('thinklet:open-commute', handleOpenCommute);

    return () => {
      window.removeEventListener('thinklet:open-breathe', handleOpenBreathe);
      window.removeEventListener('thinklet:open-commute', handleOpenCommute);
    };
  }, []);

  // 2. Continuous session monitor for Smart Break Suggestions
  useEffect(() => {
    if (!store.breakSuggestionsEnabled || store.pausePersonalisation) {
      setShowBreakModal(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const start = sessionStartTimeRef.current || now;
      const elapsedMinutes = (now - start) / (60 * 1000);

      // Check if snoozed
      if (
        store.lastBreakSuggestionDismissedAt &&
        now < store.lastBreakSuggestionDismissedAt
      ) {
        return;
      }

      // Check if elapsed study duration exceeded effective interval (30m or 45m)
      if (elapsedMinutes >= effectiveBreakMinutes && !showBreakModal) {
        const breakTypes: BreakType[] = ['stretch', 'water', 'eye_rest'];
        const nextType = breakTypes[breakRotationIndexRef.current % breakTypes.length];
        breakRotationIndexRef.current += 1;
        setBreakType(nextType);
        setShowBreakModal(true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [
    store.breakSuggestionsEnabled,
    store.pausePersonalisation,
    store.lastBreakSuggestionDismissedAt,
    effectiveBreakMinutes,
    showBreakModal,
  ]);

  // 3. Late-Night Study Circadian Nudge Monitor (once per night)
  useEffect(() => {
    if (!store.lateNightNudgeEnabled || store.pausePersonalisation) {
      setShowLateNightNudge(false);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // Check if late night hour reached and not yet dismissed tonight
    if (
      currentHour >= store.lateNightHour &&
      store.lastNightNudgeDismissedDate !== todayStr
    ) {
      setShowLateNightNudge(true);
    } else {
      setShowLateNightNudge(false);
    }
  }, [
    store.lateNightNudgeEnabled,
    store.pausePersonalisation,
    store.lateNightHour,
    store.lastNightNudgeDismissedDate,
  ]);

  const handleTakeBreak = () => {
    setShowBreakModal(false);
    dismissBreakSuggestion(20); // Snooze for 20m after taking break
    sessionStartTimeRef.current = Date.now(); // Reset continuous session start
    setShowCalmModal(true); // Offer 1-min calming breath
  };

  const handleSnoozeBreak = (minutes: number) => {
    setShowBreakModal(false);
    dismissBreakSuggestion(minutes);
  };

  const handleDismissBreak = () => {
    setShowBreakModal(false);
    dismissBreakSuggestion(15);
  };

  const handleDismissLateNight = () => {
    setShowLateNightNudge(false);
    dismissLateNightNudge();
  };

  // Sample items for Commute Audio Mode
  const topics = getTopics();
  const sampleFlashcards: CommuteAudioItem[] = [
    {
      id: 'commute-fc-1',
      title: 'Biology: RuBisCO in the Calvin Cycle',
      detail: 'RuBisCO fixes CO2 into RuBP forming two 3-PGA molecules.',
      textToSpeak:
        'Question: What is the primary role of RuBisCO in the Calvin cycle? ... Pause for answer ... RuBisCO catalyzes the carboxylation of ribulose-1,5-bisphosphate with carbon dioxide to produce 3-PGA.',
      type: 'flashcard',
    },
    {
      id: 'commute-fc-2',
      title: 'Chemistry: Le Chatelier’s Principle',
      detail: 'Equilibrium shifts to counteract external temperature/pressure changes.',
      textToSpeak:
        'Question: What defines Le Chatelier’s principle for dynamic equilibrium? ... Pause for answer ... If dynamic equilibrium is disturbed, the system shifts position to counteract the change.',
      type: 'flashcard',
    },
    {
      id: 'commute-fc-3',
      title: 'Physics: Newton’s Second Law',
      detail: 'Rate of change of momentum is proportional to applied force.',
      textToSpeak:
        'Question: State Newton’s Second Law in terms of momentum. ... Pause for answer ... The rate of change of momentum is directly proportional to resultant force and occurs in its direction.',
      type: 'flashcard',
    },
  ];

  const sampleNotes: CommuteAudioItem[] = topics.slice(0, 3).map((t, idx) => ({
    id: `commute-note-${idx}`,
    title: `${t.name} Core Takeaway`,
    detail: `High-yield summary notes for ${t.name}.`,
    textToSpeak: `Key Takeaways for ${t.name}. Reviewing core mechanisms, key definitions, and recurring examination pitfalls.`,
    type: 'note',
  }));

  const sampleWeakTopics: CommuteAudioItem[] = topics
    .slice(0, 3)
    .map((t, idx) => {
      const attempts = getAttempts();
      const latest = attempts[attempts.length - 1];
      const m = latest?.topicMastery?.[t.id];
      const score = m === 'mastered' ? 90 : m === 'learning' ? 65 : 45;
      return {
        id: `commute-weak-${idx}`,
        title: `Priority Growth Area: ${t.name}`,
        detail: `Current mastery estimate: ${score}%. Reviewing foundation concepts.`,
        textToSpeak: `Priority review for ${t.name}. Current mastery estimate is ${score} percent. Focus on fundamental terminology and underlying steps.`,
        type: 'weak_topic',
      };
    });

  return (
    <>
      {/* 1. Pre-Test / On-Demand Centering Breath */}
      {showCalmModal && (
        <PreTestCalmScreen
          onComplete={() => setShowCalmModal(false)}
          onSkip={() => setShowCalmModal(false)}
        />
      )}

      {/* 2. Break Suggestion Modal */}
      <BreakSuggestionModal
        isOpen={showBreakModal}
        breakType={breakType}
        intervalMinutes={effectiveBreakMinutes}
        relaxMode={store.relaxMode}
        onTakeBreak={handleTakeBreak}
        onSnooze={handleSnoozeBreak}
        onDismiss={handleDismissBreak}
      />

      {/* 3. Late Night Circadian Nudge */}
      <LateNightNudge
        isOpen={showLateNightNudge}
        lateNightHour={store.lateNightHour}
        tomorrowQuests={topics.slice(0, 2).map((t) => ({
          title: `Master ${t.name}`,
          topicName: t.name,
        }))}
        onDismiss={handleDismissLateNight}
        onOpenPlanner={() => {
          handleDismissLateNight();
          if (typeof window !== 'undefined') window.location.href = '/revision';
        }}
      />

      {/* 4. Commute Mode Audio Dialog */}
      <CommuteModeDialog
        isOpen={showCommuteModal}
        onClose={() => setShowCommuteModal(false)}
        flashcardItems={sampleFlashcards}
        noteItems={sampleNotes}
        weakTopicItems={sampleWeakTopics.length > 0 ? sampleWeakTopics : sampleFlashcards}
      />
    </>
  );
}
