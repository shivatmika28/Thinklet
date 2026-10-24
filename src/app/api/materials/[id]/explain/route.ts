import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateExplanationWithGemini } from "@/lib/gemini";
import { PageContent } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      topicName: rawTopicName,
      topicDescription,
      userQuestion,
      language,
      tone,
      explanationLevel,
      dyslexiaMode,
      socraticMode,
    } = body;

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      select: { pageContents: true, extractedText: true, topics: { select: { name: true, description: true } } },
    });

    if (!material) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }

    const topicName = rawTopicName || material.topics[0]?.name || "Overview";
    const resolvedDescription = topicDescription || material.topics[0]?.description || "";

    let pages: PageContent[] = [];
    try {
      pages = JSON.parse(material.pageContents);
    } catch {
      pages = [{ pageNumber: 1, text: material.extractedText }];
    }

    const result = await generateExplanationWithGemini({
      topicName,
      topicDescription: resolvedDescription,
      userQuestion,
      pages,
      language,
      tone,
      explanationLevel,
      dyslexiaMode: Boolean(dyslexiaMode),
      socraticMode: Boolean(socraticMode),
    });

    return NextResponse.json({
      success: true,
      explanation: result.explanation,
      citations: result.citations,
      isDemo: result.isDemo,
    });
  } catch (error: unknown) {
    console.error("Explain route error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
