"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { MySpaceDialog } from "@/features/personal";

export default function MySpacePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      <TopNavBar
        title="My Space"
        subtitle="Personal study sanctuary, relaxation pacing & learning insights"
        backHref="/"
        showHelp
        helpText="Configure Relax mode, set motivation anchors, adjust Pip's tone, and manage your data."
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-auto overflow-y-auto">
        <MySpaceDialog embedded={true} isOpen={true} />
      </div>
    </div>
  );
}
