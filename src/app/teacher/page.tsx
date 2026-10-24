"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { useMaterial } from "@/context/MaterialContext";
import { TeacherView } from "@/features/components/TeacherView";

export default function TeacherPage() {
  const { currentTopics } = useMaterial();

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      <TopNavBar
        title="Teacher & Parent Inspector"
        subtitle="Read-only student accountability and progress reports"
        backHref="/"
        showHelp
        helpText="Share progress reports without exposing private account logins."
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <TeacherView topics={currentTopics} />
      </div>
    </div>
  );
}
