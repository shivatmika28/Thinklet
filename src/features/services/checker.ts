import { PageText } from '../../types';
import { verifyQuote } from '../../utils/verify';
import { askJson } from '../../services/gemini';
import { AnswerCheckRecord, FeatureSettings } from '../types.ext';
import { getStyleSuffix } from '../promptStyle';
import { loadFeatureStore, saveFeatureStore } from './featureStore';

export interface CheckAnswerOptions {
  question: string;
  studentAnswer: string;
  context: string;
  pages: PageText[];
  topicId?: string;
  materialId?: string;
  isTeachBack?: boolean;
  settings?: FeatureSettings;
}

export async function checkAnswer({
  question,
  studentAnswer,
  context,
  pages,
  topicId,
  materialId,
  isTeachBack = false,
  settings
}: CheckAnswerOptions): Promise<AnswerCheckRecord> {
  const trimmedAnswer = studentAnswer.trim();
  if (!trimmedAnswer) {
    return {
      id: `check-${Date.now()}`,
      timestamp: Date.now(),
      question,
      studentAnswer,
      topicId,
      materialId,
      verdict: 'incorrect',
      score: 0,
      misconception: 'No answer provided.',
      missingPoints: ['Provide a written explanation based on the material.'],
      alternatives: [],
      evidenceQuote: '',
      page: 1,
      verified: false,
      isTeachBack
    };
  }

  const styleSuffix = settings ? getStyleSuffix(settings) : '';
  const prompt = isTeachBack
    ? `You are an expert grading tutor. The student was asked to teach-back / explain the following concept in their own words:
Concept/Prompt: "${question}"

Student's Explanation:
"${trimmedAnswer}"

Study Material:
${context}

Evaluate the student's understanding based ONLY on the supplied study material.
Cite an EXACT verbatim quote from the material that verifies your evaluation and specify the exact page number.
${styleSuffix ? '\n' + styleSuffix : ''}
Schema requirements:
- score: decimal between 0.0 and 1.0 (accuracy and completeness).
- misconception: string explaining any factual misunderstanding or confusion, or null if none.
- missingPoints: array of critical points or keywords from the material that the student missed.
- alternatives: array of 1-2 alternate clear ways to state or explain this concept.
- evidenceQuote: EXACT verbatim quote from the text supporting the explanation.
- page: integer page number of the quote.`
    : `You are an expert grading tutor. Evaluate the student's answer to the following question based ONLY on the supplied study material.
Question: "${question}"

Student's Answer:
"${trimmedAnswer}"

Study Material:
${context}

Evaluate the answer strictly based ONLY on the supplied study material.
Cite an EXACT verbatim quote from the material that verifies your evaluation and specify the exact page number.
${styleSuffix ? '\n' + styleSuffix : ''}
Schema requirements:
- score: decimal between 0.0 and 1.0 (accuracy and completeness).
- misconception: string explaining any factual error in the student's answer, or null if none.
- missingPoints: array of key criteria or facts from the material that the student omitted.
- alternatives: array of 1-2 other acceptable ways to phrase or solve this.
- evidenceQuote: EXACT verbatim quote from the text supporting the correct answer.
- page: integer page number of the quote.`;

  const schema = {
    type: 'OBJECT',
    properties: {
      score: { type: 'NUMBER' },
      misconception: { type: 'STRING', nullable: true },
      missingPoints: { type: 'ARRAY', items: { type: 'STRING' } },
      alternatives: { type: 'ARRAY', items: { type: 'STRING' } },
      evidenceQuote: { type: 'STRING' },
      page: { type: 'INTEGER' }
    },
    required: ['score', 'missingPoints', 'alternatives', 'evidenceQuote', 'page']
  };

  try {
    const raw = await askJson<{
      score: number;
      misconception: string | null;
      missingPoints: string[];
      alternatives: string[];
      evidenceQuote: string;
      page: number;
    }>(
      prompt,
      schema,
      v => Boolean(v && typeof (v as any).score === 'number' && typeof (v as any).evidenceQuote === 'string')
    );

    // Rule 7 & 8: Verify evidenceQuote in code with verifyQuote
    const quoteVerification = verifyQuote(raw.evidenceQuote, pages);
    const verified = quoteVerification.verified;

    // Rule 7: Map the score to verdict thresholds in plain code
    const numericScore = Math.max(0, Math.min(1, raw.score));
    let verdict: 'correct' | 'partial' | 'incorrect';
    if (numericScore >= 0.8) {
      verdict = 'correct';
    } else if (numericScore >= 0.4) {
      verdict = 'partial';
    } else {
      verdict = 'incorrect';
    }

    const record: AnswerCheckRecord = {
      id: `check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      question,
      studentAnswer: trimmedAnswer,
      topicId,
      materialId,
      verdict,
      score: Math.round(numericScore * 100) / 100,
      misconception: raw.misconception || null,
      missingPoints: Array.isArray(raw.missingPoints) ? raw.missingPoints : [],
      alternatives: Array.isArray(raw.alternatives) ? raw.alternatives : [],
      evidenceQuote: verified ? (quoteVerification.exact || raw.evidenceQuote) : raw.evidenceQuote,
      page: verified ? (quoteVerification.page ?? raw.page) : raw.page,
      verified,
      isTeachBack
    };

    // Save record to feature store
    const store = loadFeatureStore();
    saveFeatureStore({
      answerChecks: [record, ...store.answerChecks.slice(0, 99)]
    });

    return record;
  } catch (err) {
    console.warn('Answer checker LLM call failed, providing grounded fallback', err);

    // Fallback: Check if student answer contains keywords from context
    const words = trimmedAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matched = words.filter(w => context.toLowerCase().includes(w));
    const ratio = words.length > 0 ? matched.length / words.length : 0;
    const score = Math.round(ratio * 100) / 100;
    const verdict = score >= 0.7 ? 'correct' : score >= 0.35 ? 'partial' : 'incorrect';

    const fallbackRecord: AnswerCheckRecord = {
      id: `check-${Date.now()}`,
      timestamp: Date.now(),
      question,
      studentAnswer: trimmedAnswer,
      topicId,
      materialId,
      verdict,
      score,
      misconception: score < 0.5 ? 'Answer could not be fully confirmed against textbook material.' : null,
      missingPoints: ['Review textbook definitions for detailed terminology.'],
      alternatives: ['Refer to the chapter summary for standard wording.'],
      evidenceQuote: context.slice(0, 120) + '...',
      page: pages[0]?.page || 1,
      verified: false,
      isTeachBack
    };

    const store = loadFeatureStore();
    saveFeatureStore({
      answerChecks: [fallbackRecord, ...store.answerChecks.slice(0, 99)]
    });

    return fallbackRecord;
  }
}
