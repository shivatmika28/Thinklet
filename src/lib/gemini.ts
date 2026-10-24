import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { PageContent } from "./types";
import { DEMO_QUIZ_QUESTIONS, DEMO_TARGETED_PRACTICE, DEMO_TOPICS } from "./demo-data";

// Zod schemas for structured validation
export const ExtractedTopicsSchema = z.object({
  topics: z.array(
    z.object({
      name: z.string().min(2),
      description: z.string().min(5),
    })
  ).min(1).max(8),
});

export const QuizQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().min(5),
      options: z.array(z.string().min(1)).min(4).max(4),
      correctAnswer: z.string().min(1),
      explanation: z.string().min(5),
      topicName: z.string().min(2),
      pageReferences: z.string().min(2),
    })
  ).min(5).max(5),
});

export const RevisionPlanSchema = z.object({
  tasks: z.array(
    z.object({
      topicName: z.string(),
      recommendedActivity: z.string(),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
    })
  ).min(1),
  practiceQuestions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).min(4).max(4),
      correctAnswer: z.string(),
      explanation: z.string(),
      topicName: z.string(),
      pageReferences: z.string(),
    })
  ).min(1).max(3),
});

const GROUNDING_RULES = `
CRITICAL GROUNDING RULES:
1. Ground all explanations and questions strictly in the provided study material.
2. Every fact, question, explanation, or citation MUST cite the exact page number where the evidence appears using the format "[Page X]".
3. If the material does not contain the answer, explicitly state: "This information is not available in your uploaded material."
4. Never fabricate a page number, quotation, or citation.
5. If the evidence is insufficient or ambiguous, disclose this instead of guessing.
`;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export function cleanJsonText(raw: string): string {
  if (!raw) return "{}";
  const cleaned = raw.trim();

  // Try extracting code fence first if present
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = codeBlockRegex.exec(cleaned)) !== null) {
    const blockContent = blockMatch[1].trim();
    try {
      JSON.parse(blockContent);
      return blockContent;
    } catch {
      // Continue to check inside this block
    }
  }

  // Find first opening brace or bracket
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  const startIdx = (firstBrace !== -1 && firstBracket !== -1)
    ? Math.min(firstBrace, firstBracket)
    : (firstBrace !== -1 ? firstBrace : firstBracket);

  if (startIdx !== -1) {
    const openChar = cleaned[startIdx];
    const closeChar = openChar === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIdx; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
      } else {
        if (ch === '"') {
          inString = true;
        } else if (ch === openChar) {
          depth++;
        } else if (ch === closeChar) {
          depth--;
          if (depth === 0) {
            const candidate = cleaned.slice(startIdx, i + 1).trim();
            try {
              JSON.parse(candidate);
              return candidate;
            } catch {
              // continue scan
            }
          }
        }
      }
    }
  }

  // Fallback to previous heuristic
  if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1).trim();
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // continue
      }
    }
  }

  return cleaned;
}

