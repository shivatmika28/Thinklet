"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMaterial } from "@/context/MaterialContext";
import {
  CheckSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Filter,
  Check,
} from "lucide-react";
import { RevisionTaskItem, TargetedPracticeQuestion } from "@/lib/types";
import { DEMO_TARGETED_PRACTICE } from "@/lib/demo-data";
import { PlanExtras } from "@/features/components/PlanExtras";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TopNavBar } from "@/components/ui/TopNavBar";

export default function RevisionPage() {
  const router = useRouter();
  const { activeMaterial, loadDemoMaterial, isLoading: contextLoading } = useMaterial();

  const [tasks, setTasks] = useState<RevisionTaskItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [practiceQuestions, setPracticeQuestions] = useState<TargetedPracticeQuestion[]>(DEMO_TARGETED_PRACTICE);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!activeMaterial?.id) return;
    setIsLoading(true);
    fetch(`/api/materials/${activeMaterial.id}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success && data.material) {
          setTasks(data.material.revisionTasks || []);
          if (data.material.quizAttempts && data.material.quizAttempts.length > 0) {
            const latestAttemptId = data.material.quizAttempts[0].id;
            try {
              const attRes = await fetch(`/api/attempts/${latestAttemptId}`);
              const attData = await attRes.json();
              if (attData.success && Array.isArray(attData.attempt?.answers) && attData.attempt.answers.length > 0) {
                const mappedQuestions: TargetedPracticeQuestion[] = attData.attempt.answers.map((ans: any) => ({
                  question: ans.question.question,
                  options:
                    ans.question.options && ans.question.options.length === 4
                      ? ans.question.options
                      : [ans.question.correctAnswer, "Alternative choice B", "Alternative choice C", "Alternative choice D"],
                  correctAnswer: ans.question.correctAnswer,
                  explanation: ans.question.explanation,
                  topicName: ans.question.topicName,
                  pageReferences: ans.question.pageReferences,
                }));
                if (mappedQuestions.length > 0) {
                  setPracticeQuestions(mappedQuestions);
                }
              }
            } catch (attErr) {
              console.warn("Could not load attempt-grounded practice questions:", attErr);
            }
          }
        }
      })
      .catch((err) => console.error("Failed to load revision tasks:", err))
      .finally(() => setIsLoading(false));
  }, [activeMaterial?.id]);

  const handleToggleTask = async (taskId: string, currentStatus: "PENDING" | "COMPLETED") => {
    const newStatus = currentStatus === "PENDING" ? "COMPLETED" : "PENDING";
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`/api/revision/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleSelectPracticeOption = (qIdx: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: option,
    }));
    setRevealedSolutions((prev) => ({
      ...prev,
      [qIdx]: true,
    }));
  };

  if (!contextLoading && !activeMaterial) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
        <TopNavBar title="Revision Plan" subtitle="Personalized study schedule" backHref="/" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card variant="panel" className="max-w-md w-full text-center space-y-4 p-8">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--raised)",
                color: "var(--heading)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                border: "1px solid var(--border)",
              }}
            >
              <CheckSquare style={{ width: "22px", height: "22px" }} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--heading)", margin: "0 0 4px 0" }}>
              No study material selected
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Please upload study material or load our demo material to view your revision plan.
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

  const filteredTasks = tasks.filter((t) => {
    if (filter === "PENDING") return t.status === "PENDING";
    if (filter === "COMPLETED") return t.status === "COMPLETED";
    return true;
  });

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
      <TopNavBar
        title="Revision Plan"
        subtitle={`Prioritized schedule: ${activeMaterial?.title || "Active Document"}`}
        backHref="/"
        showHelp
        helpText="Review weak topics and mark tasks completed to increase your overall mastery."
      />

      <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Progress Tracker Card */}
        <Card
          variant="panel"
          staggerIndex={0}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6"
        >
          <div className="space-y-1">
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Revision progress
            </span>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>
                {completedCount} of {tasks.length} completed
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--heading)" }}>({progressPct}%)</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              Complete high-priority tasks to reinforce weak areas identified in your diagnostic quiz.
            </p>
          </div>

          <Link href="/quiz" className="no-underline shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<HelpCircle style={{ width: "14px", height: "14px" }} />}
            >
              Take diagnostic quiz
            </Button>
          </Link>
        </Card>

        {/* Tasks Section */}
        <Card variant="panel" staggerIndex={1} className="p-6 space-y-5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "14px", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--heading)", margin: 0 }}>
                Recommended revision activities
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                Targeted study tasks generated based on your quiz accuracy
              </p>
            </div>

            {/* Filter Buttons */}
            <div
              style={{
                backgroundColor: "var(--raised)",
                padding: "3px",
                borderRadius: "var(--radius-button)",
                border: "1px solid var(--border)",
                display: "inline-flex",
                gap: "2px",
              }}
            >
              {(["ALL", "PENDING", "COMPLETED"] as const).map((f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                      backgroundColor: isActive ? "var(--button)" : "transparent",
                      color: isActive ? "var(--button-text)" : "var(--text-secondary)",
                      transition: "background-color 150ms var(--ease-standard), color 150ms var(--ease-standard)",
                    }}
                    className="focus-ring"
                  >
                    {f === "ALL" ? "All" : f === "PENDING" ? "Pending" : "Completed"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const isDone = task.status === "COMPLETED";
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.status)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--radius-button)",
                      border: "1px solid var(--border)",
                      backgroundColor: isDone ? "var(--panel)" : "var(--raised)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      cursor: "pointer",
                      opacity: isDone ? 0.55 : 1,
                      transition: "opacity 180ms var(--ease-standard)",
                    }}
                    className="hover:border-[var(--heading)]"
                  >
                    <button
                      type="button"
                      aria-label={`${isDone ? "Reopen" : "Complete"} task: ${task.recommendedActivity}`}
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        border: isDone ? "1px solid var(--strong)" : "1px solid var(--border)",
                        backgroundColor: isDone ? "var(--strong)" : "transparent",
                        color: "var(--bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {isDone && <Check style={{ width: "12px", height: "12px" }} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "3px",
                            backgroundColor: "var(--panel)",
                            color: task.priority === "HIGH" ? "var(--weak)" : "var(--okay)",
                            border: "1px solid var(--border)",
                            textTransform: "uppercase",
                          }}
                        >
                          {task.priority} priority
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {task.topicName}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: "12px",
                          lineHeight: 1.5,
                          color: "var(--text-primary)",
                          textDecoration: isDone ? "line-through" : "none",
                          margin: 0,
                        }}
                      >
                        {task.recommendedActivity}
                      </p>
                    </div>

                    <span style={{ fontSize: "11px", fontWeight: 600, color: isDone ? "var(--strong)" : "var(--text-secondary)", flexShrink: 0 }}>
                      {isDone ? "Done" : "Mark done"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-secondary)", fontSize: "12px" }}>
                {isLoading ? "Loading revision tasks..." : "No revision tasks match this filter."}
              </div>
            )}
          </div>

          <PlanExtras onOpenAdaptivePlanner={() => router.push("/planner")} />
        </Card>

        {/* 3 Targeted Practice Questions Section */}
        <Card variant="panel" staggerIndex={2} className="p-6 space-y-6">
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--heading)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
              Active reinforcement
            </span>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Targeted follow-up practice (3 questions)
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
              Reinforce the specific topics where accuracy was lowest. Select an option to check your answer and view grounded page citations.
            </p>
          </div>

          <div className="space-y-6">
            {practiceQuestions.map((pq, qIdx) => {
              const selectedOpt = selectedAnswers[qIdx];
              const isRevealed = revealedSolutions[qIdx];
              const isCorrect = selectedOpt === pq.correctAnswer;

              return (
                <div
                  key={qIdx}
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-button)",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--raised)",
                  }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        backgroundColor: "var(--panel)",
                        color: "var(--heading)",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {qIdx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        backgroundColor: "var(--panel)",
                        color: "var(--heading)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {pq.topicName}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        backgroundColor: "var(--panel)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {pq.pageReferences}
                    </span>
                  </div>

                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>
                    {pq.question}
                  </h4>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {pq.options.map((option, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isChosen = selectedOpt === option;
                      const isTargetCorrect = option === pq.correctAnswer;

                      let borderColor = "var(--border)";
                      let bgColor = "var(--panel)";
                      let textColor = "var(--text-primary)";

                      if (isRevealed) {
                        if (isTargetCorrect) {
                          borderColor = "var(--strong)";
                          bgColor = "rgba(34, 197, 94, 0.15)";
                          textColor = "var(--strong)";
                        } else if (isChosen && !isTargetCorrect) {
                          borderColor = "var(--weak)";
                          bgColor = "rgba(239, 68, 68, 0.15)";
                          textColor = "var(--weak)";
                        }
                      } else if (isChosen) {
                        borderColor = "var(--primary)";
                        bgColor = "var(--secondary)";
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectPracticeOption(qIdx, option)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "var(--radius-button)",
                            border: `1px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            color: textColor,
                            fontSize: "12px",
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            transition: "background-color 150ms var(--ease-standard)",
                          }}
                          className="focus-ring active:scale-[0.99]"
                        >
                          <span
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 700,
                              backgroundColor: "var(--raised)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {letter}
                          </span>
                          <span className="flex-1">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {isRevealed && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "var(--radius-button)",
                        border: isCorrect ? "1px solid var(--strong)" : "1px solid var(--weak)",
                        backgroundColor: isCorrect ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                      className="space-y-1"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                        {isCorrect ? (
                          <>
                            <CheckCircle2 style={{ width: "15px", height: "15px", color: "var(--strong)" }} />
                            <span style={{ color: "var(--strong)" }}>Correct answer!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle style={{ width: "15px", height: "15px", color: "var(--weak)" }} />
                            <span style={{ color: "var(--weak)" }}>Incorrect. Correct answer: {pq.correctAnswer}</span>
                          </>
                        )}
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.5, opacity: 0.9 }}>{pq.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
