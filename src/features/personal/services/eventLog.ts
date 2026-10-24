"use client";

/**
 * Thinklet Personal Event Log Service
 * Lightweight append-only event log capped at 2,000 entries,
 * rolled into daily summaries.
 */

import {
  PersonalEventType,
  PersonalEvent,
  DailySummary,
} from '../types';
import {
  loadPersonalStore,
  savePersonalStore,
  MAX_EVENT_LOG_SIZE,
} from './personalStore';

export function logPersonalEvent(
  type: PersonalEventType,
  options?: {
    documentId?: string;
    topicId?: string;
    meta?: Record<string, unknown>;
  }
): void {
  if (typeof window === 'undefined') return;

  const currentStore = loadPersonalStore();

  // If student paused personalisation, do not record events
  if (currentStore.pausePersonalisation) {
    return;
  }

  // If document was forgotten by student, do not log for this document
  if (options?.documentId && currentStore.forgottenDocIds.includes(options.documentId)) {
    return;
  }

  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];

  const newEvent: PersonalEvent = {
    id: `pe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    timestamp: now.getTime(),
    date: dateKey,
    documentId: options?.documentId,
    topicId: options?.topicId,
    meta: options?.meta,
  };

  savePersonalStore((prev) => {
    // 1. Append event and cap at MAX_EVENT_LOG_SIZE
    const nextEvents = [...prev.events, newEvent];
    const cappedEvents =
      nextEvents.length > MAX_EVENT_LOG_SIZE
        ? nextEvents.slice(-MAX_EVENT_LOG_SIZE)
        : nextEvents;

    // 2. Roll into daily summaries
    const currentSummary: DailySummary = prev.dailySummaries[dateKey] || {
      date: dateKey,
      studyMinutes: 0,
      sessionsCount: 0,
      quizzesCompleted: 0,
      questionsAnswered: 0,
      flashcardsReviewed: 0,
      questsCompleted: 0,
    };

    const updatedSummary = { ...currentSummary };

    switch (type) {
      case 'session_start':
        updatedSummary.sessionsCount += 1;
        break;
      case 'session_stop':
        if (typeof options?.meta?.minutes === 'number') {
          updatedSummary.studyMinutes += Math.round(options.meta.minutes);
        }
        break;
      case 'quiz_answered':
        updatedSummary.questionsAnswered += 1;
        break;
      case 'quiz_finished':
        updatedSummary.quizzesCompleted += 1;
        break;
      case 'quest_completed':
        updatedSummary.questsCompleted += 1;
        break;
      case 'flashcard_reviewed':
        updatedSummary.flashcardsReviewed += 1;
        break;
    }

    return {
      ...prev,
      events: cappedEvents,
      dailySummaries: {
        ...prev.dailySummaries,
        [dateKey]: updatedSummary,
      },
    };
  });
}

// --------------------------------------------------------------------------
// Convenient single-line hook helpers
// --------------------------------------------------------------------------

export function logSessionStart(documentId?: string) {
  logPersonalEvent('session_start', { documentId });
}

export function logSessionStop(minutes: number, documentId?: string) {
  logPersonalEvent('session_stop', { documentId, meta: { minutes } });
}

export function logQuizAnswered(topicId?: string, isCorrect?: boolean) {
  logPersonalEvent('quiz_answered', { topicId, meta: { isCorrect } });
}

export function logQuizFinished(score: number, totalQuestions: number, topicId?: string) {
  logPersonalEvent('quiz_finished', {
    topicId,
    meta: { score, totalQuestions },
  });
}

export function logQuestCompleted(taskId: string, topicId?: string) {
  logPersonalEvent('quest_completed', { topicId, meta: { taskId } });
}

export function logFlashcardReviewed(cardId: string, remembered: boolean, topicId?: string) {
  logPersonalEvent('flashcard_reviewed', {
    topicId,
    meta: { cardId, remembered },
  });
}

export function logDocumentOpened(documentId: string) {
  logPersonalEvent('document_opened', { documentId });
}
