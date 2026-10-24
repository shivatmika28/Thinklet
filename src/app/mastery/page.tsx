"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { useMaterial } from "@/context/MaterialContext";
import { MasteryTracker } from "@/features/components/MasteryTracker";
import { useRouter } from "next/navigation";

export default function MasteryPage() {
  const { currentTopics, currentPages } = useMaterial();
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      <TopNavBar
        title="Unified Mastery Tracker"
        subtitle="Exam Readiness Index (0–100) & Leitner Spaced Repetition"
        backHref="/"
        showHelp
        helpText="Calibrate your study confidence against quiz performance across all topics."
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <MasteryTracker
          topics={currentTopics}
          pages={currentPages}
          onOpenPracticePaper={() => router.push("/paper")}
          onOpenPlanner={() => router.push("/planner")}
        />
      </div>
    </div>
  );
}
