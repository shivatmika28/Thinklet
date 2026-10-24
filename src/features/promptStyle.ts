import { FeatureSettings } from './types.ext';
import { loadFeatureStore, DEFAULT_SETTINGS } from './services/featureStore';

export function getStyleSuffix(overrideSettings?: Partial<FeatureSettings>): string {
  try {
    let s: FeatureSettings = DEFAULT_SETTINGS;
    try {
      const store = loadFeatureStore();
      s = store.settings || DEFAULT_SETTINGS;
    } catch {
      s = DEFAULT_SETTINGS;
    }

    if (overrideSettings) {
      s = { ...s, ...overrideSettings };
    }

    const parts: string[] = [];

    // Tone instruction
    if (s.tone === 'friendly') {
      parts.push('Tone: Warm, encouraging, empathetic, conversational, and supportive.');
    } else if (s.tone === 'formal') {
      parts.push('Tone: Formal, academic, precise, and objective.');
    } else if (s.tone === 'exam_coach') {
      parts.push('Tone: Direct exam coach. Highlight high-yield points, key examiner marking schemes, scoring keywords, and common student pitfalls.');
    }

    // Explanation Depth instruction
    if (s.explanationLevel === 'age_12') {
      parts.push("Explanation depth: 'Explain like I am 12'. Use intuitive real-world analogies, straightforward language, and step-by-step clarity. Avoid unnecessary academic jargon.");
    } else if (s.explanationLevel === 'exam_level') {
      parts.push('Explanation depth: Exam level. Emphasize rigorous technical definitions, exact mechanisms, syllabus terminology, and marks-oriented structure.');
    } else {
      parts.push('Explanation depth: Standard undergraduate/high-school depth with balanced conceptual rigor and clarity.');
    }

    // Dyslexia Mode prompt assistance
    if (s.dyslexiaMode) {
      parts.push('Dyslexia accessibility format: Use short, punchy sentences. Present information using clear bullet points and bold key terms. Avoid dense walls of text and complex nested clauses.');
    }

    // Language instructions
    if (s.language === 'Hinglish') {
      parts.push('MANDATORY LANGUAGE DIRECTIVE: Write all explanations, questions, answers, and summaries in conversational Hinglish (Hindi vocabulary written in Latin English alphabet mixed naturally with English academic terminology, e.g. "Photosynthesis ek aisa biological process hai..."). Never use Devanagari script.');
    } else if (s.language === 'Hindi') {
      parts.push('MANDATORY LANGUAGE DIRECTIVE: Write all generated text, questions, options, flashcards, notes, and explanations in clear, modern Hindi script (हिंदी). Retain technical terms/formulas in parentheses.');
    } else if (s.language === 'Tamil') {
      parts.push('MANDATORY LANGUAGE DIRECTIVE: Write all generated text, questions, options, flashcards, notes, and explanations in clear, modern Tamil script (தமிழ்). Retain technical terms/formulas in parentheses.');
    } else if (s.language === 'Bengali') {
      parts.push('MANDATORY LANGUAGE DIRECTIVE: Write all generated text, questions, options, flashcards, notes, and explanations in clear, modern Bengali script (বাংলা). Retain technical terms/formulas in parentheses.');
    } else if (s.language === 'Marathi') {
      parts.push('MANDATORY LANGUAGE DIRECTIVE: Write all generated text, questions, options, flashcards, notes, and explanations in clear, modern Marathi script (मराठी). Retain technical terms/formulas in parentheses.');
    } else {
      parts.push('Language Directive: Clear English.');
    }

    // Invariant quote rule
    parts.push('CRITICAL GROUNDING INVARIANT: Node labels, summaries, questions, and explanations must be written in the specified target language, while verbatim quotes and citations MUST remain in their EXACT original source wording and language (even if English). There is no conflict: write the instructional content in the target language and copy the source evidence quote verbatim.');

    if (parts.length === 0) return '';
    return '\n\n[STUDENT PREFERENCES & STYLE GUIDE]\n' + parts.map(p => `- ${p}`).join('\n');
  } catch (err) {
    console.warn('Failed to compile prompt style suffix', err);
    return '';
  }
}
