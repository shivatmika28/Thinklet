"use client";

import React, { forwardRef } from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className = "", indicatorClassName = "", ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={`relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-raised)] border border-[var(--border-soft)] shadow-[inset_0_1.5px_2px_rgba(48,37,31,0.06)] ${className}`}
        {...props}
      >
        <div
          className={`h-full w-full flex-1 rounded-full bg-gradient-to-r from-[#98473E] to-[#A37C40] shadow-[0_1px_4px_rgba(152,71,62,0.35)] transition-all duration-300 ease-out ${indicatorClassName}`}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";
