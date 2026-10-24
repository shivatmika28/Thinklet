"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { useMaterial } from "@/context/MaterialContext";
import { PracticePaper } from "@/features/components/PracticePaper";
import { PreTestCalmScreen, loadPersonalStore } from "@/features/personal"; // [PERSONAL]
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CuteBookMascot } from "@/components/ui/illustrations";
import { Sparkles } from "lucide-react";

export default function PaperPage() {
  const { currentTopics, currentPages, activeMaterial, isLoading, loadDemoMaterial } = useMaterial();
  const [calmDone, setCalmDone] = React.useState(false); // [PERSONAL]

  if (!isLoading && !activeMaterial) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
        <TopNavBar title="Practice Exam Papers" subtitle="Multi-section practice papers" backHref="/" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card variant="panel" className="max-w-md w-full text-center space-y-4 p-8">
            <div className="flex justify-center mb-1">
              <CuteBookMascot size="lg" className="animate-gentle-bounce" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--heading)", margin: "0 0 4px 0" }}>
              No study material selected
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Please upload study material or load our demo material to generate structured practice papers.
            </p>
            <Button
              variant="primary"
              onClick={() => loadDemoMaterial()}
              icon={<Sparkles style={{ width: "15px", height: "15px" }} />}
              className="w-full"
            >
              Load demo study material
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      {!calmDone && (loadPersonalStore().relaxMode || loadPersonalStore().switches.preTestCalmDefault) && <PreTestCalmScreen onComplete={() => setCalmDone(true)} onSkip={() => setCalmDone(true)} />} {/* [PERSONAL] */}
      <TopNavBar
        title="Practice Exam Papers"
        subtitle="Multi-section practice papers with instant grading and mark schemes"
        backHref="/"
        showHelp
        helpText="Complete practice paper sections under timed exam conditions."
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <PracticePaper topics={currentTopics} pages={currentPages} />
      </div>
    </div>
  );
}
