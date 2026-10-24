"use client";

import React from "react";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { useMaterial } from "@/context/MaterialContext";
import { Flashcards } from "@/features/components/Flashcards";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CuteBookMascot } from "@/components/ui/illustrations";
import { Sparkles } from "lucide-react";

export default function FlashcardsPage() {
  const { currentTopics, currentPages, activeMaterial, isLoading, loadDemoMaterial } = useMaterial();

  if (!isLoading && !activeMaterial) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
        <TopNavBar title="AI Flashcard Forge" subtitle="5-box Leitner spaced repetition" backHref="/" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card variant="panel" className="max-w-md w-full text-center space-y-4 p-8">
            <div className="flex justify-center mb-1">
              <CuteBookMascot size="lg" className="animate-gentle-bounce" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--heading)", margin: "0 0 4px 0" }}>
              No study material selected
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Please upload study material or load our demo material to generate active recall flashcards.
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
      <TopNavBar
        title="AI Flashcard Forge"
        subtitle={`Deck: ${activeMaterial?.title || "Active Topics"} • 5-box Leitner spaced repetition`}
        backHref="/"
        showHelp
        helpText="Review flashcards, flip to check answers, and rate your confidence to advance boxes."
      />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <Flashcards topics={currentTopics} pages={currentPages} />
      </div>
    </div>
  );
}
