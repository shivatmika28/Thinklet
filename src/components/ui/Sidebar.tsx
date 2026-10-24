"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Layers,
  GraduationCap,
  Sparkles,
  Workflow,
  Timer,
  Target,
  FolderOpen,
  UserCheck,
  Award,
} from "lucide-react";
import { Drawer } from "./Drawer";
import { SettingsPanel } from "@/features/components/SettingsPanel";
import { StudyBuddyMascot } from "./StudyBuddyMascot";

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    openTimeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 150);
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    const handleOpenDrawer = () => setIsDrawerOpen(true);
    window.addEventListener("open-drawer", handleOpenDrawer);
    return () => window.removeEventListener("open-drawer", handleOpenDrawer);
  }, []);

  return (
    <>
      {/* Desktop Icon Rail */}
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="hidden md:block relative z-40 shrink-0"
        style={{
          width: "60px",
          height: "100dvh",
        }}
      >
        <aside
          aria-label="Primary navigation"
          className="absolute top-0 left-0 h-full bg-[var(--sidebar-bg)] border-r border-[var(--border)] text-[var(--sidebar-text)] flex flex-col justify-between overflow-hidden transition-all duration-200 py-3 shadow-[4px_0_20px_rgba(48,37,31,0.22)]"
          style={{
            width: isExpanded ? "220px" : "60px",
          }}
        >
          {/* Logo Brand Header with Cute Mascot Pip */}
          <div className="flex items-center gap-2.5 px-3 pb-3 border-b border-white/10 mb-2 min-h-[44px]">
            <div className="shrink-0 flex items-center justify-center">
              <StudyBuddyMascot mood="wave" size="sm" className="drop-shadow" />
            </div>
            <div
              className={`flex flex-col transition-opacity duration-150 ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="text-base font-extrabold tracking-tight text-[var(--sidebar-text)] font-['Quicksand',sans-serif] leading-tight">
                Thinklet
              </span>
              <span className="text-[10px] text-[var(--taupe)] font-semibold tracking-wider uppercase">
                Smart Tutor
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 flex flex-col gap-1.5 px-2.5 overflow-y-auto">
            {navSections.map((sec, sIdx) => (
              <React.Fragment key={sec.id}>
                {sIdx > 0 && <div className="h-px bg-white/10 my-2 mx-1" />}
                {/* Section subpart heading */}
                <div
                  className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--taupe)] transition-opacity duration-150 select-none ${
                    isExpanded ? "opacity-100 block" : "opacity-0 hidden"
                  }`}
                >
                  {sec.title}
                </div>
                {sec.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 h-10 px-3 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-[var(--sidebar-active-bg)] text-[var(--accent-contrast)] shadow-[var(--shadow)] border border-[var(--sidebar-active-bg)]/40"
                          : "text-[var(--sidebar-text)]/75 hover:bg-white/15 hover:text-[var(--sidebar-text)] hover:translate-x-1"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span
                        className={`whitespace-nowrap transition-opacity duration-150 font-['Quicksand',sans-serif] ${
                          isExpanded ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </React.Fragment>
            ))}
          </nav>

          {/* Bottom Settings Button */}
          <div className="px-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
              className="flex items-center gap-3 w-full h-10 px-3 rounded-full text-xs font-semibold text-[var(--sidebar-text)]/75 hover:bg-white/10 hover:text-[var(--sidebar-text)] transition-all cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span
                className={`whitespace-nowrap transition-opacity duration-150 font-['Quicksand',sans-serif] ${
                  isExpanded ? "opacity-100" : "opacity-0"
                }`}
              >
                Settings
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
