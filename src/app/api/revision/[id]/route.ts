import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = body.status as "PENDING" | "COMPLETED";

    if (!["PENDING", "COMPLETED"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    const task = await prisma.revisionTask.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        topicName: task.topicName,
        recommendedActivity: task.recommendedActivity,
        priority: task.priority,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to update revision task:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update revision task" },
      { status: 500 }
    );
  }
}
