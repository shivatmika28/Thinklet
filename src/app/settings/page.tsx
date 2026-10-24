"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { SettingsPanel } from "@/features/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <TopNavBar title="Settings" subtitle="Learning preferences & feature controls" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <SettingsPanel isOpen={true} />
      </main>
    </div>
  );
}
