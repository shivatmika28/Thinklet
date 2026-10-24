"use client";

import React, { useState, useRef } from "react";
import { useMaterial } from "@/context/MaterialContext";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  BookOpen,
  HelpCircle,
  FileUp,
} from "lucide-react";
import Link from "next/link";
import { TranscriptInput } from "@/features/components/TranscriptInput";
import { ImageInput } from "@/features/components/ImageInput";
import { PageText } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { TopNavBar } from "@/components/ui/TopNavBar";
import { CuteBookMascot } from "@/components/ui/illustrations";
import { logDocumentOpened } from "@/features/personal"; // [PERSONAL]

export default function MaterialsPage() {
  const {
    materials,
    activeMaterialId,
    setActiveMaterialId,
    refreshMaterials,
    loadDemoMaterial,
    currentPages,
    updateCurrentMaterial,
  } = useMaterial();

  const [mode, setMode] = useState<"pdf" | "paste" | "transcript" | "image">("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
        setErrorMsg(null);
      } else {
        setErrorMsg("Please upload a valid PDF document.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("sourceType", mode);
      if (customTitle.trim()) {
        formData.append("title", customTitle.trim());
      }

      if (mode === "pdf") {
        if (!selectedFile) {
          throw new Error("Please select a PDF file to upload.");
        }
        formData.append("file", selectedFile);
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 50) {
          throw new Error("Pasted content must be at least 50 characters.");
        }
        formData.append("text", pastedText.trim());
      }

      const res = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to process study material.");
      }

      setSuccessMsg(`"${data.material.title}" processed with ${data.material.topicsCount || (data.material.topics?.length ?? 0)} topics!`);
      setSelectedFile(null);
      setPastedText("");
      setCustomTitle("");
      if (data.material?.id) {
        setActiveMaterialId(data.material.id);
      }
      await refreshMaterials();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error processing material.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this material and its quiz history?")) return;

    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await refreshMaterials();
      } else {
        setErrorMsg(data.error || "Failed to delete.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg("Failed to delete study material.");
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg)", minHeight: "100%" }}>
      <TopNavBar
        title="Upload & Scan Notes"
        subtitle="PDFs, lecture notes, transcripts & image summaries"
        backHref="/"
        showHelp
        helpText="Upload a PDF (up to 20 pages) or paste notes to automatically extract study topics"
      />

      <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Container Card */}
        <Card variant="panel" className="p-0 overflow-hidden">
          {/* Form Header with Mode Switcher */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
            className="sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--heading)", margin: 0 }}>
                Add study material
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                PDFs are limited to 20 pages. Page references are preserved for grounded AI citations.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--raised)",
                padding: "3px",
                borderRadius: "var(--radius-button)",
                border: "1px solid var(--border)",
                display: "inline-flex",
                gap: "2px",
              }}
              className="flex-wrap"
            >
              {[
                { id: "pdf", label: "Upload PDF" },
                { id: "paste", label: "Paste text" },
                { id: "transcript", label: "🎙️ Subtitles (.srt)" },
                { id: "image", label: "📷 Image OCR" },
              ].map((tab) => {
                const isActive = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id as typeof mode)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                      backgroundColor: isActive ? "var(--button)" : "transparent",
                      color: isActive ? "var(--button-text)" : "var(--text-secondary)",
                      transition: "background-color 150ms var(--ease-standard), color 150ms var(--ease-standard)",
                    }}
                    className="focus-ring"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === "transcript" ? (
            <div style={{ padding: "20px" }}>
              <TranscriptInput
                onUpdateMaterial={(newPages, newTopics) => {
                  updateCurrentMaterial(newPages, newTopics);
                  setSuccessMsg("Transcript segmented and imported into study material pipeline!");
                }}
              />
            </div>
          ) : mode === "image" ? (
            <div style={{ padding: "20px" }}>
              <ImageInput
                currentPageCount={currentPages.length}
                onAddMaterialPage={(newPage: PageText) => {
                  updateCurrentMaterial([...currentPages, newPage], []);
                  setSuccessMsg("Transcribed image text appended to study material!");
                }}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Title Input */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Document title (optional)
                </label>
                <Input
                  type="text"
                  placeholder={mode === "pdf" ? "e.g., Cellular Biology: Chapter 4" : "e.g., Organic Chemistry Reaction Notes"}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="h-10 text-xs sm:text-sm bg-background border-input"
                />
              </div>

              {/* PDF Mode */}
              {mode === "pdf" && (
                <div>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: isDragging ? "2px dashed var(--ring)" : selectedFile ? "1.5px solid var(--strong)" : "1.5px dashed var(--border)",
                      backgroundColor: isDragging ? "var(--secondary)" : selectedFile ? "rgba(34, 197, 94, 0.08)" : "var(--card)",
                      borderRadius: "var(--radius-card)",
                      padding: "32px 20px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 180ms var(--ease-standard)",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        backgroundColor: "var(--panel)",
                        color: "var(--heading)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px auto",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <UploadCloud style={{ width: "22px", height: "22px" }} />
                    </div>

                    {selectedFile ? (
                      <div className="space-y-1">
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                          {selectedFile.name}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                        </p>
                        <span style={{ fontSize: "11px", color: "var(--heading)", textDecoration: "underline", display: "inline-block", marginTop: "4px" }}>
                          Click to select a different PDF
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                          Drag and drop your PDF here, or <span style={{ color: "var(--heading)", textDecoration: "underline" }}>browse</span>
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                          Supports text-based lecture notes and textbooks up to 20 pages (Max 15MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Paste Text Mode */}
              {mode === "paste" && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                    Paste study content
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Paste your notes or text here... (You can include page markers like 'Page 1', 'Page 2' to preserve specific citations)"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-button)",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--raised)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      fontFamily: "monospace",
                      outline: "none",
                    }}
                    className="focus-ring"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    <span>Minimum 50 characters required</span>
                    <span>{pastedText.length} characters</span>
                  </div>
                </div>
              )}

              {/* Submit & Demo Actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingTop: "8px", flexWrap: "wrap" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => loadDemoMaterial()}
                  icon={<Sparkles style={{ width: "14px", height: "14px", color: "var(--accent)" }} />}
                >
                  Load pre-configured demo
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={isSubmitting || (mode === "pdf" && !selectedFile) || (mode === "paste" && !pastedText.trim())}
                  loading={isSubmitting}
                  icon={<FileUp style={{ width: "15px", height: "15px" }} />}
                >
                  {isSubmitting ? "Extracting & analyzing topics..." : "Process & extract topics"}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Existing Materials List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--heading)", margin: 0 }}>
              Your study materials ({materials.length})
            </h3>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Select a card to set as active document
            </span>
          </div>

          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((m) => {
                const isActive = m.id === activeMaterialId;
                return (
                  <Card
                    key={m.id}
                    variant="panel"
                    onClick={() => {
                      setActiveMaterialId(m.id);
                      logDocumentOpened(m.id); // [PERSONAL]
                    }}
                    style={{
                      border: isActive ? "1px solid var(--primary)" : "1px solid var(--border)",
                      backgroundColor: isActive ? "var(--secondary)" : "var(--card)",
                      cursor: "pointer",
                    }}
                    className="space-y-3 transition-colors hover:border-border/80 thinklet-card-hover"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: isActive ? "var(--button)" : "var(--raised)",
                            color: isActive ? "var(--button-text)" : "var(--heading)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FileText style={{ width: "16px", height: "16px" }} />
                        </div>
                        <div className="min-w-0">
                          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }} className="truncate">
                            {m.title}
                          </h4>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {m.pageCount} pages • {m.topicsCount} topics
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(m.id, e)}
                        aria-label="Delete material"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        className="focus-ring hover:text-[var(--weak)]"
                      >
                        <Trash2 style={{ width: "15px", height: "15px" }} />
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border)", fontSize: "11px" }}>
                      <span style={{ color: isActive ? "var(--heading)" : "var(--text-secondary)", fontWeight: 600 }}>
                        {isActive ? "Active document" : "Click to select"}
                      </span>
                      <div className="flex items-center gap-3">
                        <Link
                          href="/learn"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "var(--heading)", fontWeight: 600, textDecoration: "none" }}
                          className="hover:underline"
                        >
                          Learn
                        </Link>
                        <Link
                          href="/quiz"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "var(--heading)", fontWeight: 600, textDecoration: "none" }}
                          className="hover:underline"
                        >
                          Quiz
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card variant="panel" className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
              <div className="flex justify-center mb-3">
                <CuteBookMascot size="lg" className="animate-gentle-bounce" />
              </div>
              <p className="text-sm font-bold text-[var(--text)] mb-1 font-['Quicksand',sans-serif]">
                No study materials uploaded yet!
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-4 max-w-sm mx-auto">
                Drag and drop a PDF above or load the pre-configured demo material to get started with flashcards and quizzes.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => loadDemoMaterial()}
                className="gap-2 mx-auto"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span>Load Sample Material</span>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
