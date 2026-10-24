import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_MATERIAL_TITLE, DEMO_PAGES, DEMO_TOPICS } from "@/lib/demo-data";

export async function POST() {
  try {
    // Check if demo material already exists
    let material = await prisma.studyMaterial.findFirst({
      where: { title: DEMO_MATERIAL_TITLE },
      include: {
        topics: { orderBy: { order: "asc" } },
        quizAttempts: { orderBy: { createdAt: "desc" } },
        revisionTasks: true,
      },
    });

    if (!material) {
      const fullText = DEMO_PAGES.map((p) => `--- [Page ${p.pageNumber}] ---\n${p.text}`).join("\n\n");

      material = await prisma.studyMaterial.create({
        data: {
          title: DEMO_MATERIAL_TITLE,
          sourceType: "demo",
          fileName: "cellular-biology-genetics-demo.pdf",
          pageCount: DEMO_PAGES.length,
          extractedText: fullText,
          pageContents: JSON.stringify(DEMO_PAGES),
          topics: {
            create: DEMO_TOPICS.map((t) => ({
              name: t.name,
              description: t.description,
              order: t.order,
            })),
          },
        },
        include: {
          topics: { orderBy: { order: "asc" } },
          quizAttempts: true,
          revisionTasks: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      material: {
        id: material.id,
        title: material.title,
        sourceType: material.sourceType,
        fileName: material.fileName,
        pageCount: material.pageCount,
        createdAt: material.createdAt.toISOString(),
        topics: material.topics,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to seed demo material:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load demo material" },
      { status: 500 }
    );
  }
}
