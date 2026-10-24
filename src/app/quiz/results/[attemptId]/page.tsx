"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  CheckSquare,
} from "lucide-react";
import { ResultsExtras } from "@/features/components/ResultsExtras";
import { MasteryLevel } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { triggerCelebration, loadPersonalStore, recordMascotMemory } from "@/features/personal"; // [PERSONAL]

interface AttemptData {
  id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: string;
  material: {
    id: string;
    title: string;
  };
  previousScore: number | null;
  topicAccuracies: Array<{
    topicName: string;
    total: number;
    correct: number;
    percentage: number;
    isWeak: boolean;
  }>;
  answers: Array<{
    id: string;
    selectedOption: string;
    isCorrect: boolean;
    question: {
      id: string;
      question: string;
      topicName: string;
      pageReferences: string;
      correctAnswer: string;
      explanation: string;
    };
  }>;
}

export default function QuizResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.attempt) {
          setData(resData.attempt);
          if (resData.attempt.percentage >= 60) {
            triggerCelebration(loadPersonalStore().relaxMode ? "subtle" : loadPersonalStore().switches.celebrationIntensity, `Scored ${resData.attempt.percentage}%! Outstanding work! ✨`); // [PERSONAL]
          }
          if (resData.attempt.percentage >= 85) { recordMascotMemory('topic_mastered', `Mastered: ${resData.attempt.material?.title || 'Quiz'}`, `Scored ${resData.attempt.percentage}% on ${resData.attempt.material?.title || 'Quiz'}.`, resData.attempt.material?.title, resData.attempt.material?.id); } else if (resData.attempt.percentage < 50) { recordMascotMemory('tough_quiz', `Tough Quiz: ${resData.attempt.material?.title || 'Quiz'}`, `Faced a challenging quiz on ${resData.attempt.material?.title || 'Quiz'} (${resData.attempt.percentage}%).`, resData.attempt.material?.title, resData.attempt.material?.id); } // [PERSONAL]
        } else {
          setError(resData.error || "Attempt not found.");
        }
      })
      .catch((err) => {
        console.error("Failed to load attempt:", err);
        setError("Network error while loading attempt.");
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
        <TopNavBar title="Diagnostic Quiz Results" subtitle="Evaluating responses..." backHref="/quiz" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Skeleton width="180px" height="24px" className="mx-auto" />
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Loading quiz results and topic performance analysis...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
        <TopNavBar title="Diagnostic Quiz Results" subtitle="Error loading results" backHref="/quiz" />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card variant="panel" className="max-w-md text-center space-y-4 p-8">
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--heading)", margin: "0 0 4px 0" }}>
              Quiz attempt not found
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              {error || "Could not retrieve attempt."}
            </p>
            <Link href="/quiz" className="no-underline">
              <Button variant="primary">Back to quiz</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const scoreDiff = data.previousScore !== null ? data.percentage - data.previousScore : null;
  const weakTopics = data.topicAccuracies.filter((t) => t.isWeak);

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
      <TopNavBar
        title="Diagnostic Quiz Results"
        subtitle={`Server-evaluated • ${data.material.title}`}
        backHref="/quiz"
        showHelp
        helpText="Review your answer breakdown and examine weak topics flagged for targeted revision."
      />

      <div className="p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        {/* Hero Score Banner */}
        <Card
          variant="panel"
          staggerIndex={0}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 md:p-8"
        >
          <div className="flex items-center gap-5">
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "14px",
                backgroundColor: "var(--raised)",
                color: data.percentage >= 60 ? "var(--strong)" : "var(--weak)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border)",
                flexShrink: 0,
              }}
            >
              <Award style={{ width: "32px", height: "32px" }} />
            </div>

            <div className="space-y-1">
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Diagnostic score
              </span>
              <div className="flex items-baseline gap-3">
                <span style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {data.percentage}%
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  ({data.score} of {data.totalQuestions} correct)
                </span>
              </div>

              {scoreDiff !== null && (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  {scoreDiff > 0 ? (
                    <span style={{ color: "var(--strong)", fontWeight: 700 }}>
                      +{scoreDiff}% improvement
                    </span>
                  ) : scoreDiff < 0 ? (
                    <span style={{ color: "var(--weak)", fontWeight: 700 }}>
                      {scoreDiff}% vs previous attempt
                    </span>
                  ) : (
                    <span>Consistent with previous score</span>
                  )}{" "}
                  (Previous: {data.previousScore}%)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/quiz" className="no-underline">
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw style={{ width: "14px", height: "14px" }} />}
              >
                Retake quiz
              </Button>
            </Link>
            <Link href="/revision" className="no-underline">
              <Button
                variant="primary"
                size="sm"
                icon={<CheckSquare style={{ width: "14px", height: "14px" }} />}
              >
                Personalized revision plan
              </Button>
            </Link>
          </div>
        </Card>

        {/* Topic-Wise Accuracy Breakdown & Weak Topics */}
        <Card variant="panel" staggerIndex={1} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--heading)", margin: 0 }}>
              Topic performance breakdown
            </h3>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Pass threshold: 60%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.topicAccuracies.map((ta) => (
              <div
                key={ta.topicName}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-button)",
                  border: ta.isWeak ? "1px solid var(--weak)" : "1px solid var(--border)",
                  backgroundColor: "var(--raised)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {ta.topicName}
                    </span>
                    {ta.isWeak ? (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "3px",
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          color: "var(--weak)",
                          border: "1px solid var(--weak)",
                        }}
                      >
                        Weak area
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "3px",
                          backgroundColor: "rgba(34, 197, 94, 0.15)",
                          color: "var(--strong)",
                          border: "1px solid var(--strong)",
                        }}
                      >
                        Passed
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>
                    {ta.correct} of {ta.total} correct
                  </span>
                </div>

                <div style={{ fontSize: "18px", fontWeight: 800, color: ta.isWeak ? "var(--weak)" : "var(--strong)" }}>
                  {ta.percentage}%
                </div>
              </div>
            ))}
          </div>

          {weakTopics.length > 0 ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-button)",
                backgroundColor: "var(--raised)",
                border: "1px solid var(--okay)",
                color: "var(--text-primary)",
                fontSize: "12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <AlertTriangle style={{ width: "16px", height: "16px", color: "var(--okay)", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <span style={{ fontWeight: 700, color: "var(--heading)" }}>Prioritized for revision: </span>
                {weakTopics.map((w) => w.topicName).join(", ")}. Targeted tasks and practice questions have been scheduled on your Revision Plan.
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-button)",
                backgroundColor: "var(--raised)",
                border: "1px solid var(--strong)",
                color: "var(--strong)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 style={{ width: "16px", height: "16px" }} />
              <span>Great job! All topics scored 60% or higher on this diagnostic evaluation.</span>
            </div>
          )}

          <ResultsExtras
            attempt={{
              id: data.id,
              timestamp: new Date(data.createdAt).getTime(),
              score: data.percentage,
              totalQuestions: data.totalQuestions,
              topicMastery: data.topicAccuracies.reduce((acc, t) => {
                acc[t.topicName] =
                  t.percentage >= 80 ? "mastered" : t.percentage >= 60 ? "learning" : "weak";
                return acc;
              }, {} as Record<string, MasteryLevel>),
              answers: {},
            }}
            onOpenPracticePaper={() => router.push("/paper")}
            onOpenPlanner={() => router.push("/planner")}
          />
        </Card>

        {/* Detailed Question Review with Explanations & Page Citations */}
        <div className="space-y-4">
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--heading)", margin: "0 0 12px 0" }}>
            Question-by-question review with source citations
          </h3>

          <div className="space-y-4">
            {data.answers.map((ans, idx) => {
              const q = ans.question;
              return (
                <Card
                  key={ans.id}
                  variant="panel"
                  style={{
                    borderLeft: ans.isCorrect ? "3px solid var(--strong)" : "3px solid var(--weak)",
                  }}
                  className="space-y-4 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                          Question {idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            backgroundColor: "var(--raised)",
                            color: "var(--heading)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {q.topicName}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            backgroundColor: "var(--raised)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {q.pageReferences}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                        {q.question}
                      </h4>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                      {ans.isCorrect ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--strong)", fontSize: "12px", fontWeight: 700 }}>
                          <CheckCircle2 style={{ width: "16px", height: "16px" }} />
                          <span>Correct</span>
                        </div>
                      ) : (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--weak)", fontSize: "12px", fontWeight: 700 }}>
                          <XCircle style={{ width: "16px", height: "16px" }} />
                          <span>Incorrect</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-button)",
                        backgroundColor: ans.isCorrect ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        border: ans.isCorrect ? "1px solid var(--strong)" : "1px solid var(--weak)",
                      }}
                    >
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", display: "block" }}>
                        Your answer:
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px", display: "block" }}>
                        {ans.selectedOption}
                      </span>
                    </div>

                    {!ans.isCorrect && (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "var(--radius-button)",
                          backgroundColor: "rgba(34, 197, 94, 0.12)",
                          border: "1px solid var(--strong)",
                        }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", display: "block" }}>
                          Correct answer:
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--strong)", marginTop: "2px", display: "block" }}>
                          {q.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--radius-button)",
                      backgroundColor: "var(--raised)",
                      border: "1px solid var(--border)",
                      fontSize: "12px",
                      lineHeight: 1.5,
                      color: "var(--text-primary)",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "var(--heading)", display: "block", marginBottom: "2px" }}>
                      Explanation:
                    </span>
                    {q.explanation}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
