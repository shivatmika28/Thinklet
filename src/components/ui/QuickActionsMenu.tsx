"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  ArrowLeft,
  Layers,
  Timer,
  Lightbulb,
  FileQuestion,
  Wand2,
  ChevronRight,
  Command,
  Sparkles,
  Sun,
  Moon,
  Users,
  Leaf, // [PERSONAL]
} from "lucide-react";
import { Badge } from "./Badge";
import { useTheme } from "@/context/ThemeContext";

interface ActionItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  tag: string;
  shortcut: string;
  href: string;
}

export function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);

  const actions: ActionItem[] = [
    {
      id: "scanner",
      icon: Wand2,
      title: "Magic Note Scanner",
      subtitle: "Ingest lecture PDFs & notes into source-grounded summaries",
      tag: "Ingest",
      shortcut: "⌘1",
      href: "/materials",
    },
    {
      id: "flashcards",
      icon: Layers,
      title: "AI Flashcard Forge",
      subtitle: "3D active-recall deck with Leitner spaced repetition",
      tag: "Recall",
      shortcut: "⌘2",
      href: "/flashcards",
    },
    {
      id: "sprint",
      icon: Timer,
      title: "Focus Sprint",
      subtitle: "Interactive Pomodoro study session with ambient timer",
      tag: "Timer",
      shortcut: "⌘3",
      href: "/tracker",
    },
    {
      id: "tutor",
      icon: Lightbulb,
      title: "Ask Thinklet Tutor",
      subtitle: "Socratic conversational AI with source citation grounding",
      tag: "Tutor",
      shortcut: "⌘4",
      href: "/learn",
    },
    {
      id: "quiz",
      icon: FileQuestion,
      title: "Pop Quiz Generator",
      subtitle: "Dynamic diagnostic questions generated from materials",
      tag: "Practice",
      shortcut: "⌘5",
      href: "/quiz",
    },
    {
      id: "theme",
      icon: theme === "dark" ? Sun : Moon,
      title: "Toggle Theme Appearance",
      subtitle: `Switch between Light, Dark, and System (currently ${theme})`,
      tag: "Theme",
      shortcut: "⌘T",
      href: "#theme",
    },
    {
      id: "collaborate",
      icon: Users,
      title: "Collaborate with Students",
      subtitle: "Study circles, peer challenges, study deck sharing & co-study sprints",
      tag: "Social",
      shortcut: "⌘U",
      href: "#collab",
    },
    {
      id: "myspace",
      icon: Leaf,
      title: "Open My Space",
      subtitle: "Personal study sanctuary, relaxation pacing & learning insights",
      tag: "Personal",
      shortcut: "⌘M",
      href: "#myspace",
    }, // [PERSONAL]
  ];

  // Custom event listener for external triggers
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("open-quick-actions", handleOpenEvent);
    return () => window.removeEventListener("open-quick-actions", handleOpenEvent);
  }, []);

  // Global Cmd+K / Ctrl+K, Cmd+T / Ctrl+T, and Cmd+U / Ctrl+U listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "t") {
        // Only toggle if not in an active input/textarea
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          toggleTheme();
        }
      } else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "u" || e.key === "6")) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent("open-collaboration"));
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent("thinklet:open-myspace")); // [PERSONAL]
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  // Escape key listener to close overlay
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        mainButtonRef.current?.focus();
      }
    },
    [isOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus trap / auto-focus first item on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        firstActionRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleActionClick = (href: string) => {
    if (href === "#theme") {
      toggleTheme();
      return;
    }
    if (href === "#collab") {
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("open-collaboration"));
      return;
    }
    if (href === "#myspace" || href === "/myspace") {
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("thinklet:open-myspace")); // [PERSONAL]
      return;
    }
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* 1. Floating Action Pill Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          ref={mainButtonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label="Open Thinklet Quick Actions"
          className="group flex items-center gap-2 h-12 px-4 rounded-full bg-[#98473E] text-white hover:bg-[#823C34] shadow-[0_8px_24px_-2px_rgba(152,71,62,0.35),inset_0_2px_2px_0_rgba(255,255,255,0.35),inset_0_-2px_4px_0_rgba(60,20,15,0.3)] border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#A37C40] text-white">
            <Plus
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-45" : "rotate-0"
              }`}
            />
          </div>
          <span className="text-xs font-bold font-['Quicksand',sans-serif] tracking-wide pr-1 hidden sm:inline-block">
            Quick Actions
          </span>
          <kbd className="hidden md:inline-flex h-5 items-center px-1.5 rounded-full bg-white/10 font-mono text-[10px] text-white/80">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 2. Claymorphic Command Palette Overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick Actions"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0A1128]/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <div
            className="relative z-51 w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-0 shadow-[0_24px_50px_-12px_rgba(10,17,40,0.35)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex h-5 items-center px-2 rounded-full border border-[var(--border)] bg-[var(--surface)] font-mono text-[10px] font-semibold text-[var(--text-muted)]">
                  ESC to close
                </kbd>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Title section */}
            <div className="px-6 pt-5 pb-3">
              <div className="flex items-center gap-2 text-[var(--text)] font-bold text-lg font-['Quicksand',sans-serif]">
                <Sparkles className="h-5 w-5 text-[#98473E]" />
                <span>Thinklet Quick Actions</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Select an AI study tool to accelerate your learning flow.
              </p>
            </div>

            {/* Actions Grid */}
            <div className="p-6 pt-2 grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto">
              {actions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    ref={idx === 0 ? firstActionRef : undefined}
                    type="button"
                    onClick={() => handleActionClick(action.href)}
                    className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[#98473E] shadow-[0_6px_16px_-4px_rgba(48,37,31,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.4)] hover:shadow-[0_10px_24px_-4px_rgba(48,37,31,0.1)] transition-all duration-200 text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-[var(--surface-hover)] text-[#98473E] flex items-center justify-center shrink-0 border border-[var(--border-soft)] group-hover:bg-[#98473E] group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text)] truncate font-['Quicksand',sans-serif]">
                            {action.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            {action.tag}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                          {action.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
                      <kbd className="hidden sm:inline-flex h-5 items-center px-2 font-mono text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded-full bg-[var(--surface-raised)]">
                        {action.shortcut}
                      </kbd>
                      <ChevronRight className="h-4 w-4 text-[#98473E] group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
