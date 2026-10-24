"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { useMaterial } from "@/context/MaterialContext";
import { ShareCard } from "@/features/components/ShareCard";

export default function SharePage() {
  const { currentTopics, currentPages } = useMaterial();

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      <TopNavBar
        title="Share Achievement Badge"
        subtitle="Generate shareable study badges and milestone certificates"
        backHref="/"
        showHelp
        helpText="Export your study streaks and achievements to celebrate your progress!"
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <ShareCard topics={currentTopics} pages={currentPages} />
      </div>
    </div>
  );
}
