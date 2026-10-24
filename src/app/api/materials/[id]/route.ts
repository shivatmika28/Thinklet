import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PageContent } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: {
        topics: { orderBy: { order: "asc" } },
        quizAttempts: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            answers: {
              include: { question: true },
            },
          },
        },
        revisionTasks: {
          orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!material) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }

    let parsedPages: PageContent[] = [];
    try {
      parsedPages = JSON.parse(material.pageContents);
    } catch {
      parsedPages = [{ pageNumber: 1, text: material.extractedText }];
    }

    return NextResponse.json({
      success: true,
      material: {
        id: material.id,
        title: material.title,
        sourceType: material.sourceType,
        fileName: material.fileName,
        pageCount: material.pageCount,
        pages: parsedPages,
        createdAt: material.createdAt.toISOString(),
        topics: material.topics,
        quizAttempts: material.quizAttempts.map((a) => ({
          id: a.id,
          score: a.score,
          totalQuestions: a.totalQuestions,
          percentage: a.percentage,
          createdAt: a.createdAt.toISOString(),
          answers: a.answers.map((ans) => ({
            isCorrect: ans.isCorrect,
            selectedOption: ans.selectedOption,
            question: ans.question ? { topicName: ans.question.topicName } : null,
          })),
        })),
        revisionTasks: material.revisionTasks.map((t) => ({
          id: t.id,
          topicName: t.topicName,
          recommendedActivity: t.recommendedActivity,
          priority: t.priority,
          status: t.status,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to get material:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load material" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.studyMaterial.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Material deleted successfully" });
  } catch (error: unknown) {
    console.error("Failed to delete material:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete material" },
      { status: 500 }
    );
  }
}
