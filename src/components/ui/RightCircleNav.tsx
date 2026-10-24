"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STUDY_SECTIONS, StudySection } from "@/components/navigation/studySections";

export function RightCircleNav() {
  const pathname = usePathname();
  // Single shared state for open section ID (only one popup can be open at a time)
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  // Optional fading section ID for smooth 120ms fade-out when closing to empty space
  const [fadingSectionId, setFadingSectionId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  const navRef = useRef<HTMLElement>(null);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const popupLinkRefs = useRef<Record<string, Array<HTMLAnchorElement | null>>>({});

  // Cancel all pending timers
  const clearAllTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  // Clear timers on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Detect touch device & narrow screen
  useEffect(() => {
    const checkEnvironment = () => {
      if (typeof window === "undefined") return;
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      setIsTouchDevice(isTouch);
      // Free space to the left of the 14px margin + 53px circle
      const freeSpaceLeft = window.innerWidth - 14 - 53;
      setIsNarrowScreen(freeSpaceLeft < 260);
    };

    checkEnvironment();
    window.addEventListener("resize", checkEnvironment);
    return () => window.removeEventListener("resize", checkEnvironment);
  }, []);

  // Detect if any modal or full-screen dialog is open
  useEffect(() => {
    if (typeof document === "undefined") return;

    const checkModal = () => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      const isBodyLocked = document.body.style.overflow === "hidden";
      setIsModalOpen(Boolean(dialog || isBodyLocked));
    };

    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  // Close fan on route change or browser back
  useEffect(() => {
    clearAllTimers();
    setOpenSectionId(null);
    setFadingSectionId(null);
    setIsPinned(false);
  }, [pathname, clearAllTimers]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        clearAllTimers();
        setOpenSectionId(null);
        setFadingSectionId(null);
        setIsPinned(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [clearAllTimers]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openSectionId) {
        e.preventDefault();
        const currentSection = openSectionId;
        clearAllTimers();
        setOpenSectionId(null);
        setFadingSectionId(null);
        setIsPinned(false);
        sectionButtonRefs.current[currentSection]?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSectionId, clearAllTimers]);

  // Check if a section is active based on current route
  const isSectionActive = useCallback(
    (section: StudySection): boolean => {
      return section.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + "/")
      );
    },
    [pathname]
  );

  // Check if a specific page is active
  const isPageActive = useCallback(
    (href: string): boolean => {
      return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
    },
    [pathname]
  );

  // Switch to section immediately or open after hover delay
  const openSection = useCallback(
    (sectionId: string, immediate: boolean = false) => {
      clearAllTimers();
      setFadingSectionId(null);
      if (immediate || openSectionId !== null) {
        // Immediate switch: cancel pending closing and replace active fan instantly
        setOpenSectionId(sectionId);
      } else {
        // Open from closed state after 90ms hover
        openTimerRef.current = setTimeout(() => {
          setOpenSectionId(sectionId);
        }, 90);
      }
    },
    [clearAllTimers, openSectionId]
  );

  // Start closing sequence with 120ms fade out, then hide completely
  const closeSectionWithFade = useCallback(() => {
    clearAllTimers();
    const prev = openSectionId;
    setOpenSectionId(null);
    setIsPinned(false);
    if (prev) {
      setFadingSectionId(prev);
      fadeTimerRef.current = setTimeout(() => {
        setFadingSectionId(null);
      }, 120);
    }
  }, [clearAllTimers, openSectionId]);

  // Mouse hover handlers
  const handleMouseEnterSection = (sectionId: string) => {
    if (isTouchDevice) return;
    if (openSectionId && openSectionId !== sectionId) {
      // Immediately switch to the new section without waiting
      openSection(sectionId, true);
    } else if (!openSectionId) {
      openSection(sectionId, false);
    } else {
      // Re-entering current open section: preserve open state
      clearAllTimers();
      setFadingSectionId(null);
    }
  };

  const handleMouseLeaveSection = (sectionId: string) => {
    if (isTouchDevice) return;
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (!isPinned && openSectionId === sectionId) {
      closeTimerRef.current = setTimeout(() => {
        closeSectionWithFade();
      }, 240);
    }
  };

  // Section circle click / tap handler
  const handleSectionClick = (sectionId: string) => {
    if (openSectionId === sectionId) {
      // Toggle closed
      clearAllTimers();
      setOpenSectionId(null);
      setFadingSectionId(null);
      setIsPinned(false);
    } else {
      // Switch immediately and pin open
      clearAllTimers();
      setFadingSectionId(null);
      setOpenSectionId(sectionId);
      setIsPinned(true);
    }
  };

  // Keyboard navigation within the fan
  const handleSectionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    section: StudySection
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSectionClick(section.id);
      setTimeout(() => {
        const firstLink = popupLinkRefs.current[section.id]?.[0];
        if (firstLink) firstLink.focus();
      }, 50);
    } else if (e.key === "ArrowLeft" && openSectionId === section.id) {
      e.preventDefault();
      popupLinkRefs.current[section.id]?.[0]?.focus();
    }
  };

  const handlePopupKeyDown = (
    e: React.KeyboardEvent<HTMLAnchorElement>,
    sectionId: string,
    index: number,
    totalCount: number
  ) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = (index + 1) % totalCount;
      popupLinkRefs.current[sectionId]?.[nextIdx]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIdx = (index - 1 + totalCount) % totalCount;
      popupLinkRefs.current[sectionId]?.[prevIdx]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearAllTimers();
      setOpenSectionId(null);
      setFadingSectionId(null);
      setIsPinned(false);
      sectionButtonRefs.current[sectionId]?.focus();
    }
  };

  // Calculate arc position (dx, dy) with collision-free angles and directional fanning
  const getCoordinates = (
    sectionId: string,
    index: number,
    totalCount: number
  ): { dx: number; dy: number } => {
    if (isNarrowScreen) {
      // Vertical column fallback directly to the left with at least 8px gap (52px step - 44px circle = 8px gap)
      const rowHeight = 52;
      const dy = (index - (totalCount - 1) / 2) * rowHeight;
      const dx = -54;
      return { dx, dy };
    }

    // Directional arc angles:
    // - Practice (top): fans upward/leftward to avoid Notes Assistant below it (-52°, -16°, +20°)
    // - Notes Assistant (middle): balanced leftward arc with compact vertical reach (-36°, 0°, +36°)
    // - Planner (bottom): fans downward/leftward to avoid Notes Assistant above it (-12°, +30°)
    let angleDeg = 0;
    if (sectionId === "practice") {
      const angles = [-52, -16, 20];
      angleDeg = angles[index] ?? 0;
    } else if (sectionId === "planner") {
      const angles = [-12, 30];
      angleDeg = angles[index] ?? 0;
    } else {
      const angles = [-36, 0, 36];
      angleDeg = angles[index] ?? 0;
    }

    const radius = 86;
    const rad = (angleDeg * Math.PI) / 180;
    const dx = -radius * Math.cos(rad);
    let dy = radius * Math.sin(rad);

    // Viewport bounds protection: shift arc vertically to keep all elements within viewport
    const btn = sectionButtonRefs.current[sectionId];
    if (btn && typeof window !== "undefined") {
      const rect = btn.getBoundingClientRect();
      const circleCenterY = rect.top + rect.height / 2;
      const popupTargetY = circleCenterY + dy;
      if (popupTargetY - 26 < 14) {
        dy += 14 - (popupTargetY - 26);
      } else if (popupTargetY + 26 > window.innerHeight - 14) {
        dy -= popupTargetY + 26 - (window.innerHeight - 14);
      }
    }

    return { dx: Math.round(dx * 10) / 10, dy: Math.round(dy * 10) / 10 };
  };

  // Hide on login or onboarding screens
  if (pathname === "/tutorial" || pathname === "/login") {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        /* Right Navigation CSS Tokens & Responsive Sizes */
        .right-nav-container {
          --page-circle: 44px;
          --section-circle: calc(var(--page-circle) * 1.2);
        }

        @media (pointer: coarse) and (min-width: 641px) {
          .right-nav-container {
            --page-circle: 48px;
            --section-circle: calc(var(--page-circle) * 1.2);
          }
        }

        @media (max-width: 640px) {
          .right-nav-container {
            --page-circle: 44px;
            --section-circle: calc(var(--page-circle) * 1.2);
          }
          .right-nav-section-btn:not([data-active="true"]):not([data-open="true"]) {
            opacity: 0.85;
          }
          .right-nav-section-btn:active,
          .right-nav-section-btn[data-open="true"],
          .right-nav-section-btn[data-active="true"] {
            opacity: 1;
          }
        }

        /* Respect prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .right-nav-container *,
          .right-nav-popup-circle {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <nav
        ref={navRef}
        aria-label="Study tools"
        className="right-nav-container fixed right-[14px] z-40 flex flex-col items-center pointer-events-none select-none transition-opacity duration-150 font-['Quicksand',sans-serif]"
        style={{
          // Centered vertically, with clamp to guarantee >= 80px clearance from the Quick Actions button
          top: "clamp(60px, calc(50% - 20px), calc(100vh - 305px))",
          transform: "translateY(-50%)",
          opacity: isModalOpen ? 0 : 1,
          visibility: isModalOpen ? "hidden" : "visible",
        }}
      >
        {STUDY_SECTIONS.map((section, sIdx) => {
          const isThisOpen = openSectionId === section.id;
          const isThisFading = fadingSectionId === section.id;
          const isThisVisible = isThisOpen || isThisFading;
          const isActive = isSectionActive(section);
          const SectionIcon = section.icon;
          const isLastSection = sIdx === STUDY_SECTIONS.length - 1;

          return (
            <div
              key={section.id}
              className="relative flex flex-col items-center pointer-events-auto"
              style={{
                // Vertical gap between one section's label and the next section's circle
                marginBottom: isLastSection ? 0 : "clamp(28px, 5vh, 40px)",
                // Open section has higher z-index than siblings
                zIndex: isThisVisible ? 50 : 10,
              }}
              onMouseEnter={() => handleMouseEnterSection(section.id)}
              onMouseLeave={() => handleMouseLeaveSection(section.id)}
            >
              {/* Anchor container for circle button, hover bridge, and fanned popup container */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: "var(--section-circle)",
                  height: "var(--section-circle)",
                }}
              >
                {/* Invisible Hover Bridge Area (bounded path strictly between section circle and its popup arc, never overlapping neighbors) */}
                <div
                  aria-hidden="true"
                  className="absolute pointer-events-auto"
                  style={{
                    width: "86px",
                    height: "56px",
                    right: "26px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "transparent",
                    zIndex: 1,
                    display: isThisOpen ? "block" : "none",
                    pointerEvents: isThisOpen ? "auto" : "none",
                  }}
                />

                {/* SECTION CIRCLE BUTTON */}
                <button
                  ref={(el) => {
                    sectionButtonRefs.current[section.id] = el;
                  }}
                  type="button"
                  data-active={isActive ? "true" : "false"}
                  data-open={isThisOpen ? "true" : "false"}
                  aria-haspopup="true"
                  aria-expanded={isThisOpen}
                  aria-label={section.name}
                  onClick={() => handleSectionClick(section.id)}
                  onKeyDown={(e) => handleSectionKeyDown(e, section)}
                  className="right-nav-section-btn group relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-active-bg)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] w-full h-full"
                  style={{
                    backgroundColor: isActive
                      ? "var(--sidebar-active-bg)"
                      : "var(--sidebar-bg)",
                    color: isActive
                      ? "var(--accent-contrast)"
                      : "var(--sidebar-text)",
                    border: isActive
                      ? "0.5px solid var(--sidebar-active-bg)"
                      : isThisOpen
                      ? "1px solid var(--sidebar-active-bg)"
                      : "0.5px solid var(--border)",
                    boxShadow: "var(--shadow)",
                    transform: isThisOpen ? "scale(1.07)" : undefined,
                    touchAction: "manipulation",
                  }}
                >
                  <SectionIcon
                    className="w-6 h-6 shrink-0 transition-transform duration-200"
                    aria-hidden="true"
                  />
                </button>

                {/* FANNED POPUP CIRCLES CONTAINER (strictly one visible at a time) */}
                <div
                  role="menu"
                  aria-label={`${section.name} pages`}
                  className="absolute inset-0"
                  style={{
                    zIndex: 50,
                    visibility: isThisVisible ? "visible" : "hidden",
                    pointerEvents: isThisOpen ? "auto" : "none",
                  }}
                >
                  {/* Section title pill above open fan */}
                  {isThisVisible && (
                    <div
                      aria-hidden="true"
                      className="absolute whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-opacity duration-150"
                      style={{
                        right: "60px",
                        top: "-28px",
                        backgroundColor: "var(--sidebar-bg)",
                        color: "var(--sidebar-text)",
                        border: "0.5px solid var(--border)",
                        boxShadow: "var(--shadow)",
                        opacity: isThisOpen ? 1 : 0,
                      }}
                    >
                      {section.name}
                    </div>
                  )}

                  {section.children.map((child, cIdx) => {
                    const isCurrent = isPageActive(child.href);
                    const ChildIcon = child.icon;
                    const { dx, dy } = getCoordinates(
                      section.id,
                      cIdx,
                      section.children.length
                    );

                    return (
                      <div
                        key={child.href}
                        className="absolute top-1/2 left-1/2 right-nav-popup-wrapper"
                        style={{
                          transform: isThisOpen
                            ? `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`
                            : "translate(-50%, -50%) scale(0.4)",
                          opacity: isThisOpen ? 1 : 0,
                          pointerEvents: isThisOpen ? "auto" : "none",
                          transition: isThisOpen
                            ? `transform 260ms cubic-bezier(0.22, 1, 0.36, 1) ${cIdx * 40}ms, opacity 260ms cubic-bezier(0.22, 1, 0.36, 1) ${cIdx * 40}ms`
                            : "transform 120ms cubic-bezier(0.22, 1, 0.36, 1), opacity 120ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        {/* LABEL PILL TO THE LEFT OF POPUP CIRCLE */}
                        <Link
                          href={child.href}
                          tabIndex={-1}
                          aria-hidden="true"
                          onClick={() => {
                            clearAllTimers();
                            setOpenSectionId(null);
                            setFadingSectionId(null);
                            setIsPinned(false);
                          }}
                          className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 rounded-full font-bold whitespace-nowrap transition-all duration-150 hover:scale-105 active:scale-95 no-underline flex items-center"
                          style={{
                            fontSize: "11.5px",
                            padding: "4px 10px",
                            backgroundColor: isCurrent
                              ? "var(--sidebar-active-bg)"
                              : "var(--surface)",
                            color: isCurrent
                              ? "var(--accent-contrast)"
                              : "var(--foreground)",
                            border: isCurrent
                              ? "0.5px solid var(--sidebar-active-bg)"
                              : "0.5px solid var(--border)",
                            boxShadow: "var(--shadow)",
                          }}
                        >
                          {child.name}
                        </Link>

                        {/* POPUP CIRCLE LINK */}
                        <Link
                          ref={(el) => {
                            if (!popupLinkRefs.current[section.id]) {
                              popupLinkRefs.current[section.id] = [];
                            }
                            popupLinkRefs.current[section.id][cIdx] = el;
                          }}
                          href={child.href}
                          role="menuitem"
                          tabIndex={isThisOpen ? 0 : -1}
                          aria-label={child.name}
                          aria-current={isCurrent ? "page" : undefined}
                          onClick={() => {
                            clearAllTimers();
                            setOpenSectionId(null);
                            setFadingSectionId(null);
                            setIsPinned(false);
                          }}
                          onKeyDown={(e) =>
                            handlePopupKeyDown(
                              e,
                              section.id,
                              cIdx,
                              section.children.length
                            )
                          }
                          className="right-nav-popup-circle flex items-center justify-center rounded-full transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-active-bg)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] hover:scale-105"
                          style={{
                            width: "var(--page-circle)",
                            height: "var(--page-circle)",
                            backgroundColor: isCurrent
                              ? "var(--sidebar-active-bg)"
                              : "var(--surface-raised)",
                            color: isCurrent
                              ? "var(--accent-contrast)"
                              : "var(--foreground)",
                            border: isCurrent
                              ? "0.5px solid var(--sidebar-active-bg)"
                              : "0.5px solid var(--border)",
                            boxShadow: "var(--shadow)",
                            touchAction: "manipulation",
                          }}
                        >
                          <ChildIcon
                            className="w-5 h-5 shrink-0"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LABEL UNDER SECTION CIRCLE */}
              <span
                aria-hidden="true"
                className="hidden sm:block text-center select-none font-bold transition-colors duration-150"
                style={{
                  fontSize: "10.5px",
                  lineHeight: "1.2",
                  marginTop: "5px",
                  maxWidth: "72px",
                  color: isActive ? "var(--sidebar-active-bg)" : "var(--foreground)",
                }}
              >
                {section.name}
              </span>
            </div>
          );
        })}
      </nav>
    </>
  );
}
