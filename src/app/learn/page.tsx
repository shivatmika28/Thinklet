"use client";

import React, { useState, useEffect } from "react";
import { useMaterial } from "@/context/MaterialContext";
import {
  BookOpen,
  Sparkles,
  Send,
  HelpCircle,
  FileText,
  Bookmark,
  CheckCircle,
  Info,
  Layers,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopicItem } from "@/lib/types";
import { LearnExtras } from "@/features/components/LearnExtras";
import { useFeatures } from "@/features/components/FeaturesProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { Input } from "@/components/ui/Input";
import { CuteBookMascot } from "@/components/ui/illustrations";

export default function LearnPage() {
  const router = useRouter();
  const { activeMaterial, loadDemoMaterial, currentPages, isLoading: contextLoading } = useMaterial();
  const { settings } = useFeatures();

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [citations, setCitations] = useState<string[]>([]);
  const [isDemoData, setIsDemoData] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [socraticMode, setSocraticMode] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ type: "question" | "answer"; text: string; citations?: string[]; isDemo?: boolean }>
  >([]);

  useEffect(() => {
    if (!activeMaterial?.id) return;
    fetch(`/api/materials/${activeMaterial.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.material) {
          const loadedTopics = data.material.topics || [];
          setTopics(loadedTopics);
          if (loadedTopics.length > 0) {
            handleSelectTopic(loadedTopics[0]);
          }
        }
      })
      .catch((err) => console.error("Failed to load topics:", err));
  }, [activeMaterial?.id]);

  const handleSelectTopic = async (topic: TopicItem, forcedSocratic?: boolean) => {
    setSelectedTopic(topic);
    setChatHistory([]);
    setIsExplaining(true);
    setExplanation("");
    setCitations([]);

    const useSocratic = forcedSocratic !== undefined ? forcedSocratic : socraticMode;

    try {
      const res = await fetch(`/api/materials/${activeMaterial?.id}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName: topic.name,
          topicDescription: topic.description,
          language: settings.language,
          tone: settings.tone,
          explanationLevel: settings.explanationLevel,
          dyslexiaMode: settings.dyslexiaMode,
          socraticMode: useSocratic,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExplanation(data.explanation);
        setCitations(data.citations || []);
        setIsDemoData(!!data.isDemo);
      } else {
        setExplanation("Could not load explanation. Please try again.");
      }
    } catch (err) {
      console.error("Explain error:", err);
      setExplanation("Network error while communicating with Gemini API.");
    } finally {
      setIsExplaining(false);
    }
  };

  // Automatically refresh explanation when preferences change
  useEffect(() => {
    if (selectedTopic && activeMaterial?.id && !isExplaining) {
      handleSelectTopic(selectedTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.language, settings.tone, settings.explanationLevel, settings.dyslexiaMode, socraticMode]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim() || !selectedTopic || !activeMaterial) return;

    const q = userQuestion.trim();
    setUserQuestion("");
    setChatHistory((prev) => [...prev, { type: "question", text: q }]);
    setIsExplaining(true);

    try {
      const res = await fetch(`/api/materials/${activeMaterial.id}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName: selectedTopic.name,
          topicDescription: selectedTopic.description,
          userQuestion: q,
          language: settings.language,
          tone: settings.tone,
          explanationLevel: settings.explanationLevel,
          dyslexiaMode: settings.dyslexiaMode,
          socraticMode: socraticMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory((prev) => [
          ...prev,
          {
            type: "answer",
            text: data.explanation,
            citations: data.citations || [],
            isDemo: !!data.isDemo,
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { type: "answer", text: "Unable to answer question. Please rephrase." },
        ]);
      }
    } catch (err) {
      console.error("Ask error:", err);
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", text: "Network error while asking question." },
      ]);
    } finally {
      setIsExplaining(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\[Page\s+\d+\])/g);
    return parts.map((part, i) => {
      if (/^\[Page\s+\d+\]$/.test(part)) {
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "1px 6px",
              borderRadius: "4px",
              backgroundColor: "var(--raised)",
              color: "var(--heading)",
              border: "1px solid var(--border)",
              fontSize: "11px",
              fontWeight: 700,
              margin: "0 2px",
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!contextLoading && !activeMaterial) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
        <TopNavBar title="Learn Room" subtitle="Source-grounded explanations" backHref="/" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card variant="panel" className="max-w-md w-full text-center space-y-4 p-8">
            <div className="flex justify-center mb-1">
              <CuteBookMascot size="lg" className="animate-gentle-bounce" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--heading)", margin: "0 0 4px 0" }}>
              No study material selected
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Please upload study material or load our demo material to begin learning concepts.
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
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", height: "100%" }}>
      <TopNavBar
        title="Thinklet AI Study Room"
        subtitle={`Active study: ${activeMaterial?.title || "Document"}`}
        backHref="/"
        showHelp
        helpText="Select a topic on the left to read source-grounded explanations with page citations."
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Topic Selector Rail */}
        <div
          style={{
            backgroundColor: "var(--panel)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
          }}
          className="w-full md:w-72 shrink-0 h-48 md:h-auto border-b md:border-b-0"
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Topics ({topics.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {topics.map((topic, i) => {
              const isSelected = selectedTopic?.id === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSelectTopic(topic)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-button)",
                    border: isSelected ? "1px solid var(--border)" : "1px solid transparent",
                    borderLeft: isSelected ? "3px solid var(--primary)" : "3px solid transparent",
                    backgroundColor: isSelected ? "var(--secondary)" : "transparent",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    transition: "all 150ms var(--ease-standard)",
                  }}
                  className="focus-ring hover:bg-secondary/60"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected ? "var(--button)" : "var(--raised)",
                        color: isSelected ? "var(--button-text)" : "var(--text-secondary)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <h4 style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "var(--heading)" : "var(--text-primary)", margin: 0 }} className="truncate">
                      {topic.name}
                    </h4>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }} className="line-clamp-2">
                    {topic.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
            <Link href="/quiz" className="no-underline">
              <Button
                variant="outline"
                size="sm"
                icon={<HelpCircle style={{ width: "14px", height: "14px" }} />}
                className="w-full"
              >
                Test with quiz
              </Button>
            </Link>
          </div>
        </div>

        {/* Center Content Pane */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
          <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
            {selectedTopic ? (
              <>
                <Card variant="panel" className="p-6 md:p-8 space-y-4">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "14px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--heading)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                        Topic concept
                      </span>
                      <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                        {selectedTopic.name}
                      </h2>
                    </div>

                    {citations.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>Cited pages:</span>
                        {citations.map((c) => (
                          <span
                            key={c}
                            style={{
                              padding: "2px 8px",
                              backgroundColor: "var(--raised)",
                              border: "1px solid var(--border)",
                              color: "var(--heading)",
                              fontSize: "11px",
                              fontWeight: 700,
                              borderRadius: "4px",
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grounded Explanation */}
                  <div style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6 }}>
                    {isExplaining && !explanation ? (
                      <div className="py-8 space-y-3">
                        <Skeleton height="20px" width="70%" />
                        <Skeleton height="20px" width="100%" />
                        <Skeleton height="20px" width="85%" />
                      </div>
                    ) : (
                      <div
                        style={{
                          backgroundColor: "var(--raised)",
                          padding: "16px",
                          borderRadius: "var(--radius-button)",
                          border: "1px solid var(--border)",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {explanation.toLowerCase().includes("not available in") && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(245, 158, 11, 0.15)",
                              border: "1px solid rgba(245, 158, 11, 0.4)",
                              color: "var(--weak)",
                              fontSize: "12px",
                              fontWeight: 700,
                              marginBottom: "12px",
                            }}
                          >
                            <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                            <span>Information is not available in your uploaded study material</span>
                          </div>
                        )}
                        {renderFormattedText(explanation)}
                      </div>
                    )}
                  </div>

                  {isDemoData && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-button)",
                        backgroundColor: "var(--raised)",
                        border: "1px solid var(--okay)",
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                      }}
                    >
                      <Info style={{ width: "15px", height: "15px", color: "var(--okay)", flexShrink: 0 }} />
                      <span>Simulated demo data: Grounded in pre-loaded sample material.</span>
                    </div>
                  )}

                  <LearnExtras
                    topic={{
                      id: selectedTopic.id,
                      name: selectedTopic.name,
                      summary: selectedTopic.description,
                      description: selectedTopic.description,
                      pages: [1, 2],
                    }}
                    pages={currentPages}
                    onOpenTeachBack={() => router.push(`/checker`)}
                    onOpenVisual={() => router.push(`/visual`)}
                  />
                </Card>

                {/* Follow-up Q&A Thread */}
                {chatHistory.length > 0 && (
                  <div className="space-y-4">
                    <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Targeted clarifications
                    </h4>
                    {chatHistory.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "var(--radius-card)",
                          fontSize: "13px",
                          backgroundColor: item.type === "question" ? "var(--button)" : "var(--raised)",
                          color: item.type === "question" ? "var(--button-text)" : "var(--text-primary)",
                          border: item.type === "question" ? "none" : "1px solid var(--border)",
                          marginLeft: item.type === "question" ? "40px" : "0",
                          marginRight: item.type === "question" ? "0" : "40px",
                        }}
                        className="space-y-2"
                      >
                        <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8 }}>
                          {item.type === "question" ? "Your question" : "Thinklet Tutor"}
                        </div>
                        {item.type === "answer" && item.text.toLowerCase().includes("not available in") && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(245, 158, 11, 0.15)",
                              border: "1px solid rgba(245, 158, 11, 0.4)",
                              color: "var(--weak)",
                              fontSize: "12px",
                              fontWeight: 700,
                              marginBottom: "8px",
                            }}
                          >
                            <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                            <span>Information is not available in your uploaded material</span>
                          </div>
                        )}
                        <div style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>
                          {renderFormattedText(item.text)}
                        </div>
                        {item.citations && item.citations.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Source:</span>
                            {item.citations.map((c) => (
                              <span
                                key={c}
                                style={{
                                  padding: "1px 5px",
                                  backgroundColor: "var(--panel)",
                                  border: "1px solid var(--border)",
                                  color: "var(--heading)",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  borderRadius: "3px",
                                }}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                Select a topic on the left to begin learning.
              </div>
            )}
          </div>

          {/* Bottom Interactive Question Input */}
          <div
            style={{
              padding: "14px 20px",
              backgroundColor: "var(--panel)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setSocraticMode((prev) => !prev)}
                className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  socraticMode
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-background text-muted-foreground border-border hover:bg-secondary/60"
                }`}
                title="Socratic Tutoring Mode: The AI asks guiding questions instead of giving the answer away"
              >
                <span>💡</span>
                <span>Socratic Tutoring: {socraticMode ? "Active" : "Off"}</span>
              </button>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {socraticMode ? "Guiding questions to deduce answers" : "Direct explanation mode"}
              </span>
            </div>
            <form onSubmit={handleAskQuestion} className="max-w-4xl mx-auto flex items-center gap-2">
              <Input
                type="text"
                placeholder={
                  selectedTopic
                    ? `Ask Thinklet a question about "${selectedTopic.name}"...`
                    : "Select a topic first to ask questions..."
                }
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                disabled={!selectedTopic || isExplaining}
                className="h-10 text-xs sm:text-sm bg-background border-input"
              />
              <Button
                variant="default"
                size="sm"
                type="submit"
                disabled={!userQuestion.trim() || !selectedTopic || isExplaining}
                loading={isExplaining}
                icon={<Send className="h-3.5 w-3.5" />}
                className="h-10 px-4 shrink-0 font-medium text-xs"
              >
                Ask
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
