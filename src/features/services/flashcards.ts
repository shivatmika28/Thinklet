import { Topic, PageText } from '../../types';
import { askJson } from '../../services/gemini';
import { contextOf, verifyQuote } from '../../utils/verify';
import { FlashcardItem, FeatureSettings } from '../types.ext';
import { getStyleSuffix } from '../promptStyle';
import { loadFeatureStore, saveFeatureStore } from './featureStore';
import { recordTopicReview } from './spaced';
import { getUnifiedTopicMastery } from './mastery';

export interface GenerateFlashcardsOptions {
  topics: Topic[];
  pages: PageText[];
  materialId?: string;
  settings?: FeatureSettings;
}

export async function generateFlashcardsForWeakTopics({
  topics,
  pages,
  materialId,
  settings
}: GenerateFlashcardsOptions): Promise<FlashcardItem[]> {
  if (topics.length === 0) {
    return [];
  }

  // Target weak and learning topics only
  const unified = getUnifiedTopicMastery(topics);
  const targetTopics = topics.filter(t => {
    const u = unified.find(item => item.topicId === t.id);
    return u?.mastery === 'weak' || u?.mastery === 'learning';
  });

  const effectiveTopics = targetTopics.length > 0 ? targetTopics : topics;
  const context = effectiveTopics.map(t => `[Topic: ${t.name}]\n${contextOf(t, pages)}`).join('\n\n');

  const styleSuffix = settings ? getStyleSuffix(settings) : '';
  const prompt = `Generate a set of high-yield active recall flashcards targeting ONLY the supplied weak and learning topics.
For each flashcard:
- topicId: matching topic ID
- front: concise question, term, or prompt
- back: clear, grounded answer
- quote: exact verbatim quote from the page supporting this answer
- page: integer page number where quote appears
${styleSuffix ? '\n' + styleSuffix : ''}

Study Material:
${context}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      flashcards: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            topicId: { type: 'STRING' },
            front: { type: 'STRING' },
            back: { type: 'STRING' },
            quote: { type: 'STRING' },
            page: { type: 'INTEGER' }
          },
          required: ['topicId', 'front', 'back', 'quote', 'page']
        }
      }
    },
    required: ['flashcards']
  };

  try {
    const res = await askJson<{
      flashcards?: { topicId?: string; front?: string; back?: string; quote?: string; page?: number }[];
      cards?: { topicId?: string; front?: string; back?: string; quote?: string; page?: number }[];
    }>(
      prompt,
      schema,
      v => Boolean(v && (Array.isArray((v as any).flashcards) || Array.isArray((v as any).cards) || Array.isArray(v)))
    );

    const cardList = (res as any).flashcards || (res as any).cards || (Array.isArray(res) ? res : []);
    const now = Date.now();
    const newCards: FlashcardItem[] = cardList.map((c: any, i: number) => {
      const verified = verifyQuote(c.quote || '', pages);
      return {
        id: `card-${now}-${i}`,
        topicId: c.topicId || effectiveTopics[i % effectiveTopics.length].id,
        materialId,
        front: c.front || `Core concept ${i + 1}`,
        back: `${c.back || 'Grounded explanation'}\n\nEvidence (Page ${verified.verified && verified.page ? verified.page : (c.page || 1)}): "${c.quote || ''}"`,
        page: verified.verified && verified.page ? verified.page : (c.page || 1),
        box: 1,
        nextReviewDate: now
      };
    });

    const store = loadFeatureStore();
    saveFeatureStore({
      flashcards: [...newCards, ...store.flashcards]
    });

    return newCards;
  } catch (err) {
    console.warn('Flashcard generation failed, using fallback deck', err);
    const now = Date.now();
    const fallback: FlashcardItem[] = effectiveTopics.map((t, i) => ({
      id: `card-fallback-${now}-${i}`,
      topicId: t.id,
      materialId,
      front: `What is the core concept and principle of ${t.name}?`,
      back: `${t.summary || t.description || 'Review foundational definitions in your study material.'}\n\nEvidence (Page ${t.pages[0] || 1}): "${t.summary || t.name}"`,
      page: t.pages[0] || 1,
      box: 1,
      nextReviewDate: now
    }));

    const store = loadFeatureStore();
    saveFeatureStore({
      flashcards: [...fallback, ...store.flashcards]
    });

    return fallback;
  }
}

export function handleReviewCard(cardId: string, remembered: boolean): FlashcardItem[] {
  const store = loadFeatureStore();
  const now = Date.now();

  const updated = store.flashcards.map(c => {
    if (c.id === cardId) {
      // Feed spaced repetition
      recordTopicReview(c.topicId, remembered);

      let nextBox = c.box;
      let intervalDays = 1;
      if (remembered) {
        nextBox = Math.min(5, c.box + 1);
        intervalDays = nextBox === 2 ? 3 : nextBox === 3 ? 7 : nextBox === 4 ? 14 : 30;
      } else {
        nextBox = 1;
        intervalDays = 1;
      }

      return {
        ...c,
        box: nextBox,
        lastReviewedDate: now,
        nextReviewDate: now + (intervalDays * 24 * 60 * 60 * 1000)
      };
    }
    return c;
  });

  saveFeatureStore({ flashcards: updated });
  return updated;
}

/**
 * Anki CSV Export: Formats cards into CSV string:
 * "Front","Back","Tags"
 */
export function exportCardsToAnkiCSV(cards: FlashcardItem[], topics: Topic[]): string {
  const topicMap = new Map(topics.map(t => [t.id, t.name]));

  const rows = cards.map(c => {
    const topicName = (topicMap.get(c.topicId) || 'General').replace(/"/g, '""');
    const front = c.front.replace(/"/g, '""');
    const back = c.back.replace(/"/g, '""').replace(/\n/g, '<br>');
    return `"${front}","${back}","Thinklet ${topicName}"`;
  });

  return ['#separator:Comma', '#html:true', '#tags column:3', ...rows].join('\n');
}
