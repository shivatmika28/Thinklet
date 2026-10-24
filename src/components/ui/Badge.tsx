import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "accent" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClasses = {
    default:
      "bg-[#98473E] text-white shadow-xs border border-[#98473E]/25",
    secondary:
      "bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border-soft)] shadow-xs",
    accent:
      "bg-[#A37C40] text-white shadow-xs border border-[#A37C40]/25",
    destructive:
      "bg-[#98473E]/15 text-[#98473E] border border-[#98473E]/25",
    outline:
      "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]",
    success:
      "bg-[#7F9274]/15 text-[#7F9274] border border-[#7F9274]/30",
    warning:
      "bg-[#A37C40]/15 text-[#A37C40] border border-[#A37C40]/30",
  }[variant] || "bg-[#98473E] text-white";

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold tracking-wide transition-colors ${variantClasses} ${className}`}
      {...props}
    />
  );
}
