"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface RevealBlurProps {
  children: React.ReactNode;
  label?: string;
  revealedLabel?: string;
  initiallyRevealed?: boolean;
  onReveal?: () => void;
  className?: string;
}

export function RevealBlur({
  children,
  label = "Tap to reveal answer",
  revealedLabel = "Answer revealed",
  initiallyRevealed = false,
  onReveal,
  className = "",
}: RevealBlurProps) {
  const [isRevealed, setIsRevealed] = useState(initiallyRevealed);

  const handleToggle = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      onReveal?.();
    } else {
      setIsRevealed(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isRevealed}
      aria-label={isRevealed ? revealedLabel : label}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      style={{
        position: "relative",
        borderRadius: "var(--radius-button)",
        cursor: "pointer",
        overflow: "hidden",
        outline: "none",
        minHeight: "44px",
      }}
      className={`focus-ring select-none ${className}`}
    >
      {/* Blurred Content */}
      <div
        aria-hidden={!isRevealed}
        style={{
          filter: isRevealed ? "none" : "blur(7px)",
          transition: "filter 350ms var(--ease-standard), opacity 350ms var(--ease-standard)",
          opacity: isRevealed ? 1 : 0.6,
          userSelect: isRevealed ? "text" : "none",
        }}
      >
        {children}
      </div>

      {/* Tap to Reveal Banner (Visible when hidden) */}
      {!isRevealed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            backgroundColor: "rgba(15, 18, 26, 0.7)",
            color: "var(--text-primary)",
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 16px",
            textAlign: "center",
          }}
        >
          <Eye
            style={{ width: "16px", height: "16px", color: "var(--accent)" }}
            aria-hidden="true"
          />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}
