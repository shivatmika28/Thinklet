import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDiagnosticQuizWithGemini } from "@/lib/gemini";
import { PageContent } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { language, level } = body || {};

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: {
        topics: { select: { name: true } },
      },
    });

    if (!material) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }

    let pages: PageContent[] = [];
    try {
      pages = JSON.parse(material.pageContents);
    } catch {
      pages = [{ pageNumber: 1, text: material.extractedText }];
    }

    const { questions: generatedQuestions, isDemo } = await generateDiagnosticQuizWithGemini({
      topics: material.topics,
      pages,
      language,
      level,
    });

    // Store generated questions in SQLite
    const createdQuestions = await Promise.all(
      generatedQuestions.map((q) =>
        prisma.quizQuestion.create({
          data: {
            materialId: material.id,
            topicName: q.topicName,
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            pageReferences: q.pageReferences,
          },
        })
      )
    );

    // Sanitize questions for student: DO NOT expose correctAnswer or explanation before submission
    const sanitizedQuestions = createdQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options) as string[],
      topicName: q.topicName,
      pageReferences: q.pageReferences,
    }));

    return NextResponse.json({
      success: true,
      questions: sanitizedQuestions,
      isDemo,
    });
  } catch (error: unknown) {
    console.error("Failed to generate quiz:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
