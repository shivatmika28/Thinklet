"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HelpCircle, FileText } from "lucide-react";
import { useMaterial } from "@/context/MaterialContext";

export interface TopNavBarProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  showHelp?: boolean;
  helpText?: string;
  className?: string;
}

export function TopNavBar({
  title,
  subtitle,
  backHref,
  onBack,
  rightElement,
  showHelp = false,
  helpText,
  className = "",
}: TopNavBarProps) {
  const router = useRouter();
  const { materials, activeMaterialId, setActiveMaterialId, activeMaterial } = useMaterial();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md px-4 sm:px-6 h-14 ${className}`}
    >
      {/* Left: Pill Back Button & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={`Go back to ${backHref === "/" ? "Dashboard" : "previous page"}`}
            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm font-medium transition-all hover:bg-[var(--surface-hover)] hover:border-[var(--accent)] hover:scale-105 active:scale-95 shadow-[0_2px_6px_0_rgba(48,37,31,0.06)] shrink-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm font-medium transition-all hover:bg-[var(--surface-hover)] hover:border-[var(--accent)] hover:scale-105 active:scale-95 shadow-[0_2px_6px_0_rgba(48,37,31,0.06)] shrink-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-[var(--text)] truncate m-0 font-['Quicksand',sans-serif]">
              {title}
            </h1>
            {showHelp && helpText && (
              <span title={helpText} className="cursor-help text-[#98473E] hover:text-[#823C34] transition-colors">
                <HelpCircle className="h-4 w-4" />
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] truncate m-0 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Material Indicator / Switcher & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {materials.length > 1 ? (
          <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full px-2.5 py-1 text-xs text-[var(--text)]">
            <FileText className="w-3.5 h-3.5 text-[#98473E] shrink-0" />
            <select
              value={activeMaterialId || ""}
              onChange={(e) => setActiveMaterialId(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-[var(--text)] outline-none cursor-pointer max-w-[110px] sm:max-w-[170px] truncate"
              title="Switch study material"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id} className="bg-[var(--surface)] text-[var(--text)]">
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        ) : activeMaterial ? (
          <div
            className="hidden sm:flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full px-2.5 py-1 text-xs text-[var(--text-muted)] max-w-[170px] truncate"
            title={activeMaterial.title}
          >
            <FileText className="w-3.5 h-3.5 text-[#98473E] shrink-0" />
            <span className="font-semibold text-[var(--text)] truncate">{activeMaterial.title}</span>
          </div>
        ) : (
          <Link
            href="/materials"
            className="text-xs text-[#98473E] hover:underline font-semibold flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Material</span>
          </Link>
        )}
        {rightElement}
      </div>
    </header>
  );
}