async function withTimeout<T>(promise: Promise<T>, ms: number = 60000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini API call timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

export async function callGeminiInteractions(
  client: GoogleGenAI,
  options: {
    input: string;
    systemInstruction?: string;
    responseFormatJson?: boolean;
    timeoutMs?: number;
  }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const payload: any = {
        model,
        input: options.input,
      };
      if (options.systemInstruction) {
        payload.system_instruction = options.systemInstruction;
      }
      if (options.responseFormatJson) {
        payload.response_format = {
          type: "text",
          mime_type: "application/json",
        };
      }

      const interaction = await withTimeout(
        client.interactions.create(payload),
        options.timeoutMs || 45000
      );
      const text = interaction.output_text || "";
      if (text.trim().length > 0) {
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${model} attempt failed: ${err?.message || err}. Trying next candidate model...`);
    }
  }

  throw lastError || new Error("All Gemini candidate models failed to generate response.");
}

function extractHeuristicTopics(pages: PageContent[]): Array<{ name: string; description: string; order: number }> {
  const topics: Array<{ name: string; description: string; order: number }> = [];
  const lines = pages.flatMap((p) => p.text.split("\n").map((l) => l.trim())).filter((l) => l.length > 3);

  // Look for header-like lines
  const headingCandidates = lines.filter((l) =>
    (l.length < 50 && !l.endsWith(".") && !l.endsWith(",") && /^[A-Z0-9#]/.test(l)) ||
    /^Chapter|^Section|^Topic|^Unit|\d+\.\s+[A-Z]/i.test(l)
  );

  const uniqueHeadings = Array.from(new Set(headingCandidates)).slice(0, 5);
  if (uniqueHeadings.length >= 2) {
    uniqueHeadings.forEach((h, idx) => {
      const cleanName = h.replace(/^#+\s*|\d+\.\s*/, "").trim();
      topics.push({
        name: cleanName,
        description: `Key concepts, facts, and principles relating to ${cleanName} from the uploaded material.`,
        order: idx + 1,
      });
    });
  } else {
    // Generate page-based sections
    const total = Math.min(pages.length, 5);
    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const snippet = page.text.slice(0, 160).replace(/\n/g, " ").trim();
      topics.push({
        name: `Section ${i + 1} (Page ${page.pageNumber})`,
        description: snippet ? `${snippet}...` : `Foundational review of concepts from Page ${page.pageNumber}.`,
        order: i + 1,
      });
    }
  }

  return topics.length > 0
    ? topics
    : [
        {
          name: "Core Material Overview",
          description: "Foundational principles and key concepts from the uploaded study material.",
          order: 1,
        },
      ];
}

/**
 * Extract concise topic outlines from study material
 */
export async function extractTopicsWithGemini(
  pages: PageContent[]
): Promise<{ topics: Array<{ name: string; description: string; order: number }>; isDemo: boolean }> {
  const client = getGeminiClient();
  const pagesSummary = pages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text.slice(0, 1500)}`)
    .join("\n\n");

  if (!client) {
    console.warn("Gemini API key missing, extracting heuristic topics from document.");
    return {
      topics: extractHeuristicTopics(pages),
      isDemo: false,
    };
  }

  const prompt = `
You are an expert curriculum designer. Analyze the following study material and extract between 3 and 6 distinct, structured core topics covered in the document.

${GROUNDING_RULES}

Study Material:
${pagesSummary}

Output format: Return ONLY a valid JSON object matching this structure:
{
  "topics": [
    {
      "name": "Topic Title",
      "description": "A 1-2 sentence concise summary of key concepts covered in this topic, citing source pages like [Page 1]."
    }
  ]
}
`;

  try {
    const { text } = await callGeminiInteractions(client, {
      input: prompt,
      responseFormatJson: true,
    });

    const parsed = JSON.parse(cleanJsonText(text));
    const validated = ExtractedTopicsSchema.parse(parsed);

    return {
      topics: validated.topics.map((t, idx) => ({
        name: t.name,
        description: t.description,
        order: idx + 1,
      })),
      isDemo: false,
    };
  } catch (err: unknown) {
    console.error("Gemini topic extraction failed, extracting heuristic topics from document:", err);
    return {
      topics: extractHeuristicTopics(pages),
      isDemo: false,
    };
  }
}

/**
 * Generate a source-grounded explanation or answer student query
 */
export async function generateExplanationWithGemini(params: {
  topicName: string;
  topicDescription?: string;
  userQuestion?: string;
  pages: PageContent[];
  language?: string;
  tone?: string;
  explanationLevel?: string;
  dyslexiaMode?: boolean;
  socraticMode?: boolean;
}): Promise<{ explanation: string; citations: string[]; isDemo: boolean }> {
  const client = getGeminiClient();
  const {
    topicName,
    topicDescription,
    userQuestion,
    pages,
    language,
    tone,
    explanationLevel,
    dyslexiaMode,
    socraticMode,
  } = params;

  // Include pages text
  const contentExcerpt = pages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
    .join("\n\n");

  const buildGroundedExplanationFallback = () => {
    // If user asked a specific question, check whether the material contains keywords for it
    if (userQuestion && userQuestion.trim().length > 0) {
      const stopWords = new Set([
        "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
        "does", "explain", "tell", "about", "their", "there", "these", "those",
        "this", "that", "with", "from", "have", "been", "were", "will", "would",
        "could", "should", "some", "many", "more", "most", "than", "then"
      ]);
      const keywords = userQuestion
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w));

      const hasContentMatch = keywords.some((kw) =>
        pages.some((p) => p.text.toLowerCase().includes(kw))
      );
      const hasTopicMatch = pages.some((p) =>
        p.text.toLowerCase().includes(topicName.toLowerCase())
      );

      if (keywords.length > 0 && !hasContentMatch && !hasTopicMatch) {
        const notFoundMsg = language === "Hindi"
          ? `यह जानकारी आपकी अपलोड की गई अध्ययन सामग्री में उपलब्ध नहीं है।\n\nअपलोड किए गए दस्तावेज़ में "${userQuestion}" से संबंधित कोई विवरण या प्रमाण नहीं मिला।`
          : `This information is not available in your uploaded material.\n\nThe uploaded document does not contain information or references regarding "${userQuestion}".`;
        return {
          explanation: notFoundMsg,
          citations: [],
          isDemo: false,
        };
      }
    }

    // Find pages mentioning the topic
    const relevant = pages.filter((p) => p.text.toLowerCase().includes(topicName.toLowerCase()));
    const targetPages = relevant.length > 0 ? relevant : pages.slice(0, 2);
    const pageNum = targetPages[0]?.pageNumber || 1;
    const snippet = targetPages[0]?.text.slice(0, 280).replace(/\n/g, " ").trim() || "";

    let exp = "";
    if (socraticMode) {
      if (language === "Hindi") {
        exp = `### ${topicName} (मार्गदर्शक प्रश्न)\n\n[Page ${pageNum}] पर दिए गए इस अंश को ध्यान से देखें:\n> "${snippet}"\n\nइस अंश के आधार पर, आप ${topicName} की मुख्य परिभाषा को अपने शब्दों में कैसे व्यक्त करेंगे? मुख्य बिंदु पर विचार करें।`;
      } else {
        exp = `### ${topicName} (Socratic Inquiry)\n\nTake a close look at this passage on [Page ${pageNum}]:\n> "${snippet}"\n\nBased on what the text says here, what core mechanism or principle stands out to you? How would you explain this step in your own words?`;
      }
    } else if (language === "Hindi") {
      exp = userQuestion
        ? `"${userQuestion}" के उत्तर में (**${topicName}**):\n\n[Page ${pageNum}] के अनुसार:\n> "${snippet}"\n\nयह आपके दस्तावेज़ में ${topicName} से संबंधित मुख्य विवरण प्रस्तुत करता है।`
        : `### ${topicName}\n\n[Page ${pageNum}] के अनुसार:\n> "${snippet}"\n\nमुख्य निष्कर्ष: [Page ${pageNum}] में दी गई परिभाषाओं और अवधारणाओं का पुनरावलोकन करें।`;
    } else {
      exp = userQuestion
        ? `Regarding "${userQuestion}" on **${topicName}**:\n\nBased on [Page ${pageNum}]:\n> "${snippet}"\n\nThis addresses key aspects covered in your document regarding ${topicName}.`
        : `### ${topicName}\n\nBased on [Page ${pageNum}]:\n> "${snippet}"\n\nKey takeaways from your notes: Review the definitions and core relationships outlined on [Page ${pageNum}].`;
    }

    return {
      explanation: exp,
      citations: [`Page ${pageNum}`],
      isDemo: false,
    };
  };

  if (!client) {
    return buildGroundedExplanationFallback();
  }

  // Tone instruction
  let toneInstruction = "Tone: Warm, encouraging, empathetic, and academically supportive.";
  if (tone === "friendly") {
    toneInstruction = "Tone: Warm, enthusiastic, encouraging, empathetic, and approachable like a friendly study partner.";
  } else if (tone === "formal") {
    toneInstruction = "Tone: Strictly formal, academic, scholarly, and objective. Avoid casual colloquialisms.";
  } else if (tone === "exam_coach") {
    toneInstruction = "Tone: Direct exam coach. Highlight high-yield points, key examiner marking schemes, scoring keywords, and common student pitfalls.";
  }

  // Explanation depth instruction
  let levelInstruction = "Explanation depth: Standard undergraduate/high-school depth with balanced rigor and clarity.";
  if (explanationLevel === "age_12") {
    levelInstruction = "Explanation depth: 'Explain like I am 12'. Use intuitive real-world analogies, straightforward language, and step-by-step clarity. Avoid unnecessary academic jargon unless immediately explained with an everyday analogy.";
  } else if (explanationLevel === "exam_level") {
    levelInstruction = "Explanation depth: Exam level. Emphasize rigorous technical definitions, exact mechanisms, syllabus terminology, and marks-oriented structured reasoning.";
  }

  // Dyslexia mode instruction
  const dyslexiaInstruction = dyslexiaMode
    ? "Dyslexia Accessibility Format: Use short, punchy sentences. Present information using clear bullet points and bold key terms. Avoid dense walls of text and complex nested clauses."
    : "";

  // Socratic mode instruction
  const socraticInstruction = socraticMode
    ? `SOCRATIC TUTORING ACTIVE:
Do NOT directly lecture or immediately provide the complete final answer.
Instead:
1. Acknowledge what the student is exploring.
2. Direct their attention to a specific clue, sentence, or fact in the provided study material (citing inline [Page X]).
3. Ask a probing, step-by-step thought question that prompts the student to think critically and deduce the next conceptual step themselves.`
    : "";

  // Language instruction
  let languageInstruction = "Language: Clear, engaging English.";
  if (language === "Hindi") {
    languageInstruction = "MANDATORY LANGUAGE DIRECTIVE: You MUST write the ENTIRE explanation, analysis, and tutor responses in clear, modern Hindi script (हिंदी). Retain technical formulas, chemical notations, and scientific terms in parentheses, and preserve exact verbatim source quotes and page references in their original text (e.g. [Page 1]).";
  } else if (language === "Tamil") {
    languageInstruction = "MANDATORY LANGUAGE DIRECTIVE: You MUST write the ENTIRE explanation, analysis, and tutor responses in clear, modern Tamil script (தமிழ்). Retain technical formulas, chemical notations, and scientific terms in parentheses, and preserve exact verbatim source quotes and page references in their original text (e.g. [Page 1]).";
  } else if (language === "Bengali") {
    languageInstruction = "MANDATORY LANGUAGE DIRECTIVE: You MUST write the ENTIRE explanation, analysis, and tutor responses in clear, modern Bengali script (বাংলা). Retain technical formulas, chemical notations, and scientific terms in parentheses, and preserve exact verbatim source quotes and page references in their original text (e.g. [Page 1]).";
  } else if (language === "Marathi") {
    languageInstruction = "MANDATORY LANGUAGE DIRECTIVE: You MUST write the ENTIRE explanation, analysis, and tutor responses in clear, modern Marathi script (मराठी). Retain technical formulas, chemical notations, and scientific terms in parentheses, and preserve exact verbatim source quotes and page references in their original text (e.g. [Page 1]).";
  } else if (language === "Hinglish") {
    languageInstruction = "MANDATORY LANGUAGE DIRECTIVE: You MUST write in conversational Hinglish (Hindi vocabulary written exclusively in Latin English alphabet mixed naturally with English academic terminology, e.g. 'Photosynthesis ek aisa biological process hai...'). Do NOT use Devanagari script. Keep verbatim quotes and page citations exact.";
  }

  const prompt = `
You are Thinklet, an academically precise AI tutor.
${
  userQuestion
    ? `The student has asked a specific question: "${userQuestion}".
