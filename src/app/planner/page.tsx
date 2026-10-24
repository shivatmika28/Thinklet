"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { useMaterial } from "@/context/MaterialContext";
import { Planner } from "@/features/components/Planner";

export default function PlannerPage() {
  const { currentTopics, currentPages } = useMaterial();

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      <TopNavBar
        title="Adaptive Task Planner"
        subtitle="Study schedule versioning, daily goals, and exam milestones"
        backHref="/"
        showHelp
        helpText="Plan your study sessions by day or week and adjust your target exam date."
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <Planner topics={currentTopics} pages={currentPages} />
      </div>
    </div>
  );
}
