"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      step: 1,
      badge: "Step 1 of 4 • Materials & Notes",
      emoji: "📚",
      title: "Upload Your Study Materials",
      quote: "Turn dense lecture slides into crystal-clear knowledge nuggets.",
      description:
        "Thinklet accepts PDFs (up to 20 pages), handwritten study note transcripts, and pasted syllabus text. The AI extracts key topics, definitions, and formulas automatically.",
      actionLabel: "Try Uploading Notes ➔",
      actionHref: "/materials",
      highlightColor: "var(--terracotta)",
    },
    {
      step: 2,
      badge: "Step 2 of 4 • AI Tutor & Explanations",
      emoji: "💡",
      title: "Ask the Thinklet Study Companion",
      quote: "No question is too basic. We break down tricky steps with patience.",
      description:
        "Stuck on a confusing concept? Tap into source-grounded explanations. Every answer links directly to pages in your uploaded material so you never study hallucinations.",
      actionLabel: "Explore Learn Mode ➔",
      actionHref: "/learn",
      highlightColor: "var(--peach)",
    },
    {
      step: 3,
      badge: "Step 3 of 4 • Diagnostic Quizzes",
      emoji: "🎯",
      title: "Test Grasp with Adaptive Quizzes",
      quote: "Active recall is your superpower for high-yield exam retention.",
      description:
        "Generate 5 to 10 diagnostic questions covering multiple choice, true/false, and short answer. Thinklet tracks mastery percentage and spots weak areas instantly.",
      actionLabel: "Take a Diagnostic Quiz ➔",
      actionHref: "/quiz",
      highlightColor: "var(--buttercream)",
    },
    {
      step: 4,
      badge: "Step 4 of 4 • Smart Revision & Planner",
      emoji: "🗓️",
      title: "Conquer Your Quests & Streaks",
      quote: "Small steps over perfection ♡ — celebrate every 25m sprint.",
      description:
        "Your personalized study plan organizes revision tasks by priority. Complete daily study quests to build a streak and keep motivation soaring.",
      actionLabel: "View Today's Plan ➔",
      actionHref: "/planner",
      highlightColor: "var(--mint)",
    },
  ];

  const activeStepData = steps[currentStep - 1];

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
      {/* Standardized Top Navigation Bar with 44x44 Tactile Squircle Back Button */}
      <TopNavBar
        title="Tutorial & Onboarding Guide"
        subtitle={`Step ${currentStep} of ${totalSteps} • Getting Started`}
        backHref="/"
        showHelp
        helpText="Click 'Next' to tour Thinklet's core learning superpowers"
      />

      <div className="p-4 sm:p-6 md:p-8 max-w-3xl w-full mx-auto space-y-6">
        {/* Step Progress Pill Indicator */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((stepIdx) => (
              <button
                key={stepIdx}
                type="button"
                onClick={() => setCurrentStep(stepIdx)}
                aria-label={`Jump to step ${stepIdx}`}
                style={{
                  height: "8px",
                  width: stepIdx === currentStep ? "36px" : "16px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: stepIdx <= currentStep ? "var(--button)" : "var(--border)",
                  transition: "all 200ms var(--ease-standard)",
                  border: "none",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--buttercream)" }}>
            {activeStepData.badge}
          </span>
        </div>

        {/* Mascot Greeting Bubble */}
        <Card
          variant="raised"
          className="p-6 relative overflow-hidden"
          style={{
            border: `1px solid ${activeStepData.highlightColor}40`,
            boxShadow: `0 12px 32px -10px rgba(0, 0, 0, 0.5), 0 0 20px ${activeStepData.highlightColor}15`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Mascot Avatar Squircle */}
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "22px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "34px",
                flexShrink: 0,
                boxShadow: "0 8px 18px rgba(0, 0, 0, 0.3)",
              }}
            >
              <span>{activeStepData.emoji}</span>
            </div>

            {/* Step Content */}
            <div className="space-y-2 flex-1">
              <div
                style={{
                  fontSize: "12px",
                  fontStyle: "italic",
                  color: "var(--peach)",
                  fontWeight: 600,
                }}
              >
                "{activeStepData.quote}"
              </div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--heading)",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {activeStepData.title}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {activeStepData.description}
              </p>
            </div>
          </div>

          {/* Quick CTA for this step */}
          <div className="mt-6 pt-5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
            <Link href={activeStepData.actionHref} className="no-underline">
              <Button variant="primary" size="md">
                {activeStepData.actionLabel}
              </Button>
            </Link>

            {/* Next / Prev Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft style={{ width: "16px", height: "16px" }} />}
              >
                Back
              </Button>
              {currentStep < totalSteps ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentStep((p) => Math.min(totalSteps, p + 1))}
                  icon={<ChevronRight style={{ width: "16px", height: "16px" }} />}
                >
                  Next Step
                </Button>
              ) : (
                <Link href="/" className="no-underline">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 style={{ width: "16px", height: "16px" }} />}
                  >
                    Finish Guide
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Tactile Tips Shelf */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card variant="panel" className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--buttercream)] font-bold text-sm">
              <Sparkles style={{ width: "16px", height: "16px" }} />
              <span>Pro Tip: 25-Minute Sprints</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Use the built-in Pomodoro tracker to study in short bursts with zero burnout.
            </p>
          </Card>

          <Card variant="panel" className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--mint)] font-bold text-sm">
              <CheckCircle2 style={{ width: "16px", height: "16px" }} />
              <span>Streak Protection</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Completing just one quiz question or revision task per day maintains your streak!
            </p>
          </Card>
        </div>

        {/* Back to Dashboard CTA */}
        <div className="text-center pt-4">
          <Link href="/" className="no-underline">
            <Button variant="outline" size="md">
              ← Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