Analyze the provided Study Material to determine if the answer is contained within it.

CRITICAL INSTRUCTIONS FOR STUDENT QUESTIONS:
1. If the question can be answered using the provided Study Material, explain the answer thoroughly, grounding every claim strictly in the text and inserting inline page citations like [Page 1].
2. If the student asks a question whose answer is NOT covered in the provided Study Material, you MUST explicitly state at the very beginning:
"This information is not available in your uploaded material."
Do not invent document facts. You may only provide brief general context afterwards if helpful, clearly separated.`
    : `Explain the topic "${topicName}" to a student based strictly on their study material.`
}

Topic Context: ${topicName}
${topicDescription ? `Topic Description: ${topicDescription}` : ""}

[STUDENT PREFERENCES & STYLE GUIDE]
- ${languageInstruction}
- ${toneInstruction}
- ${levelInstruction}
${dyslexiaInstruction ? `- ${dyslexiaInstruction}\n` : ""}${socraticInstruction ? `- ${socraticInstruction}\n` : ""}- CRITICAL GROUNDING INVARIANT: Verbatim evidence quotes, page references, and citations must remain in their EXACT original source text and language. Do not translate or rephrase source quotes.

${GROUNDING_RULES}

Study Material Excerpt:
${contentExcerpt}

Instructions:
- Ground every explanation strictly in the study text.
- Insert inline page citations in square brackets like [Page 1], [Page 2] right where the fact is mentioned.
- Keep language clear, engaging, and well-structured with markdown headings, bullet points, and bold terms.
`;

  try {
    const { text } = await callGeminiInteractions(client, {
      input: prompt,
    });

    const explanation = text || "No explanation could be generated.";

    // Extract cited page numbers from text
    const citationMatches = explanation.match(/\[Page\s*(\d+)\]/gi) || [];
    const citations = Array.from(new Set(citationMatches.map((c) => c.replace(/\[|\]/g, ""))));

    return {
      explanation,
      citations: citations.length > 0 ? citations : [`Page ${pages[0]?.pageNumber || 1}`],
      isDemo: false,
    };
  } catch (err) {
    console.error("Gemini explanation error, generating document-grounded explanation:", err);
    return buildGroundedExplanationFallback();
  }
}

