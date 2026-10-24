import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRevisionPlanWithGemini } from "@/lib/gemini";
import { PageContent, TopicAccuracy, UserAnswerEvaluation } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const answersMap: Record<string, string> = body.answers || {};

    const questionIds = Object.keys(answersMap);
    if (questionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No answers provided for submission" },
        { status: 400 }
      );
    }

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: {
        topics: true,
        quizAttempts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { score: true, totalQuestions: true, percentage: true },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }

    const previousAttempt = material.quizAttempts[0] || null;

    // Fetch the actual questions from DB to evaluate on the server
    const questions = await prisma.quizQuestion.findMany({
      where: {
        id: { in: questionIds },
        materialId: id,
      },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Questions not found for evaluation" },
        { status: 404 }
      );
    }

    let score = 0;
    const evaluatedAnswers: UserAnswerEvaluation[] = [];
    const topicStats: Record<string, { total: number; correct: number }> = {};

    for (const q of questions) {
      const selectedOption = answersMap[q.id] || "";
      const isCorrect = selectedOption.trim() === q.correctAnswer.trim();
      if (isCorrect) {
        score++;
      }

      if (!topicStats[q.topicName]) {
        topicStats[q.topicName] = { total: 0, correct: 0 };
      }
      topicStats[q.topicName].total += 1;
      if (isCorrect) {
        topicStats[q.topicName].correct += 1;
      }

      evaluatedAnswers.push({
        questionId: q.id,
        questionText: q.question,
        topicName: q.topicName,
        selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        pageReferences: q.pageReferences,
      });
    }

    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Calculate topic accuracies
    const topicAccuracies: TopicAccuracy[] = Object.entries(topicStats).map(([topicName, stats]) => {
      const topicPct = Math.round((stats.correct / stats.total) * 100);
      return {
        topicName,
        total: stats.total,
        correct: stats.correct,
        percentage: topicPct,
        isWeak: topicPct < 60, // Mark topics below 60% as weak per spec
      };
    });

    const weakTopics = topicAccuracies.filter((t) => t.isWeak).map((t) => t.topicName);

    // Persist attempt and user answers to DB
    const attempt = await prisma.quizAttempt.create({
      data: {
        materialId: id,
        score,
        totalQuestions,
        percentage,
        answers: {
          create: evaluatedAnswers.map((ea) => ({
            questionId: ea.questionId,
            selectedOption: ea.selectedOption,
            isCorrect: ea.isCorrect,
          })),
        },
      },
    });

    // Link questions to this attempt
    await prisma.quizQuestion.updateMany({
      where: { id: { in: questionIds } },
      data: { attemptId: attempt.id },
    });

    // Parse pages for generating revision plan
    let pages: PageContent[] = [];
    try {
      pages = JSON.parse(material.pageContents);
    } catch {
      pages = [{ pageNumber: 1, text: material.extractedText }];
    }

    const allTopicNames = material.topics.map((t) => t.name);
    const language = body.language;

    // Generate revision plan & 3 targeted practice questions
    const revisionResult = await generateRevisionPlanWithGemini({
      weakTopics,
      allTopics: allTopicNames,
      pages,
      score,
      totalQuestions,
      language,
    });

    // Save revision tasks in DB
    const createdTasks = await Promise.all(
      revisionResult.tasks.map((task) =>
        prisma.revisionTask.create({
          data: {
            materialId: id,
            topicName: task.topicName,
            recommendedActivity: task.recommendedActivity,
            priority: task.priority,
            status: "PENDING",
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score,
      totalQuestions,
      percentage,
      previousScore: previousAttempt ? previousAttempt.percentage : null,
      weakTopics,
      topicAccuracies,
      questionEvaluations: evaluatedAnswers,
      revisionTasks: createdTasks.map((t) => ({
        id: t.id,
        topicName: t.topicName,
        recommendedActivity: t.recommendedActivity,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
      targetedPractice: revisionResult.practiceQuestions,
      isDemo: revisionResult.isDemo,
    });
  } catch (error: unknown) {
    console.error("Quiz submission evaluation failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to evaluate quiz" },
      { status: 500 }
    );
  }
}
