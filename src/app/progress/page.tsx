"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Award,
  CheckSquare,
  HelpCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useMaterial } from "@/context/MaterialContext";
import { ProgressExtras } from "@/features/components/ProgressExtras";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TopNavBar } from "@/components/ui/TopNavBar";

interface ProgressStats {
  totalAttempts: number;
  averageScore: number;
  completedTasks: number;
  pendingTasks: number;
  recentAttempts: Array<{
    id: string;
    materialId: string;
    materialTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    createdAt: string;
  }>;
  topicMastery: Array<{
    topicName: string;
    total: number;
    correct: number;
    percentage: number;
    isWeak: boolean;
    status: string;
  }>;
  scoreTrend: Array<{
    attemptNumber: number;
    percentage: number;
    score: number;
    totalQuestions: number;
    materialTitle: string;
    date: string;
  }>;
}

export default function ProgressPage() {
  const router = useRouter();
  const { activeMaterial } = useMaterial();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const url = activeMaterial?.id ? `/api/progress?materialId=${activeMaterial.id}` : "/api/progress";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error("Failed to load progress:", err))
      .finally(() => setIsLoading(false));
  }, [activeMaterial?.id]);

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
      <TopNavBar
        title="Progress & Mastery Analytics"
        subtitle="Track scores and topic mastery over time"
        backHref="/"
        showHelp
        helpText="View your quiz attempt history, score distributions, and topic mastery levels."
      />

      <div className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="panel" staggerIndex={0}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
              Total quizzes taken
            </span>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>
                {stats?.totalAttempts ?? 0}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>attempts</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px", margin: 0 }}>
              Saved persistently in local SQLite DB
            </p>
          </Card>

          <Card variant="panel" staggerIndex={1}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
              Average score
            </span>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--heading)" }}>
                {stats?.averageScore ?? 0}%
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>cumulative</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px", margin: 0 }}>
              Server-evaluated accuracy
            </p>
          </Card>

          <Card variant="panel" staggerIndex={2}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
              Revision tasks completed
            </span>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--strong)" }}>
                {stats?.completedTasks ?? 0}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                / {(stats?.completedTasks ?? 0) + (stats?.pendingTasks ?? 0)} total
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px", margin: 0 }}>
              Actioned targeted study
            </p>
          </Card>

          <Card variant="panel" staggerIndex={3}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
              Assessed topics
            </span>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>
                {stats?.topicMastery?.length ?? 0}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>units</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px", margin: 0 }}>
              Tested in diagnostic quizzes
            </p>
          </Card>
        </div>

        {/* Empty State if 0 attempts */}
        {!isLoading && (!stats || stats.totalAttempts === 0) && (
          <Card variant="panel" className="text-center p-10 space-y-4">
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                backgroundColor: "var(--raised)",
                color: "var(--heading)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                border: "1px solid var(--border)",
              }}
            >
              <TrendingUp style={{ width: "26px", height: "26px" }} />
            </div>
            <div className="max-w-md mx-auto">
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--heading)", margin: "0 0 4px 0" }}>
                No quiz attempts recorded yet
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                Take a diagnostic quiz on your study material to see your scores, topic accuracies, and weak-area trajectories charted here.
              </p>
            </div>
            <Link href="/quiz" className="no-underline inline-block pt-2">
              <Button
                variant="primary"
                icon={<HelpCircle style={{ width: "15px", height: "15px" }} />}
              >
                Take first quiz
              </Button>
            </Link>
          </Card>
        )}

        {/* Topic-Wise Mastery Progress */}
        {stats && stats.topicMastery && stats.topicMastery.length > 0 && (
          <Card variant="panel" className="p-6 space-y-5">
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--heading)", margin: 0 }}>
                Topic-by-topic mastery
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                Calculated from all historical responses. Topics with &lt;60% accuracy are marked as weak areas.
              </p>
            </div>

            <div className="space-y-4">
              {stats.topicMastery.map((tm) => (
                <div key={tm.topicName} className="space-y-2">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{tm.topicName}</span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          backgroundColor: tm.isWeak ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                          color: tm.isWeak ? "var(--weak)" : "var(--strong)",
                          border: `1px solid ${tm.isWeak ? "var(--weak)" : "var(--strong)"}`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        {tm.isWeak ? (
                          <AlertTriangle style={{ width: "10px", height: "10px" }} />
                        ) : (
                          <CheckCircle2 style={{ width: "10px", height: "10px" }} />
                        )}
                        <span>{tm.status}</span>
                      </span>
                    </div>

                    <div style={{ color: "var(--text-secondary)" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{tm.percentage}%</span> ({tm.correct} / {tm.total} correct)
                    </div>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "var(--raised)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "var(--radius-pill)",
                        width: `${tm.percentage}%`,
                        backgroundColor:
                          tm.percentage >= 85
                            ? "var(--strong)"
                            : tm.percentage >= 60
                            ? "var(--okay)"
                            : "var(--weak)",
                        transition: "width 500ms var(--ease-standard)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Feature Pack: Unified Performance Insights & Share Card */}
        <ProgressExtras
          onOpenMastery={() => router.push("/mastery")}
          onOpenShareCard={() => router.push("/share")}
        />

        {/* Previous Quiz Attempts Table */}
        {stats && stats.recentAttempts && stats.recentAttempts.length > 0 && (
          <Card variant="panel" className="p-6 space-y-4">
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--heading)", margin: 0 }}>
                Quiz history & score trajectory
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                Saved attempts showing how your score changes over time
              </p>
            </div>

            <div className="overflow-x-auto">
              <table style={{ width: "100%", textAlign: "left", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>
                    <th style={{ paddingBottom: "10px", fontWeight: 600 }}>Attempt</th>
                    <th style={{ paddingBottom: "10px", fontWeight: 600 }}>Study material</th>
                    <th style={{ paddingBottom: "10px", fontWeight: 600 }}>Score</th>
                    <th style={{ paddingBottom: "10px", fontWeight: 600 }}>Percentage</th>
                    <th style={{ paddingBottom: "10px", fontWeight: 600 }}>Date</th>
                    <th style={{ paddingBottom: "10px", fontWeight: 600, textAlign: "right" }}>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAttempts.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 0", fontWeight: 700, color: "var(--heading)" }}>
                        #{stats.recentAttempts.length - i}
                      </td>
                      <td style={{ padding: "12px 0", fontWeight: 600, color: "var(--text-primary)" }} className="max-w-xs truncate">
                        {a.materialTitle}
                      </td>
                      <td style={{ padding: "12px 0", color: "var(--text-secondary)" }}>
                        {a.score} / {a.totalQuestions}
                      </td>
                      <td style={{ padding: "12px 0" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: a.percentage >= 60 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: a.percentage >= 60 ? "var(--strong)" : "var(--weak)",
                            border: `1px solid ${a.percentage >= 60 ? "var(--strong)" : "var(--weak)"}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {a.percentage >= 60 ? (
                            <CheckCircle2 style={{ width: "11px", height: "11px" }} />
                          ) : (
                            <AlertTriangle style={{ width: "11px", height: "11px" }} />
                          )}
                          <span>{a.percentage}%</span>
                        </span>
                      </td>
                      <td style={{ padding: "12px 0", color: "var(--text-secondary)" }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 0", textAlign: "right" }}>
                        <Link
                          href={`/quiz/results/${a.id}`}
                          style={{ fontWeight: 600, color: "var(--heading)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          className="hover:underline"
                        >
                          <span>Results</span>
                          <ArrowRight style={{ width: "13px", height: "13px" }} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
