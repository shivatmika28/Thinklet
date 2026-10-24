"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMaterial } from "@/context/MaterialContext";
import {
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
} from "lucide-react";
import { QuizQuestionData } from "@/lib/types";
import { QuizExtras } from "@/features/components/QuizExtras";
import { useFeatures } from "@/features/components/FeaturesProvider";
import { PreferencesBar } from "@/features/components/PreferencesBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { CuteBookMascot, CelebrationTrophyMascot } from "@/components/ui/illustrations";
import { logQuizAnswered, logQuizFinished, PreTestCalmScreen, loadPersonalStore } from "@/features/personal"; // [PERSONAL]

export default function QuizPage() {
  const router = useRouter();
  const { activeMaterial, loadDemoMaterial, isLoading: contextLoading } = useMaterial();
  const { settings } = useFeatures();

  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCompletedCalm, setHasCompletedCalm] = useState<boolean>(false); // [PERSONAL]

  const startQuiz = async () => {
    if (!activeMaterial?.id) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setQuestions([]);
    setUserAnswers({});
    setCurrentIdx(0);

    try {
      const res = await fetch(`/api/materials/${activeMaterial.id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: settings.language,
          level: settings.explanationLevel,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate quiz.");
      }
      setQuestions(data.questions || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load quiz questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    logQuizAnswered(activeMaterial?.id, undefined); // [PERSONAL]
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeMaterial?.id) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/materials/${activeMaterial.id}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: userAnswers,
          language: settings.language,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit quiz.");
      }

      logQuizFinished(data.attemptId ? 1 : 0, questions.length, activeMaterial?.id); // [PERSONAL]
      router.push(`/quiz/results/${data.attemptId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Submission error.");
      setIsSubmitting(false);
    }
  };

  if (!contextLoading && !activeMaterial) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
        <TopNavBar title="Diagnostic Quiz" subtitle="Test your comprehension" backHref="/" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card variant="panel" className="max-w-md w-full text-center space-y-4 p-8">
            <div className="flex justify-center mb-1">
              <CuteBookMascot size="lg" className="animate-gentle-bounce" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--heading)", margin: "0 0 4px 0" }}>
              No study material selected
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Please upload study material or load our demo material to generate a diagnostic quiz.
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

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(userAnswers).length;
  const isLastQuestion = currentIdx === questions.length - 1;

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
      {questions.length > 0 && !hasCompletedCalm && (loadPersonalStore().relaxMode || loadPersonalStore().switches.preTestCalmDefault) && <PreTestCalmScreen onComplete={() => setHasCompletedCalm(true)} onSkip={() => setHasCompletedCalm(true)} />} {/* [PERSONAL] */}
      <TopNavBar
        title="Diagnostic Quiz"
        subtitle={
          questions.length > 0
            ? `Question ${currentIdx + 1} of ${questions.length} • Answered ${answeredCount}/${questions.length}`
            : `Testing: ${activeMaterial?.title || "Active Document"}`
        }
        onBack={() => {
          if (questions.length > 0) {
            if (window.confirm("Save & Exit this quiz? Your current progress will be preserved.")) {
              router.push("/");
            }
          } else {
            router.push("/");
          }
        }}
        showHelp
        helpText="Answer each question to evaluate your grasp. Thinklet analyzes weak areas automatically."
      />

      <div className="p-6 md:p-8 max-w-3xl w-full mx-auto space-y-6">
        {errorMsg && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Initial Start Quiz State */}
        {questions.length === 0 && (
          <Card variant="panel" className="text-center p-8 space-y-6">
            <div className="flex justify-center mb-1">
              <CelebrationTrophyMascot size="lg" className="animate-gentle-bounce" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--heading)", margin: 0 }}>
                Diagnostic 5-question quiz
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                Gemini will dynamically generate 5 grounded multiple-choice questions testing your comprehension of{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>"{activeMaterial?.title}"</span>. Answer all 5 questions to reveal weak topics and unlock targeted revision.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-button)",
                padding: "14px 18px",
                maxWidth: "380px",
                margin: "0 auto",
                textAlign: "left",
                fontSize: "12px",
                color: "var(--text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 style={{ width: "15px", height: "15px", color: "var(--strong)", flexShrink: 0 }} />
                <span>5 questions • 4 options each</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 style={{ width: "15px", height: "15px", color: "var(--strong)", flexShrink: 0 }} />
                <span>Source page references cited for each question</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 style={{ width: "15px", height: "15px", color: "var(--strong)", flexShrink: 0 }} />
                <span>Server-evaluated score & weak topic analysis (&lt;60%)</span>
              </div>
            </div>

            <div className="max-w-md mx-auto w-full">
              <PreferencesBar compact={true} />
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={startQuiz}
              loading={isGenerating}
              icon={<HelpCircle style={{ width: "16px", height: "16px" }} />}
              className="mx-auto"
            >
              {isGenerating ? "Generating questions with Gemini..." : "Start diagnostic quiz"}
            </Button>
          </Card>
        )}

        {/* Active Quiz Question Step */}
        {questions.length > 0 && currentQ && (
          <div className="space-y-6">
            {/* Progress Header */}
            <Card variant="panel" className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span style={{ fontWeight: 700, color: "var(--heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  {answeredCount} of {questions.length} answered
                </span>
              </div>

              {/* Progress Bar */}
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
                    backgroundColor: "var(--button)",
                    width: `${((currentIdx + 1) / questions.length) * 100}%`,
                    transition: "width 240ms var(--ease-standard)",
                  }}
                />
              </div>

              {/* Question Navigation Bubbles */}
              <div className="flex items-center gap-2 pt-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!userAnswers[q.id];
                  const isCurrent = idx === currentIdx;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        border: isCurrent
                          ? "1.5px solid var(--primary)"
                          : isAnswered
                          ? "1px solid var(--strong)"
                          : "1px solid var(--border)",
                        backgroundColor: isCurrent
                          ? "var(--primary)"
                          : isAnswered
                          ? "rgba(34, 197, 94, 0.15)"
                          : "var(--card)",
                        color: isCurrent
                          ? "var(--primary-foreground)"
                          : isAnswered
                          ? "var(--strong)"
                          : "var(--text-secondary)",
                      }}
                      className="focus-ring transition-transform active:scale-[0.95]"
                      aria-label={`Jump to question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Main Question Card */}
            <Card variant="panel" className="p-6 md:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: "var(--raised)",
                      border: "1px solid var(--border)",
                      color: "var(--heading)",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {currentQ.topicName}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Source: {currentQ.pageReferences}
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4, margin: 0 }}>
                  {currentQ.question}
                </h3>
              </div>

              {/* 4 Multiple Choice Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === option;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, option)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "14px 16px",
                        borderRadius: "var(--radius-button)",
                        border: isSelected ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                        backgroundColor: isSelected ? "var(--secondary)" : "var(--card)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "all 150ms var(--ease-standard)",
                      }}
                      className="focus-ring hover:border-primary/50 active:scale-[0.99] thinklet-row-hover"
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          backgroundColor: isSelected ? "var(--button)" : "var(--panel)",
                          color: isSelected ? "var(--button-text)" : "var(--text-secondary)",
                          border: isSelected ? "1px solid var(--button)" : "1px solid var(--border)",
                        }}
                      >
                        {letter}
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: isSelected ? 600 : 400 }}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Actions */}
              <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  icon={<ArrowLeft style={{ width: "14px", height: "14px" }} />}
                >
                  Previous
                </Button>

                {isLastQuestion ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmitQuiz}
                    disabled={answeredCount === 0}
                    loading={isSubmitting}
                    icon={<CheckCircle2 style={{ width: "15px", height: "15px" }} />}
                  >
                    Submit diagnostic quiz
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                  >
                    <span>Next</span>
                    <ArrowRight style={{ width: "14px", height: "14px" }} />
                  </Button>
                )}
              </div>

              <QuizExtras />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
