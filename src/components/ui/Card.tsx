"use client";

import React, { forwardRef } from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "panel" | "raised" | "secondary" | "dark" | "navy" | "accent";
  staggerIndex?: number;
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      staggerIndex,
      interactive = false,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    // Claymorphism variant mappings
    const variantStyles = {
      default:
        "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-[var(--shadow)]",
      panel:
        "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-[var(--shadow)]",
      raised:
        "bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border-soft)] shadow-[var(--shadow)]",
      secondary:
        "bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border-soft)] shadow-[var(--shadow)]",
      dark:
        "bg-[var(--focus-card-bg)] text-[#F7EFE5] border border-[var(--focus-card-border)] shadow-[0_16px_36px_-6px_rgba(23,19,17,0.35),inset_0_1.5px_2px_0_rgba(255,255,255,0.1),inset_0_-2px_4px_0_rgba(0,0,0,0.35)]",
      navy:
        "bg-[var(--focus-card-bg)] text-[#F7EFE5] border border-[var(--focus-card-border)] shadow-[0_16px_36px_-6px_rgba(23,19,17,0.35),inset_0_1.5px_2px_0_rgba(255,255,255,0.1),inset_0_-2px_4px_0_rgba(0,0,0,0.35)]",
      accent:
        "bg-gradient-to-br from-[#98473E] to-[#A37C40] text-white border border-white/20 shadow-[0_12px_28px_-4px_rgba(152,71,62,0.3),inset_0_1.5px_2px_0_rgba(255,255,255,0.25)]",
    }[variant] || "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]";

    // Default hover styling based on card theme
    const isNavyOrDark = variant === "dark" || variant === "navy";
    const hoverClass = isNavyOrDark ? "thinklet-card-navy-hover" : "thinklet-card-hover";

    const interactiveStyles = interactive
      ? `${hoverClass} cursor-pointer`
      : hoverClass;

    return (
      <div
        ref={ref}
        className={`rounded-2xl ${variantStyles} ${interactiveStyles} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-5 sm:p-6 ${className}`} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3 ref={ref} className={`font-bold text-base sm:text-lg leading-snug tracking-tight text-inherit ${className}`} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", ...props }, ref) => (
    <p ref={ref} className={`text-xs sm:text-sm text-inherit opacity-80 leading-relaxed ${className}`} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`p-5 sm:p-6 pt-0 ${className}`} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex items-center p-5 sm:p-6 pt-0 ${className}`} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
