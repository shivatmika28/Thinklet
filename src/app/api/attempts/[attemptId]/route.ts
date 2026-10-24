import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        material: {
          include: {
            quizAttempts: {
              orderBy: { createdAt: "desc" },
              take: 2,
              select: { id: true, percentage: true, createdAt: true },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ success: false, error: "Attempt not found" }, { status: 404 });
    }

    // Calculate topic-level accuracy
    const topicStats: Record<string, { total: number; correct: number }> = {};
    for (const ans of attempt.answers) {
      const topic = ans.question.topicName;
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 };
      }
      topicStats[topic].total += 1;
      if (ans.isCorrect) {
        topicStats[topic].correct += 1;
      }
    }

    const topicAccuracies = Object.entries(topicStats).map(([topicName, stats]) => {
      const pct = Math.round((stats.correct / stats.total) * 100);
      return {
        topicName,
        total: stats.total,
        correct: stats.correct,
        percentage: pct,
        isWeak: pct < 60,
      };
    });

    const previousAttempt = attempt.material.quizAttempts.find((a) => a.id !== attempt.id) || null;

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        createdAt: attempt.createdAt.toISOString(),
        material: {
          id: attempt.material.id,
          title: attempt.material.title,
        },
        previousScore: previousAttempt ? previousAttempt.percentage : null,
        topicAccuracies,
        answers: attempt.answers.map((a) => ({
          id: a.id,
          selectedOption: a.selectedOption,
          isCorrect: a.isCorrect,
          question: {
            id: a.question.id,
            question: a.question.question,
            options: a.question.options ? (typeof a.question.options === "string" ? JSON.parse(a.question.options) : a.question.options) : [],
            topicName: a.question.topicName,
            pageReferences: a.question.pageReferences,
            correctAnswer: a.question.correctAnswer,
            explanation: a.question.explanation,
          },
        })),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to load attempt:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load attempt" },
      { status: 500 }
    );
  }
}
