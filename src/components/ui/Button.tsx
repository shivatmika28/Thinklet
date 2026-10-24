"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "accent" | "outline" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "default",
      size = "default",
      loading = false,
      icon,
      disabled,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Map "primary" -> "default", "md" -> "default"
    const resolvedVariant = variant === "primary" ? "default" : variant;
    const resolvedSize = size === "md" ? "default" : size;

    const variantClasses = {
      default:
        "bg-[#98473E] text-white hover:bg-[#823C34] shadow-[0_6px_16px_-2px_rgba(152,71,62,0.3),inset_0_2px_2px_0_rgba(255,255,255,0.35),inset_0_-2px_3px_0_rgba(60,20,15,0.25)] border border-[#98473E]/40",
      accent:
        "bg-[#A37C40] text-white hover:bg-[#8C6934] shadow-[0_6px_18px_-2px_rgba(163,124,64,0.35),inset_0_2px_2px_0_rgba(255,255,255,0.45),inset_0_-2px_3px_0_rgba(70,50,20,0.25)] border border-[#A37C40]/40",
      secondary:
        "bg-[var(--surface-raised)] text-[var(--text)] hover:bg-[var(--surface-hover)] shadow-[0_4px_12px_-2px_rgba(48,37,31,0.08),inset_0_1.5px_2px_0_rgba(255,255,255,0.8),inset_0_-1.5px_2px_0_rgba(48,37,31,0.04)] border border-[var(--border-soft)]",
      outline:
        "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)] shadow-[0_2px_6px_0_rgba(48,37,31,0.04)] hover:border-[var(--accent)]",
      ghost:
        "text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent",
      destructive:
        "bg-[#98473E] text-white hover:bg-[#823C34] shadow-[0_6px_16px_-2px_rgba(152,71,62,0.35),inset_0_2px_2px_0_rgba(255,255,255,0.35)] border border-[#98473E]/40",
      link:
        "text-[#98473E] underline-offset-4 hover:underline border border-transparent p-0 h-auto",
    }[resolvedVariant] || "bg-[#98473E] text-white";

    const sizeClasses = {
      default: "h-9.5 px-5 py-2 text-sm",
      sm: "h-8 px-3.5 text-xs",
      lg: "h-11 px-7 text-base font-semibold",
      icon: "h-9 w-9 p-0",
    }[resolvedSize] || "h-9.5 px-5 py-2 text-sm";

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold thinklet-btn-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer ${variantClasses} ${sizeClasses} ${className}`}
        style={style}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
