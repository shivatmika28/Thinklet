import { Attempt, Topic, Plan, PlanSession } from '../types';

export interface PlanDiff {
  added: PlanSession[];
  removed: PlanSession[];
  reordered: boolean;
  shiftedFocus: { topicId: string; oldFocus: string; newFocus: string }[];
  changed: string[];
}

export function buildPlan(attempt: Attempt, topics: Topic[]): Plan {
  const mastery = attempt.topicMastery || {};
  const weakTopics = topics.filter(t => mastery[t.id] === 'weak');
  const learningTopics = topics.filter(t => mastery[t.id] === 'learning');
  const masteredTopics = topics.filter(t => mastery[t.id] === 'mastered');

  const sessions: PlanSession[] = [];
  const primaryTopic = weakTopics[0] || learningTopics[0] || topics[0] || { id: 'topic-1', name: 'General' };
  const secondaryTopic = weakTopics[1] || learningTopics[0] || topics[1] || primaryTopic;
  const tertiaryTopic = learningTopics[1] || masteredTopics[0] || topics[2] || primaryTopic;

  // Day 1: High-yield remediation on weakest topic
  sessions.push({
    day: 1,
    topicId: primaryTopic.id,
    focus: `Core definitions, key mechanisms, and foundational concepts for ${primaryTopic.name}.`,
    durationMinutes: 30
  });

  // Day 2: Targeted practice on primary & secondary weak areas
  sessions.push({
    day: 2,
    topicId: secondaryTopic.id,
    focus: `High-yield questions and active recall practice for ${secondaryTopic.name}.`,
    durationMinutes: 25
  });

  // Day 3: Conceptual clarity and process sequencing
  sessions.push({
    day: 3,
    topicId: primaryTopic.id,
    focus: `Step-by-step visual mapping and flowchart review for ${primaryTopic.name}.`,
    durationMinutes: 25
  });

  // Day 4: Deep dive into intermediate learning concepts
  sessions.push({
    day: 4,
    topicId: tertiaryTopic.id,
    focus: `Reviewing nuances, edge cases, and exam-level keywords for ${tertiaryTopic.name}.`,
    durationMinutes: 20
  });

  // Day 5: Cross-topic comparative practice
  sessions.push({
    day: 5,
    topicId: secondaryTopic.id,
    focus: `Timed rapid-fire questions and misconception clearing for ${secondaryTopic.name}.`,
    durationMinutes: 20
  });

  // Day 6: Self-testing and teach-back verification
  sessions.push({
    day: 6,
    topicId: primaryTopic.id,
    focus: `Teach-back challenge and answer evaluation for ${primaryTopic.name}.`,
    durationMinutes: 25
  });

  // Day 7: Comprehensive exam readiness consolidation
  sessions.push({
    day: 7,
    topicId: tertiaryTopic.id,
    focus: `Full exam-readiness mock review covering all interconnected topics.`,
    durationMinutes: 30
  });

  return {
    id: `plan-${Date.now()}`,
    createdAt: Date.now(),
    sessions
  };
}

export function diffPlans(planA: Plan, planB: Plan): PlanDiff {
  const added: PlanSession[] = [];
  const removed: PlanSession[] = [];
  const shiftedFocus: { topicId: string; oldFocus: string; newFocus: string }[] = [];

  const mapA = new Map<number, PlanSession>(planA.sessions.map(s => [s.day, s]));
  const mapB = new Map<number, PlanSession>(planB.sessions.map(s => [s.day, s]));

  for (const sessionB of planB.sessions) {
    const sessionA = mapA.get(sessionB.day);
    if (!sessionA) {
      added.push(sessionB);
    } else if (sessionA.topicId !== sessionB.topicId) {
      shiftedFocus.push({
        topicId: sessionB.topicId,
        oldFocus: sessionA.focus,
        newFocus: sessionB.focus
      });
    } else if (sessionA.focus !== sessionB.focus) {
      shiftedFocus.push({
        topicId: sessionB.topicId,
        oldFocus: sessionA.focus,
        newFocus: sessionB.focus
      });
    }
  }

  for (const sessionA of planA.sessions) {
    if (!mapB.has(sessionA.day)) {
      removed.push(sessionA);
    }
  }

  const reordered = planA.sessions.some((s, idx) => {
    const sB = planB.sessions[idx];
    return sB && s.topicId !== sB.topicId;
  });

  const changed: string[] = shiftedFocus.map(
    s => `Adjusted session focus for topic: "${s.newFocus}"`
  );
  if (reordered) {
    changed.push('Reordered session sequence for optimal spaced retention.');
  }

  return {
    added,
    removed,
    reordered,
    shiftedFocus,
    changed
  };
}
