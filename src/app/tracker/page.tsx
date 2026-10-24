"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { useMaterial } from "@/context/MaterialContext";
import { StudyTracker } from "@/features/components/StudyTracker";

export default function TrackerPage() {
  const { currentTopics, currentPages } = useMaterial();

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      <TopNavBar
        title="Focus Timer & Study Sprint"
        subtitle="Active Pomodoro timer, daily progress goals, and streak tracking"
        backHref="/"
        showHelp
        helpText="Click '←' at any time to return to the Dashboard while your study session continues."
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <StudyTracker topics={currentTopics} pages={currentPages} />
      </div>
    </div>
  );
}
