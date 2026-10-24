"use client";

import React, { useState, useRef, useEffect } from "react";
import { Leaf, Sparkles, Wind, Headphones, ExternalLink, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { usePersonalStore } from "../services/personalStore";

export interface RelaxButtonProps {
  onOpenMySpace?: () => void;
  className?: string;
}

export const RelaxButton: React.FC<RelaxButtonProps> = ({
  onOpenMySpace,
  className = "",
}) => {
  const { store, setRelaxMode } = usePersonalStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client hydration render, mounted is false.
  // This guarantees identical button attributes, title, and Leaf icon class between server and initial client render.
  // After mount, the restored preference from store.relaxMode is applied cleanly.
  const isRelaxOn = mounted ? store.relaxMode : false;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleRelax = () => {
    setRelaxMode(!isRelaxOn);
  };

  const handleOpenHub = () => {
    setIsOpen(false);
    if (onOpenMySpace) {
      onOpenMySpace();
    } else {
      // Broadcast event so any mounted MySpaceDialog can open
      window.dispatchEvent(new CustomEvent("thinklet:open-myspace"));
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Compact Top-Bar Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Relax Mode and My Space. Currently ${isRelaxOn ? "ON" : "OFF"}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`Relax Mode & My Space (${isRelaxOn ? "Active" : "Ready"})`}
        className={`h-8.5 px-2.5 rounded-full inline-flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#98473E] cursor-pointer text-xs font-semibold ${
          isRelaxOn
            ? "bg-[#7F9274]/20 text-[#7F9274] border border-[#7F9274]/40 shadow-xs"
            : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent"
        }`}
      >
        <Leaf
          className={`h-4 w-4 transition-transform duration-300 ${
            isRelaxOn ? "text-[#7F9274] scale-110 rotate-12" : "text-[var(--text-muted)]"
          }`}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Relax</span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label="Relax and Personalise Options"
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] p-3 shadow-[0_12px_28px_-4px_rgba(0,0,0,0.2)] z-50 animate-fade-in space-y-2.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-soft)]">
            <div className="flex items-center gap-1.5">
              <Leaf className="h-4 w-4 text-[#7F9274]" />
              <span className="text-xs font-bold font-['Quicksand',sans-serif]">
                Relax & Personalise
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isRelaxOn
                  ? "bg-[#7F9274]/20 text-[#7F9274]"
                  : "bg-[var(--surface-hover)] text-[var(--text-muted)]"
              }`}
            >
              {isRelaxOn ? "ACTIVE" : "OFF"}
            </span>
          </div>

          {/* 1. Relax Mode Toggle */}
          <div
            onClick={toggleRelax}
            className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)]/80 transition-colors cursor-pointer select-none"
          >
            <div>
              <div className="text-xs font-bold text-[var(--text)]">Relax Mode</div>
              <div className="text-[10px] text-[var(--text-muted)] leading-tight">
                Calm mascot, gentler celebrations, slower pace
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isRelaxOn}
              aria-label="Toggle Relax Mode"
              className="p-1 text-[var(--text)]"
            >
              {isRelaxOn ? (
                <ToggleRight className="h-6 w-6 text-[#7F9274]" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-[var(--text-muted)]" />
              )}
            </button>
          </div>

          {/* 2. Open My Space Hub Button */}
          <button
            type="button"
            onClick={handleOpenHub}
            className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#98473E]" />
              <span>Open My Space</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          </button>

          {/* Quick Shortcuts */}
          <div className="pt-1 space-y-1 border-t border-[var(--border-soft)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block px-1">
              Shortcuts
            </span>

            {/* Breathe for 1 minute shortcut */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("thinklet:open-breathe"));
              }}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-left"
            >
              <Wind className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Breathe for 1 minute</span>
            </button>

            {/* Commute mode shortcut */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("thinklet:open-commute"));
              }}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-left"
            >
              <Headphones className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Commute mode (Audio)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
