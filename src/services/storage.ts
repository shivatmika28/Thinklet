import { CoreState, PageText, Topic, Attempt } from '../types';
import { DEMO_PAGES, DEMO_TOPICS } from '../lib/demo-data';

export const CORE_STORAGE_KEY = 'learnmate.core.v1';

const DEFAULT_PAGES: PageText[] = DEMO_PAGES.map(p => ({
  page: p.pageNumber,
  text: p.text,
  label: `Page ${p.pageNumber}`
}));

const DEFAULT_TOPICS: Topic[] = DEMO_TOPICS.map((t, idx) => ({
  id: `topic-${idx + 1}`,
  name: t.name,
  description: t.description,
  summary: t.description,
  pages: [1, 2],
  order: idx + 1
}));

const DEFAULT_ATTEMPTS: Attempt[] = [
  {
    id: 'att-baseline',
    timestamp: Date.now() - 86400000,
    score: 80,
    totalQuestions: 5,
    topicMastery: {
      'topic-1': 'mastered',
      'topic-2': 'learning',
      'topic-3': 'weak'
    },
    answers: {
      q1: { confidence: 'sure', selected: 0, isCorrect: true },
      q2: { confidence: 'sure', selected: 1, isCorrect: true },
      q3: { confidence: 'unsure', selected: 2, isCorrect: true },
      q4: { confidence: 'guess', selected: 3, isCorrect: true },
      q5: { confidence: 'unsure', selected: 0, isCorrect: false }
    }
  }
];

export function load(): CoreState {
  if (typeof window === 'undefined') {
    return {
      pages: DEFAULT_PAGES,
      topics: DEFAULT_TOPICS,
      attempts: DEFAULT_ATTEMPTS,
      plan: null
    };
  }

  try {
    const raw = localStorage.getItem(CORE_STORAGE_KEY);
    if (!raw) {
      const initial: CoreState = {
        pages: DEFAULT_PAGES,
        topics: DEFAULT_TOPICS,
        attempts: DEFAULT_ATTEMPTS,
        plan: null
      };
      localStorage.setItem(CORE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw);
    return {
      pages: parsed.pages || DEFAULT_PAGES,
      topics: parsed.topics || DEFAULT_TOPICS,
      attempts: parsed.attempts || DEFAULT_ATTEMPTS,
      plan: parsed.plan || null
    };
  } catch (err) {
    console.warn('Failed to parse core storage', err);
    return {
      pages: DEFAULT_PAGES,
      topics: DEFAULT_TOPICS,
      attempts: DEFAULT_ATTEMPTS,
      plan: null
    };
  }
}

export function save(state: CoreState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CORE_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save core storage', err);
  }
}
