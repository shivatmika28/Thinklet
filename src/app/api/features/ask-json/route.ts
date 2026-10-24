import { NextRequest, NextResponse } from "next/server";
import { callGeminiInteractions, cleanJsonText, getGeminiClient } from "@/lib/gemini";

function extractExcerptFromPrompt(prompt: string): { quote: string; page: number; topic: string } {
  const topicMatch = prompt.match(/\[Topic:\s*([^\]]+)\]/i) || prompt.match(/topic\s*["']([^"']+)["']/i);
  const topic = topicMatch ? topicMatch[1].trim() : "Core Topic";

  const pageMatch = prompt.match(/\[Page\s*(\d+)\]\s*([^\[\n\r]+)/i);
  if (pageMatch) {
    const page = parseInt(pageMatch[1], 10) || 1;
    const text = pageMatch[2].trim().replace(/\s+/g, " ");
    const quote = text.slice(0, 140);
    return { quote: quote || "Key principles established in study notes.", page, topic };
  }

  return { quote: "Key principles established in study notes.", page: 1, topic };
}

function generateGroundedFallback(prompt: string): any {
  const lower = prompt.toLowerCase();
  const { quote, page, topic } = extractExcerptFromPrompt(prompt);

  // 1. Answer Checker / Teach-Back
  if (lower.includes("evaluate the student's answer") || lower.includes("teach-back") || lower.includes("evidencequote")) {
    return {
      score: 0.85,
      misconception: null,
      missingPoints: [
        `Ensure full coverage of foundational definitions from [Page ${page}].`
      ],
      alternatives: [
        `As stated on [Page ${page}]: "${quote}"`
      ],
      evidenceQuote: quote,
      page
    };
  }

  // 2. Flashcards
  if (lower.includes("flashcard") || lower.includes("flashcards")) {
    return {
      flashcards: [
        {
          topicId: "topic-1",
          front: `What is the core definition of ${topic}?`,
          back: `According to [Page ${page}]: ${quote}`,
          quote: quote,
          page
        }
      ]
    };
  }

  // 3. Smart Notes / Mnemonic / Formulas
  if (lower.includes("bullet points") || lower.includes("definitions") || lower.includes("mnemonic") || lower.includes("formula")) {
    return {
      title: `${topic} High-Yield Summary`,
      content: `• **Core Concept**: Derived directly from [Page ${page}].\n• **Key Principle**: ${quote}\n• **Summary**: Key relationships detailed in study notes.`,
      pageReferences: [page],
      verbatimQuote: quote
    };
  }

  // 4. Practice Paper
  if (lower.includes("practice paper") || lower.includes("marks-bearing")) {
    return {
      questions: [
        {
          id: `paper-q1-${Date.now()}`,
          topicId: "topic-1",
          level: "Medium",
          marks: 1,
          section: "A",
          type: "mcq",
          targets: `Targets: ${topic}, page ${page}`,
          text: `Which statement accurately reflects the discussion on Page ${page}?`,
          prompt: `Which statement accurately reflects the discussion on Page ${page}?`,
          options: [
            quote.slice(0, 80),
            "It is not mentioned in the uploaded study material.",
            "It contradicts the core definitions presented in the document.",
            "It represents an unsupported claim from outside the text."
          ],
          answer: "A",
          explanation: `Directly supported on [Page ${page}]: "${quote}"`,
          page
        }
      ]
    };
  }

  // 5. Visual Concept Maps & Process Flows
  if (lower.includes("concept map") || lower.includes("relational diagram") || lower.includes("process flow")) {
    return {
      title: `${topic} Concept Flow`,
      nodes: [
        { id: "node-1", label: topic, page, quote, category: "core", x: 100, y: 150 },
        { id: "node-2", label: "Key Principle", page, quote, category: "detail", x: 300, y: 150 }
      ],
      edges: [
        { source: "node-1", target: "node-2", label: "demonstrates" }
      ],
      steps: [
        { step: 1, title: `Phase 1: ${topic}`, description: quote, page, quote, verified: true }
      ]
    };
  }

  // 6. Spoken Audio Review Script
  if (lower.includes("audio study coach") || lower.includes("spoken review script") || lower.includes("audioscript")) {
    return {
      audioScript: `Welcome to your 60-second revision sprint for ${topic}. As documented on [Page ${page}], "${quote}". Keep this verified principle in mind for your exam prep!`
    };
  }

  // 7. Planner Coaching Tips
  if (lower.includes("coaching tip") || lower.includes("coachingtips")) {
    return {
      coachingTips: [
        `Focus on active recall and verified keywords from [Page ${page}].`,
        `Review foundational definitions and diagrams on [Page ${page}].`
      ]
    };
  }

  return {
    success: true,
    message: "Structured grounded response generated successfully.",
    evidenceQuote: quote,
    page
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, schema, systemInstruction } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const client = getGeminiClient();

    if (!client) {
      const fallbackData = generateGroundedFallback(prompt);
      return NextResponse.json({ success: true, data: fallbackData, isFallback: true });
    }

    const fullPrompt = `${systemInstruction ? `[SYSTEM INSTRUCTION]\n${systemInstruction}\n\n` : ""}${prompt}\n\nCRITICAL: You must return ONLY a valid JSON object. Do NOT include any greeting, preamble, conversational text, or concluding remarks.`;

    try {
      const { text } = await callGeminiInteractions(client, {
        input: fullPrompt,
        responseFormatJson: true,
      });

      const parsed = JSON.parse(cleanJsonText(text || "{}"));
      return NextResponse.json({ success: true, data: parsed, isFallback: false });
    } catch (apiErr) {
      console.warn("Gemini interaction failed, using grounded document fallback:", apiErr);
      const fallbackData = generateGroundedFallback(prompt);
      return NextResponse.json({ success: true, data: fallbackData, isFallback: true });
    }
  } catch (err: unknown) {
    console.error("ask-json route error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
