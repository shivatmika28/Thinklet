"use client";

import React, { forwardRef } from "react";

export interface FrostedPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "standard" | "solid" | "light";
  border?: boolean;
}

export const FrostedPanel = forwardRef<HTMLDivElement, FrostedPanelProps>(
  (
    {
      children,
      intensity = "standard",
      border = true,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    const bgStyle = {
      solid: "var(--panel)",
      light: "rgba(239, 252, 251, 0.88)",
      standard: "rgba(10, 17, 40, 0.55)",
    }[intensity] || "rgba(10, 17, 40, 0.55)";

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: bgStyle,
          backdropFilter: intensity === "solid" ? "none" : "blur(12px)",
          WebkitBackdropFilter: intensity === "solid" ? "none" : "blur(12px)",
          border: border ? "1px solid var(--border)" : "none",
          borderRadius: "var(--radius-card)",
          transition: "opacity var(--duration-normal) var(--ease-standard)",
          ...style,
        }}
        className={`frosted-blur ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FrostedPanel.displayName = "FrostedPanel";
