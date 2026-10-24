import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const materialId = searchParams.get("materialId");
    const whereClause = materialId ? { materialId } : undefined;

    const attempts = await prisma.quizAttempt.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        material: { select: { id: true, title: true } },
        answers: {
          include: {
            question: { select: { topicName: true } },
          },
        },
      },
    });

    const revisionTasks = await prisma.revisionTask.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const totalAttempts = attempts.length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
        : 0;

    // Aggregate topic performance across all historical attempts
    const topicStats: Record<string, { total: number; correct: number; attempts: number }> = {};

    for (const attempt of attempts) {
      for (const ans of attempt.answers) {
        const topic = ans.question?.topicName || "General";
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0, attempts: 0 };
        }
        topicStats[topic].total += 1;
        if (ans.isCorrect) {
          topicStats[topic].correct += 1;
        }
      }
    }

    const topicMastery = Object.entries(topicStats).map(([topicName, stats]) => {
      const percentage = Math.round((stats.correct / stats.total) * 100);
      let status = "Competent";
      if (percentage < 60) status = "Needs Attention";
      else if (percentage >= 85) status = "Mastered";

      return {
        topicName,
        total: stats.total,
        correct: stats.correct,
        percentage,
        isWeak: percentage < 60,
        status,
      };
    });

    // Score progression trend
    const scoreTrend = attempts
      .slice()
      .reverse()
      .map((a, index) => ({
        attemptNumber: index + 1,
        percentage: a.percentage,
        score: a.score,
        totalQuestions: a.totalQuestions,
        materialTitle: a.material.title,
        date: a.createdAt.toLocaleDateString(),
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalAttempts,
        averageScore,
        completedTasks: revisionTasks.filter((t) => t.status === "COMPLETED").length,
        pendingTasks: revisionTasks.filter((t) => t.status === "PENDING").length,
        recentAttempts: attempts.slice(0, 10).map((a) => ({
          id: a.id,
          materialId: a.material.id,
          materialTitle: a.material.title,
          score: a.score,
          totalQuestions: a.totalQuestions,
          percentage: a.percentage,
          createdAt: a.createdAt.toISOString(),
        })),
        topicMastery,
        scoreTrend,
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      ((error as { digest: string }).digest.startsWith("NEXT_") ||
        (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE")
    ) {
      throw error;
    }
    console.error("Progress fetch error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load progress" },
      { status: 500 }
    );
  }
}
