"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  const options: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Dark", icon: Moon },
    { mode: "system", label: "System", icon: Monitor },
  ];

  // Current icon to display on trigger
  const ActiveIcon = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Change theme appearance. Currently ${theme}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="h-8.5 w-8.5 rounded-full inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#98473E] cursor-pointer"
      >
        <ActiveIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label="Theme options"
          className="absolute right-0 mt-2 w-36 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-1.5 shadow-[0_12px_28px_-4px_rgba(0,0,0,0.18)] z-50 animate-fade-in"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.mode;

            return (
              <button
                key={opt.mode}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--surface-hover)] text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#98473E]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
