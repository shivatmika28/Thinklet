import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePdfBuffer, parsePastedText } from "@/lib/pdf-parser";
import { extractTopicsWithGemini } from "@/lib/gemini";

export async function GET() {
  try {
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        topics: {
          select: { id: true, name: true, description: true, order: true },
          orderBy: { order: "asc" },
        },
        quizAttempts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { score: true, totalQuestions: true, percentage: true, createdAt: true },
        },
        _count: {
          select: { topics: true, quizAttempts: true },
        },
      },
    });

    const formatted = materials.map((m) => ({
      id: m.id,
      title: m.title,
      sourceType: m.sourceType as "pdf" | "text" | "demo",
      fileName: m.fileName,
      pageCount: m.pageCount,
      createdAt: m.createdAt.toISOString(),
      topicsCount: m._count.topics,
      attemptsCount: m._count.quizAttempts,
      latestScore: m.quizAttempts[0]?.percentage ?? null,
      topics: m.topics,
    }));

    return NextResponse.json({ success: true, materials: formatted });
  } catch (error: unknown) {
    console.error("Failed to fetch materials:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let title = "";
    let sourceType: "pdf" | "text" = "text";
    let fileName: string | null = null;
    let parsedResult: { pageCount: number; pages: Array<{ pageNumber: number; text: string }>; fullText: string };

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const customTitle = formData.get("title") as string | null;
      const textFromForm = formData.get("text") as string | null;

      if (file && file.size > 0) {
        if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
          return NextResponse.json(
            { success: false, error: "Only PDF files are supported for file upload. Use 'Paste Text' for plain text." },
            { status: 400 }
          );
        }

        // Check file size (max 15MB)
        if (file.size > 15 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: "File exceeds maximum size limit of 15MB." },
            { status: 400 }
          );
        }

        fileName = file.name;
        title = (customTitle && customTitle.trim()) || file.name.replace(/\.pdf$/i, "");
        sourceType = "pdf";

        const arrayBuffer = await file.arrayBuffer();
        parsedResult = await parsePdfBuffer(arrayBuffer);
      } else if (textFromForm && textFromForm.trim().length > 0) {
        title = (customTitle && customTitle.trim()) || "Pasted Study Notes";
        sourceType = "text";
        parsedResult = parsePastedText(title, textFromForm);
      } else {
        return NextResponse.json({ success: false, error: "No PDF file or pasted text provided" }, { status: 400 });
      }
    } else {
      const body = await req.json();
      const rawTitle = body.title as string | undefined;
      const rawText = body.text as string | undefined;

      if (!rawText || rawText.trim().length === 0) {
        return NextResponse.json({ success: false, error: "Text content is required." }, { status: 400 });
      }

      title = (rawTitle && rawTitle.trim()) || "Pasted Study Notes";
      sourceType = "text";
      parsedResult = parsePastedText(title, rawText);
    }

    // Extract topics using Gemini
    const { topics, isDemo } = await extractTopicsWithGemini(parsedResult.pages);

    // Save to SQLite database
    const material = await prisma.studyMaterial.create({
      data: {
        title,
        sourceType,
        fileName,
        pageCount: parsedResult.pageCount,
        extractedText: parsedResult.fullText,
        pageContents: JSON.stringify(parsedResult.pages),
        topics: {
          create: topics.map((t) => ({
            name: t.name,
            description: t.description,
            order: t.order,
          })),
        },
      },
      include: {
        topics: true,
      },
    });

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
      isDemo,
    });
  } catch (error: unknown) {
    console.error("Error creating material:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
