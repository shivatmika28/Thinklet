"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  FileQuestion,
  CheckSquare,
  FileText,
  Calendar,
  TrendingUp,
  SlidersHorizontal,
  X,
  GraduationCap,
  Layers,
  Sparkles,
  Workflow,
  Timer,
  Target,
  FolderOpen,
  UserCheck,
  Award,
} from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function Drawer({ isOpen, onClose, onOpenSettings }: DrawerProps) {
  const pathname = usePathname();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  const navSections = [
    {
      id: "core",
      title: "Core Study",
      items: [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Study Room", href: "/learn", icon: BookOpen },
      ]
    },
    {
      id: "mastery",
      title: "Mastery & Focus",
      items: [
        { name: "Focus Timer", href: "/tracker", icon: Timer },
        { name: "Analytics", href: "/progress", icon: TrendingUp },
        { name: "Exam Readiness", href: "/mastery", icon: Target },
      ]
    },
    {
      id: "accountability",
      title: "Resources & Sharing",
      items: [
        { name: "Materials Library", href: "/materials", icon: FolderOpen },
        { name: "Teacher View", href: "/teacher", icon: UserCheck },
        { name: "Share Badge", href: "/share", icon: Award },
      ]
    }
  ];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (diff < 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset < -70) {
      onClose();
    }
    setTouchStartX(null);
    setDragOffset(0);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-51 flex flex-col w-72 max-w-[85vw] h-full bg-background border-r border-border p-6 shadow-xl transition-transform duration-200"
        style={{
          transform: `translateX(${dragOffset}px)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0">
              <GraduationCap className="h-6 w-6 text-[#98473E]" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-[var(--text)] font-['Quicksand',sans-serif] block leading-tight">
                Thinklet
              </span>
              <span className="text-[11px] text-[#B49082] font-semibold block">
                Smart Learning Companion
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {navSections.map((section) => (
            <div key={section.id} className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--taupe)] uppercase tracking-wider px-3">
                {section.title}
              </span>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-[var(--sidebar-active-bg)] text-[var(--accent-contrast)] shadow-[var(--shadow)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] hover:translate-x-1"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-border mt-auto">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span>Preferences & Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