/**
 * Generate 5 multiple-choice questions grounded in material
 */
export async function generateDiagnosticQuizWithGemini(params: {
  topics: Array<{ name: string }>;
  pages: PageContent[];
  language?: string;
  level?: string;
}): Promise<{ questions: z.infer<typeof QuizQuestionsSchema>["questions"]; isDemo: boolean }> {
  const client = getGeminiClient();
  const { topics, pages, language, level } = params;

  const topicsList = topics.map((t) => t.name).join(", ");
  const contentExcerpt = pages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
    .join("\n\n");

  const buildGroundedQuizFallback = () => {
    const questions: z.infer<typeof QuizQuestionsSchema>["questions"] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length] || { name: "Core Concepts" };
      const page = pages[i % pages.length] || { pageNumber: 1, text: "Key concepts from material" };
      const sentences = page.text.split(/[.?!]\s+/).filter((s) => s.trim().length > 25);
      const keySentence = sentences[i % Math.max(1, sentences.length)]?.trim() || `Core concept for ${topic.name}`;

      const qText = language === "Hindi"
        ? `[Page ${page.pageNumber}] के अनुसार, ${topic.name} के विषय में क्या कहा गया है?`
        : `Based on [Page ${page.pageNumber}], what is stated regarding ${topic.name}?`;

      const expText = language === "Hindi"
        ? `[Page ${page.pageNumber}] में स्पष्ट उल्लेख है: "${keySentence.slice(0, 120)}..."`
        : `As detailed in your document on [Page ${page.pageNumber}]: "${keySentence.slice(0, 120)}..."`;

      questions.push({
        question: qText,
        options: [
          keySentence.slice(0, 90),
          language === "Hindi" ? `यह पृष्ठ ${page.pageNumber} के निष्कर्षों से असंगत है।` : `It is unrelated to the findings described on Page ${page.pageNumber}.`,
          language === "Hindi" ? `यह दस्तावेज़ में दी गई परिभाषा के विपरीत है।` : `It contradicts the core definitions presented in the document.`,
          language === "Hindi" ? `यह अध्ययन सामग्री में कहीं उल्लिखित नहीं है।` : `It is not addressed anywhere in the study material.`,
        ],
        correctAnswer: keySentence.slice(0, 90),
        explanation: expText,
        topicName: topic.name,
        pageReferences: `Page ${page.pageNumber}`,
      });
    }
    return { questions, isDemo: false };
  };

  if (!client) {
    return buildGroundedQuizFallback();
  }

  let languageDirective = "Language: Clear English.";
  if (language === "Hindi") {
    languageDirective = "MANDATORY LANGUAGE DIRECTIVE: Write ALL question text, all 4 options, and explanations in clear, modern Hindi script (हिंदी). Keep exact formulas and page citations as [Page X].";
  } else if (language === "Tamil") {
    languageDirective = "MANDATORY LANGUAGE DIRECTIVE: Write ALL question text, all 4 options, and explanations in clear, modern Tamil script (தமிழ்). Keep exact formulas and page citations as [Page X].";
  } else if (language === "Bengali") {
    languageDirective = "MANDATORY LANGUAGE DIRECTIVE: Write ALL question text, all 4 options, and explanations in clear, modern Bengali script (বাংলা). Keep exact formulas and page citations as [Page X].";
  } else if (language === "Marathi") {
    languageDirective = "MANDATORY LANGUAGE DIRECTIVE: Write ALL question text, all 4 options, and explanations in clear, modern Marathi script (मराठी). Keep exact formulas and page citations as [Page X].";
  } else if (language === "Hinglish") {
    languageDirective = "MANDATORY LANGUAGE DIRECTIVE: Write ALL question text, options, and explanations in conversational Hinglish (Hindi vocabulary in Latin alphabet with English academic terms).";
  }

  let levelDirective = "Assessment Level: Standard diagnostic assessment testing foundational understanding and key applications.";
  if (level === "age_12") {
    levelDirective = "Assessment Level: 'Explain like I am 12'. Simple vocabulary, intuitive scenarios, accessible phrasing.";
  } else if (level === "exam_level") {
    levelDirective = "Assessment Level: Rigorous exam level. Precise syllabus keywords, challenging distractors, exact technical mechanisms.";
  }

  const prompt = `
You are a university examiner. Create a 5-question diagnostic multiple-choice quiz testing comprehension of the uploaded material.

${GROUNDING_RULES}

[STUDENT PREFERENCES]
- ${languageDirective}
- ${levelDirective}
- CRITICAL: Page citations and verbatim quotes must remain in their original source text format (e.g. "[Page 1]").

Available Topics in this Material:
${topicsList}

Full Material:
${contentExcerpt}

Requirements:
1. Generate EXACTLY 5 high-quality multiple choice questions.
2. Each question MUST have exactly 4 plausible options.
3. Mark exactly one option as the correctAnswer (exact string match with one of the options).
4. Assign each question to one of the available topic names: [${topicsList}].
5. Provide a clear pedagogical explanation referencing the exact page number where the answer is found (e.g. "According to [Page 2]...").
6. Set "pageReferences" to the cited page (e.g. "Page 2" or "Page 1, 3").
7. Ensure questions test genuine conceptual understanding rather than trivial word-matching.

Output Format: ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation citing [Page X].",
      "topicName": "${topics[0]?.name || "General"}",
      "pageReferences": "Page 1"
    }
  ]
}
`;

  try {
    const { text } = await callGeminiInteractions(client, {
      input: prompt,
      responseFormatJson: true,
    });

    const parsed = JSON.parse(cleanJsonText(text));
    const validated = QuizQuestionsSchema.parse(parsed);

    // Verify each question has correctAnswer inside options
    validated.questions.forEach((q) => {
      if (!q.options.includes(q.correctAnswer)) {
        q.options[0] = q.correctAnswer;
      }
    });

    return {
      questions: validated.questions,
      isDemo: false,
    };
  } catch (err) {
    console.error("Gemini quiz generation failed, generating grounded document questions:", err);
    return buildGroundedQuizFallback();
  }
}

