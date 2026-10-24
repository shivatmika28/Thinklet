"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  label?: string;
}

export function Skeleton({
  width = "100%",
  height = "20px",
  radius = "var(--radius-button)",
  label = "Loading content...",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: "var(--raised)",
        ...style,
      }}
      className={`animate-skeleton-pulse select-none ${className}`}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}
