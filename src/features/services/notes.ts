import { Topic, PageText } from '../../types';
import { askJson } from '../../services/gemini';
import { contextOf, verifyQuote } from '../../utils/verify';
import { NoteItem, FeatureSettings } from '../types.ext';
import { getStyleSuffix } from '../promptStyle';
import { loadFeatureStore, saveFeatureStore } from './featureStore';

export interface GenerateNoteOptions {
  topic: Topic;
  pages: PageText[];
  type: 'key_points' | 'definitions' | 'formulas' | 'mnemonic';
  materialId?: string;
  settings?: FeatureSettings;
}

export async function generateTopicNote({
  topic,
  pages,
  type,
  materialId,
  settings
}: GenerateNoteOptions): Promise<NoteItem> {
  const context = contextOf(topic, pages);

  const typeDescriptions: Record<string, string> = {
    key_points: 'a concise list of high-yield bullet points summarizing the core concepts and mechanisms.',
    definitions: 'a glossary of key scientific/technical terms and their exact definitions.',
    formulas: 'all chemical, biological, or mathematical formulas, reaction steps, or stoichiometric equations.',
    mnemonic: 'a catchy, memorable mnemonic (acronym or memorable sentence) designed to easily recall the sequence or components of this topic.'
  };

  const styleSuffix = settings ? getStyleSuffix(settings) : '';
  const prompt = `Generate ${typeDescriptions[type]} for the topic "${topic.name}" based ONLY on the supplied study material.
You must cite an EXACT verbatim quote from the material and specify the page reference.
${styleSuffix ? '\n' + styleSuffix : ''}

Study Material:
${context}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      content: { type: 'STRING' },
      pageReferences: { type: 'ARRAY', items: { type: 'INTEGER' } },
      verbatimQuote: { type: 'STRING' }
    },
    required: ['title', 'content', 'pageReferences', 'verbatimQuote']
  };

  try {
    const res = await askJson<{
      title: string;
      content: string;
      pageReferences: number[];
      verbatimQuote: string;
    }>(
      prompt,
      schema,
      v => Boolean(v && ((v as any).content || (v as any).high_yield_summary || (v as any).summary || (v as any).key_points || (v as any).bullet_points || (v as any).points || (v as any).title || (v as any).topic))
    );

    let finalContent = '';
    const structuredItems = (res as any).high_yield_summary || (res as any).summary || (res as any).key_points || (res as any).bullet_points || (res as any).points;
    if (Array.isArray(structuredItems)) {
      finalContent = structuredItems.map((item: any) => {
        if (typeof item === 'string') return `• ${item}`;
        if (item.concept && item.details) return `• **${item.concept}**: ${item.details}`;
        if (item.term && item.definition) return `• **${item.term}**: ${item.definition}`;
        if (item.point || item.description) return `• ${item.point || item.description}`;
        return `• ${JSON.stringify(item)}`;
      }).join('\n\n');
    } else {
      finalContent = String((res as any).content || structuredItems || `${topic.name} summary based on study notes.`);
    }

    const firstItemQuote = Array.isArray(structuredItems) && structuredItems[0]?.verbatim_quote
      ? structuredItems[0].verbatim_quote
      : '';
    const quoteToVerify = res.verbatimQuote || firstItemQuote || topic.summary;

    const verified = verifyQuote(quoteToVerify, pages);
    const pagesRef = verified.verified && verified.page ? [verified.page] : (res.pageReferences || []);

    const newNote: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      topicId: topic.id,
      materialId,
      title: res.title || (res as any).topic || `${topic.name} (${type.replace('_', ' ')})`,
      type,
      content: finalContent,
      pageReferences: pagesRef.length > 0 ? pagesRef : topic.pages,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save note to featureStore
    const store = loadFeatureStore();
    saveFeatureStore({
      notes: [newNote, ...store.notes]
    });

    return newNote;
  } catch (err) {
    console.warn('Note generation failed, providing fallback note', err);

    let fallbackContent = topic.summary;
    if (type === 'mnemonic') {
      const words = topic.name.split(' ');
      const acronym = words.map(w => w[0]?.toUpperCase()).join('');
      fallbackContent = `Mnemonic (${acronym}): ${words.map(w => `${w[0]?.toUpperCase()} - ${w}`).join(', ')}. Helps recall ${topic.name}.`;
    } else if (type === 'definitions') {
      fallbackContent = `${topic.name}: ${topic.summary}`;
    }

    const fallbackNote: NoteItem = {
      id: `note-${Date.now()}`,
      topicId: topic.id,
      materialId,
      title: `${topic.name} (${type.replace('_', ' ')})`,
      type,
      content: fallbackContent,
      pageReferences: topic.pages,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const store = loadFeatureStore();
    saveFeatureStore({
      notes: [fallbackNote, ...store.notes]
    });

    return fallbackNote;
  }
}

export function updateNote(noteId: string, title: string, content: string): NoteItem[] {
  const store = loadFeatureStore();
  const updated = store.notes.map(n => {
    if (n.id === noteId) {
      return { ...n, title, content, updatedAt: Date.now() };
    }
    return n;
  });
  saveFeatureStore({ notes: updated });
  return updated;
}

export function deleteNote(noteId: string): NoteItem[] {
  const store = loadFeatureStore();
  const updated = store.notes.filter(n => n.id !== noteId);
  saveFeatureStore({ notes: updated });
  return updated;
}