/**
 * Generate revision tasks and 3 targeted practice questions based on weak topics
 */
export async function generateRevisionPlanWithGemini(params: {
  weakTopics: string[];
  allTopics: string[];
  pages: PageContent[];
  score: number;
  totalQuestions: number;
  language?: string;
}): Promise<{
  tasks: Array<{ topicName: string; recommendedActivity: string; priority: "HIGH" | "MEDIUM" | "LOW" }>;
  practiceQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    topicName: string;
    pageReferences: string;
  }>;
  isDemo: boolean;
}> {
  const client = getGeminiClient();
  const { weakTopics, allTopics, pages, score, totalQuestions, language } = params;

  const focusTopics = weakTopics.length > 0 ? weakTopics : allTopics.slice(0, 2);

  const buildGroundedRevisionFallback = () => {
    const tasks = focusTopics.map((topic, i) => {
      const pageNum = (i % pages.length) + 1;
      const rec = language === "Hindi"
        ? `[Page ${pageNum}] पर दी गई ${topic} की मूल परिभाषाओं और उदाहरणों का सक्रिय स्मरण (active recall) द्वारा पुनरावलोकन करें।`
        : `Review the foundational definitions and examples for ${topic} on [Page ${pageNum}] using active recall.`;

      return {
        topicName: topic,
        recommendedActivity: rec,
        priority: (i === 0 ? "HIGH" : "MEDIUM") as "HIGH" | "MEDIUM",
      };
    });

    const practiceQuestions = focusTopics.slice(0, 3).map((topic, i) => {
      const page = pages[i % pages.length] || { pageNumber: 1, text: "Study content" };
      const sentences = page.text.split(/[.?!]\s+/).filter((s) => s.trim().length > 25);
      const fact = sentences[0]?.trim() || `Foundational concept of ${topic}`;

      const qText = language === "Hindi"
        ? `${topic} के संबंध में [Page ${page.pageNumber}] पर कौन सा तथ्य प्रमाणित है?`
        : `Regarding ${topic}, which fact is confirmed on [Page ${page.pageNumber}]?`;

      return {
        question: qText,
        options: [
          fact.slice(0, 90),
          language === "Hindi" ? `यह विषय अपलोड किए गए दस्तावेज़ में नहीं है।` : `This topic is not discussed in the uploaded document.`,
          language === "Hindi" ? `यह पृष्ठ ${page.pageNumber} के अवलोकनों के विपरीत है।` : `This contradicts the observations made on Page ${page.pageNumber}.`,
          language === "Hindi" ? `उपरोक्त में से कोई भी कथन लागू नहीं होता।` : `None of the above statements apply.`,
        ],
        correctAnswer: fact.slice(0, 90),
        explanation: `Confirmed on [Page ${page.pageNumber}]: "${fact.slice(0, 100)}..."`,
        topicName: topic,
        pageReferences: `Page ${page.pageNumber}`,
      };
    });

    return {
      tasks:
        tasks.length > 0
          ? tasks
          : [
              {
                topicName: allTopics[0] || "General Review",
                recommendedActivity: "Reread foundational sections on [Page 1] and test recall without notes.",
                priority: "HIGH" as const,
              },
            ],
      practiceQuestions,
      isDemo: false,
    };
  };

  if (!client) {
    return buildGroundedRevisionFallback();
  }

  const contentExcerpt = pages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
    .join("\n\n");

  let languageDirective = "Language: Clear English.";
  if (language === "Hindi") {
    languageDirective = "MANDATORY LANGUAGE: Write all recommendedActivity task descriptions, practice questions, options, and explanations in clear Hindi script (हिंदी). Preserve page citations like [Page X].";
  } else if (language === "Tamil") {
    languageDirective = "MANDATORY LANGUAGE: Write all recommendedActivity task descriptions, practice questions, options, and explanations in clear Tamil script (தமிழ்). Preserve page citations like [Page X].";
  } else if (language === "Bengali") {
    languageDirective = "MANDATORY LANGUAGE: Write all recommendedActivity task descriptions, practice questions, options, and explanations in clear Bengali script (বাংলা). Preserve page citations like [Page X].";
  } else if (language === "Marathi") {
    languageDirective = "MANDATORY LANGUAGE: Write all recommendedActivity task descriptions, practice questions, options, and explanations in clear Marathi script (मराठी). Preserve page citations like [Page X].";
  } else if (language === "Hinglish") {
    languageDirective = "MANDATORY LANGUAGE: Write all recommendedActivity task descriptions, practice questions, options, and explanations in conversational Hinglish.";
  }

  const prompt = `
You are an educational tutor analyzing a student's recent diagnostic quiz results.
Student scored ${score} out of ${totalQuestions}.
Identified Weak Topics (<60% accuracy): ${weakTopics.length > 0 ? weakTopics.join(", ") : "None below 60% - Student showed strong baseline"}.
Target Review Focus Topics: ${focusTopics.join(", ")}.

${GROUNDING_RULES}

[STUDENT PREFERENCES]
- ${languageDirective}
- CRITICAL: Exact page citations like [Page X] must be preserved accurately.

Study Material:
${contentExcerpt}

Requirements:
1. Generate 3 to 4 actionable, highly specific Revision Tasks prioritizing the weak topics. Each task must specify a concrete active study method (e.g. self-explanation, mind mapping, contrasting concepts) and cite the exact source page (e.g., "[Page 2]").
2. Set priority to "HIGH" for weak topics, "MEDIUM" or "LOW" for reinforcement.
3. Generate EXACTLY 3 targeted follow-up practice multiple-choice questions focusing specifically on the weak or prioritized topics. Each question must have 4 options, a correct answer, and an explanation citing page numbers like [Page X].

Output format: ONLY valid JSON matching:
{
  "tasks": [
    {
      "topicName": "Topic Name",
      "recommendedActivity": "Actionable task description citing [Page X]",
      "priority": "HIGH"
    }
  ],
  "practiceQuestions": [
    {
      "question": "Practice question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why A is correct citing [Page X].",
      "topicName": "Topic Name",
      "pageReferences": "Page X"
    }
  ]
}
`;

  try {
    const { text } = await callGeminiInteractions(client, {
      input: prompt,
      responseFormatJson: true,
    });

    const parsed = JSON.parse(cleanJsonText(text));
    const validated = RevisionPlanSchema.parse(parsed);

    // Verify option integrity
    validated.practiceQuestions.forEach((q) => {
      if (!q.options.includes(q.correctAnswer)) {
        q.options[0] = q.correctAnswer;
      }
    });

    return {
      tasks: validated.tasks,
      practiceQuestions: validated.practiceQuestions,
      isDemo: false,
    };
  } catch (err) {
    console.error("Gemini revision plan generation failed, generating grounded revision tasks:", err);
    return buildGroundedRevisionFallback();
  }
}
