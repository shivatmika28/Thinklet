import { Topic, PageText } from '../../types';
import { askJson } from '../../services/gemini';
import { contextOf } from '../../utils/verify';
import { QuestionLevel, QuestionX, PracticePaperResult, FeatureSettings } from '../types.ext';
import { getStyleSuffix } from '../promptStyle';
import { checkAnswer } from './checker';
import { loadFeatureStore, saveFeatureStore } from './featureStore';

export const PRACTICE_PAPER_FORMAT = {
  sectionA: { title: 'Section A: Multiple Choice', type: 'mcq' as const, count: 5, marksPerQ: 1 },
  sectionB: { title: 'Section B: True / False', type: 'true_false' as const, count: 3, marksPerQ: 1 },
  sectionC: { title: 'Section C: Fill-in-the-Blank', type: 'fill_in_the_blank' as const, count: 3, marksPerQ: 2 },
  sectionD: { title: 'Section D: Short Answer Conceptual', type: 'short_answer' as const, count: 2, marksPerQ: 3 }
};

export interface GeneratePaperOptions {
  topics: Topic[];
  pages: PageText[];
  level: QuestionLevel;
  selectedTopicIds?: string[];
  materialId?: string;
  settings?: FeatureSettings;
}

export async function generatePracticePaper({
  topics,
  pages,
  level,
  selectedTopicIds,
  materialId,
  settings
}: GeneratePaperOptions): Promise<QuestionX[]> {
  const chosenTopics = selectedTopicIds && selectedTopicIds.length > 0
    ? topics.filter(t => selectedTopicIds.includes(t.id))
    : topics;

  const effectiveTopics = chosenTopics.length > 0 ? chosenTopics : topics;
  const context = effectiveTopics.map(t => contextOf(t, pages)).join('\n\n');
  const topicListStr = effectiveTopics.map(t => `${t.id}: ${t.name}`).join('; ');

  const styleSuffix = settings ? getStyleSuffix(settings) : '';
  const prompt = `Generate a complete structured practice examination paper based ONLY on the provided study material.
Target topics: ${topicListStr}
Difficulty Level: ${level}
${styleSuffix ? '\n' + styleSuffix : ''}

Paper Specifications:
1. Section A: Exactly ${PRACTICE_PAPER_FORMAT.sectionA.count} multiple choice questions (1 mark each, 4 options).
2. Section B: Exactly ${PRACTICE_PAPER_FORMAT.sectionB.count} True/False questions (1 mark each, options ["True", "False"], answerIndex 0 for True or 1 for False).
3. Section C: Exactly ${PRACTICE_PAPER_FORMAT.sectionC.count} Fill-in-the-Blank questions (2 marks each). Text must have a blank indicated by "_____". Provide an array of acceptable variations in acceptedAnswers.
4. Section D: Exactly ${PRACTICE_PAPER_FORMAT.sectionD.count} Short Answer conceptual questions (3 marks each).

For EVERY question, you must supply:
- id: unique string
- topicId: matching topic ID from target topics
- section: "A", "B", "C", or "D"
- text: clear question text
- page: page number where this fact appears in material
- quote: exact verbatim quote from the page
- marks: number of marks (Section A: 1, Section B: 1, Section C: 2, Section D: 3)
- level: "${level}"

Study Material:
${context}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      questions: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            topicId: { type: 'STRING' },
            section: { type: 'STRING' },
            text: { type: 'STRING' },
            options: { type: 'ARRAY', items: { type: 'STRING' } },
            answerIndex: { type: 'INTEGER' },
            explanation: { type: 'STRING' },
            quote: { type: 'STRING' },
            page: { type: 'INTEGER' },
            marks: { type: 'INTEGER' },
            acceptedAnswers: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['id', 'topicId', 'section', 'text', 'explanation', 'quote', 'page', 'marks']
        }
      }
    },
    required: ['questions']
  };

  const topicNameMap = new Map(topics.map(t => [t.id, t.name]));

  try {
    const res = await askJson<{ questions: QuestionX[] }>(
      prompt,
      schema,
      v => Boolean(v && Array.isArray((v as any).questions) && (v as any).questions.length > 0)
    );

    return res.questions.map((q, idx) => ({
      ...q,
      id: q.id || `q-${idx}-${Date.now()}`,
      level,
      targets: `Targets: ${topicNameMap.get(q.topicId) || q.topicId}, page ${q.page}`
    }));
  } catch (err) {
    console.warn('Practice paper LLM generation failed, generating grounded fallback paper', err);
    return createFallbackPaper(effectiveTopics, pages, level);
  }
}

function createFallbackPaper(topics: Topic[], pages: PageText[], level: QuestionLevel): QuestionX[] {
  const result: QuestionX[] = [];
  let qCounter = 1;

  // Section A: 5 MCQs
  for (let i = 0; i < PRACTICE_PAPER_FORMAT.sectionA.count; i++) {
    const topic = topics[i % topics.length];
    const pageNum = topic.pages[0] || 1;
    result.push({
      id: `fallback-a-${qCounter++}`,
      topicId: topic.id,
      section: 'A',
      level,
      marks: 1,
      targets: `Targets: ${topic.name}, page ${pageNum}`,
      text: `Which statement accurately reflects the principles of ${topic.name}?`,
      options: [
        topic.summary || `Primary concept defined on Page ${pageNum}`,
        'It is unrelated to the primary findings described in the text.',
        'It contradicts the core definitions presented in this material.',
        'It represents an unsupported claim not discussed in the document.'
      ],
      answerIndex: 0,
      explanation: `Grounded in topic definition on Page ${pageNum}: ${topic.summary}`,
      quote: topic.summary || topic.name,
      page: pageNum,
      type: 'mcq'
    });
  }

  // Section B: 3 True/False
  for (let i = 0; i < PRACTICE_PAPER_FORMAT.sectionB.count; i++) {
    const topic = topics[i % topics.length];
    const pageNum = topic.pages[0] || 1;
    const isTrue = i % 2 === 0;
    result.push({
      id: `fallback-b-${qCounter++}`,
      topicId: topic.id,
      section: 'B',
      level,
      marks: 1,
      targets: `Targets: ${topic.name}, page ${pageNum}`,
      text: isTrue
        ? `True or False: ${topic.name} is described as: "${topic.summary}".`
        : `True or False: ${topic.name} is completely omitted and unsupported in the source material.`,
      options: ['True', 'False'],
      answerIndex: isTrue ? 0 : 1,
      explanation: `Based on syllabus material on page ${pageNum}.`,
      quote: topic.summary || topic.name,
      page: pageNum,
      type: 'true_false'
    });
  }

  // Section C: 3 Fill-in-the-Blank
  for (let i = 0; i < PRACTICE_PAPER_FORMAT.sectionC.count; i++) {
    const topic = topics[i % topics.length];
    const pageNum = topic.pages[0] || 1;
    const keyTerm = topic.name.split(' ')[0] || topic.name;
    result.push({
      id: `fallback-c-${qCounter++}`,
      topicId: topic.id,
      section: 'C',
      level,
      marks: 2,
      targets: `Targets: ${topic.name}, page ${pageNum}`,
      text: `The core concept discussed in this section is _____ (associated with ${topic.name}).`,
      options: [],
      answerIndex: -1,
      acceptedAnswers: [keyTerm, keyTerm.toLowerCase(), topic.name, topic.name.toLowerCase()],
      explanation: `Key concept identified as ${keyTerm}.`,
      quote: topic.summary || topic.name,
      page: pageNum,
      type: 'fill_in_the_blank'
    });
  }

  // Section D: 2 Short Answer
  for (let i = 0; i < PRACTICE_PAPER_FORMAT.sectionD.count; i++) {
    const topic = topics[i % topics.length];
    const pageNum = topic.pages[0] || 1;
    result.push({
      id: `fallback-d-${qCounter++}`,
      topicId: topic.id,
      section: 'D',
      level,
      marks: 3,
      targets: `Targets: ${topic.name}, page ${pageNum}`,
      text: `Explain the primary significance and core principles of ${topic.name} as detailed on Page ${pageNum}.`,
      options: [],
      answerIndex: -1,
      explanation: `Discusses key details according to page ${pageNum}.`,
      quote: topic.summary || topic.name,
      page: pageNum,
      type: 'short_answer'
    });
  }

  return result;
}

export function normalizeAnswer(str: string): string {
  return str.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

export interface PaperGradingResult {
  paperResult: PracticePaperResult;
  questionDetails: {
    question: QuestionX;
    userAnswer: string | number;
    isCorrect: boolean;
    scoredMarks: number;
    feedback?: string;
  }[];
}

export async function gradePracticePaper(
  questions: QuestionX[],
  userAnswers: Record<string, string | number>,
  pages: PageText[],
  topics: Topic[],
  materialId?: string,
  settings?: FeatureSettings
): Promise<PaperGradingResult> {
  let scoredMarks = 0;
  let totalMarks = 0;
  const questionDetails: PaperGradingResult['questionDetails'] = [];

  for (const q of questions) {
    const marks = q.marks || 1;
    totalMarks += marks;
    const ans = userAnswers[q.id];

    if (q.section === 'A' || q.section === 'B') {
      // MCQ & True/False evaluated in plain code
      const isCorrect = typeof ans === 'number' && ans === q.answerIndex;
      const questionScored = isCorrect ? marks : 0;
      scoredMarks += questionScored;
      questionDetails.push({
        question: q,
        userAnswer: ans !== undefined ? ans : 'No answer',
        isCorrect,
        scoredMarks: questionScored,
        feedback: isCorrect
          ? 'Correct!'
          : `Correct answer was: ${
              typeof q.answerIndex === 'number' && q.options
                ? q.options[q.answerIndex]
                : 'Option ' + (q.answerIndex ?? '')
            }`
      });
    } else if (q.section === 'C') {
      // Fill-in-the-blank evaluated against acceptedAnswers in plain code
      const userText = typeof ans === 'string' ? ans : '';
      const normUser = normalizeAnswer(userText);
      const accepted = (q.acceptedAnswers || []).map(normalizeAnswer);
      const isCorrect = normUser.length > 0 && accepted.some(acc => acc === normUser || normUser.includes(acc));
      const questionScored = isCorrect ? marks : 0;
      scoredMarks += questionScored;
      questionDetails.push({
        question: q,
        userAnswer: userText || 'Blank',
        isCorrect,
        scoredMarks: questionScored,
        feedback: isCorrect ? 'Correct!' : `Accepted answers: ${(q.acceptedAnswers || []).join(', ')}`
      });
    } else {
      // Section D: Short Answer through Answer Checker
      const userText = typeof ans === 'string' ? ans : '';
      const topic = topics.find(t => t.id === q.topicId) || topics[0];
      const context = topic ? contextOf(topic, pages) : pages.map(p => p.text).join('\n\n');

      const evaluation = await checkAnswer({
        question: q.text,
        studentAnswer: userText,
        context,
        pages,
        topicId: q.topicId,
        materialId,
        settings
      });

      // Award proportional marks in plain code
      const questionScored = Math.round(evaluation.score * marks * 10) / 10;
      scoredMarks += questionScored;
      questionDetails.push({
        question: q,
        userAnswer: userText || 'No response',
        isCorrect: evaluation.verdict === 'correct',
        scoredMarks: questionScored,
        feedback: `Verdict: ${evaluation.verdict.toUpperCase()} (${Math.round(evaluation.score * 100)}%). ${evaluation.misconception || ''}`
      });
    }
  }

  const finalScore = totalMarks > 0 ? Math.round((scoredMarks / totalMarks) * 100) : 0;

  const paperResult: PracticePaperResult = {
    id: `paper-${Date.now()}`,
    timestamp: Date.now(),
    topicIds: Array.from(new Set(questions.map(q => q.topicId))),
    materialId,
    level: questions[0]?.level || 'Mixed',
    questions,
    userAnswers,
    score: finalScore,
    totalMarks,
    scoredMarks: Math.round(scoredMarks * 10) / 10
  };

  // Save to feature store
  const store = loadFeatureStore();
  saveFeatureStore({
    practicePapers: [paperResult, ...store.practicePapers.slice(0, 49)]
  });

  return { paperResult, questionDetails };
}
