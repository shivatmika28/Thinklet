"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";
import { StructuredReason } from "../types";

export interface WhyPopoverProps {
  reason: StructuredReason;
  className?: string;
  size?: "sm" | "md";
  label?: string;
  title?: string;
}

export const WhyPopover: React.FC<WhyPopoverProps> = ({
  reason,
  className = "",
  size = "sm",
  label,
  title,
}) => {
  const displayLabel = title || label || "Why am I seeing this?";
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
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
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={displayLabel}
        aria-expanded={isOpen}
        title={displayLabel}
        className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#98473E] cursor-pointer"
      >
        <Info className={iconSize} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={displayLabel}
          className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 w-64 sm:w-72 p-3 rounded-2xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-[0_12px_28px_-4px_rgba(0,0,0,0.2)] text-left animate-fade-in"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--border-soft)]">
            <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 font-['Quicksand',sans-serif]">
              <Info className="h-3 w-3 text-[#98473E]" aria-hidden="true" />
              <span>Why am I seeing this?</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close why popover"
              className="h-5 w-5 rounded-full inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <p className="text-[11px] font-medium text-[var(--text)] leading-relaxed mb-2">
            {reason.rule}
          </p>

          {reason.data && reason.data.length > 0 && (
            <div className="space-y-1 bg-[var(--surface-hover)]/50 p-2 rounded-xl border border-[var(--border-soft)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Observed Signals:
              </span>
              <ul className="text-[10px] text-[var(--text-muted)] space-y-0.5 list-disc list-inside">
                {reason.data.map((item, idx) => (
                  <li key={idx} className="truncate">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
