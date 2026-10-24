"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useFeatures } from "@/features/components/FeaturesProvider";
import { WhyPopover } from "@/features/personal"; // [PERSONAL]

export interface StudyBuddyMascotProps {
  mood?: "wave" | "happy" | "thinking" | "celebrating" | "studying" | "sleepy" | "focused";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  withSparkles?: boolean;
  interactive?: boolean;
  speechTip?: string | null;
  speechTipReason?: any; // [PERSONAL]
  onTipDismiss?: () => void;
  onMascotClick?: () => void;
  showAiTutorLink?: boolean;
}

/**
 * Pip the Thinklet Companion Mascot
 * A cute, claymorphic student study buddy designed with the warm earthy Thinklet palette:
 * - #30251F (Warm Charcoal)
 * - #F7EFE5 (Warm Cream)
 * - #98473E (Terracotta Accent)
 * - #A37C40 (Muted Copper)
 */
export function StudyBuddyMascot({
  mood = "wave",
  size = "md",
  className = "",
  withSparkles = false,
  interactive = false,
  speechTip = null,
  speechTipReason, // [PERSONAL]
  onTipDismiss,
  onMascotClick,
  showAiTutorLink = true,
}: StudyBuddyMascotProps) {
  const sizeMap = {
    xs: 28,
    sm: 36,
    md: 52,
    lg: 80,
    xl: 120,
  };

  const dim = sizeMap[size] || 52;
  const mascotRef = useRef<HTMLDivElement>(null);

  // Settings from FeaturesProvider
  let settings = { enableMascotAnimations: true, enableMascotTips: true };
  try {
    const features = useFeatures();
    if (features?.settings) {
      settings = {
        enableMascotAnimations: features.settings.enableMascotAnimations !== false,
        enableMascotTips: features.settings.enableMascotTips !== false,
      };
    }
  } catch {
    // Fallback if rendered outside provider
  }

  // Interactive States
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [tiltDeg, setTiltDeg] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  // Eye look-at pointer tracking
  useEffect(() => {
    if (!interactive || !settings.enableMascotAnimations) {
      setEyeOffset({ x: 0, y: 0 });
      setTiltDeg(0);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mascotRef.current || document.hidden) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Max eye offset 2.5px
      const maxOffset = 2.5;
      const factor = Math.min(dist / 240, 1);
      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * maxOffset * factor;
      const y = Math.sin(angle) * maxOffset * factor;

      setEyeOffset({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });

      // Tilt degree max 4.5deg toward cursor
      const tilt = Math.max(-4.5, Math.min(4.5, (dx / 320) * 4.5));
      setTiltDeg(Math.round(tilt * 10) / 10);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive, settings.enableMascotAnimations]);

  // Periodic Idle Blinking
  useEffect(() => {
    if (!interactive || !settings.enableMascotAnimations || mood === "sleepy") return;

    let blinkTimeout: NodeJS.Timeout;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => {
        setIsBlinking(false);
      }, 160);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(blinkTimeout);
    };
  }, [interactive, settings.enableMascotAnimations, mood]);

  const handleAction = () => {
    if (!interactive) return;
    if (settings.enableMascotAnimations) {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 650);
    }
    if (onMascotClick) {
      onMascotClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleAction();
    }
  };

  const isAnimated = interactive && settings.enableMascotAnimations;
  const animationClass = isAnimated
    ? isBouncing
      ? "animate-pip-bounce"
      : "animate-pip-breathing"
    : "";

  return (
    <div
      ref={mascotRef}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#98473E] rounded-2xl" : ""
      } ${className}`}
      style={{
        width: dim,
        height: dim,
        transform: isAnimated && !isBouncing ? `rotate(${tiltDeg}deg)` : undefined,
        transition: isAnimated ? "transform 150ms ease-out" : undefined,
      }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Pip, Thinklet study companion. Click for a study tip." : `Thinklet mascot ${mood}`}
      aria-haspopup={interactive ? true : undefined}
      aria-expanded={interactive ? Boolean(speechTip) : undefined}
      onClick={handleAction}
      onKeyDown={handleKeyDown}
    >
      <div className={`w-full h-full ${animationClass}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Claymorphic Body Gradients: Warm Charcoal to Deep Espresso */}
            <linearGradient id="bodyClay" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3E3129" />
              <stop offset="0.6" stopColor="#30251F" />
              <stop offset="1" stopColor="#171311" />
            </linearGradient>

            {/* Warm Cream Belly Highlight */}
            <linearGradient id="bellyClay" x1="50" y1="45" x2="50" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF9F2" />
              <stop offset="0.7" stopColor="#F7EFE5" />
              <stop offset="1" stopColor="#E1CFC0" />
            </linearGradient>

            {/* Terracotta & Dusty Taupe Ear / Wing Accents */}
            <linearGradient id="accentClay" x1="30" y1="20" x2="70" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#B49082" />
              <stop offset="1" stopColor="#98473E" />
            </linearGradient>

            {/* Muted Copper Cap Tassel */}
            <linearGradient id="goldClay" x1="50" y1="10" x2="70" y2="35" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C49B59" />
              <stop offset="1" stopColor="#A37C40" />
            </linearGradient>

            {/* Soft Clay Highlight Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#30251F" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Mascot Body Base (Soft Clay Rounded Pod) */}
          <rect
            x="22"
            y="28"
            width="56"
            height="58"
            rx="28"
            fill="url(#bodyClay)"
            filter="url(#softGlow)"
          />

          {/* Body Top Highlight (Inner Clay Specular) */}
          <ellipse cx="50" cy="36" rx="20" ry="7" fill="white" fillOpacity="0.22" />

          {/* Cute Ears / Side Fins */}
          <path
            d="M20 50C15 45 15 58 22 62"
            stroke="url(#accentClay)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M80 50C85 45 85 58 78 62"
            stroke="url(#accentClay)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Belly Patch (Warm Cream & Clean) */}
          <ellipse cx="50" cy="62" rx="19" ry="18" fill="url(#bellyClay)" />
          <ellipse cx="50" cy="54" rx="12" ry="5" fill="white" fillOpacity="0.8" />

          {/* Expressive Eyes System */}
          {mood === "sleepy" ? (
            /* Sleepy closed curved eyes */
            <g id="eyes-sleepy">
              <path d="M35 48 Q40 44 45 48" stroke="#30251F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M55 48 Q60 44 65 48" stroke="#30251F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <text x="73" y="24" fill="#A37C40" fontSize="9" fontWeight="bold" className="animate-zzz-float select-none">z</text>
              <text x="80" y="16" fill="#98473E" fontSize="12" fontWeight="bold" className="animate-zzz-float select-none" style={{ animationDelay: "0.8s" }}>Z</text>
            </g>
          ) : isBlinking || mood === "celebrating" ? (
            /* Joyous / Blinking curved eyes ^ ^ */
            <g id="eyes-blinking">
              <path d="M35 48 Q40 42 45 48" stroke="#30251F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M55 48 Q60 42 65 48" stroke="#30251F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>
          ) : mood === "focused" ? (
            /* Focused determined eyes */
            <g id="eyes-focused">
              <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
                <ellipse cx="40" cy="46" rx="5" ry="5" fill="#30251F" />
                <circle cx="39" cy="45" r="1.8" fill="white" />
                <ellipse cx="60" cy="46" rx="5" ry="5" fill="#30251F" />
                <circle cx="59" cy="45" r="1.8" fill="white" />
              </g>
              {/* Confident gentle focus brows */}
              <path d="M34 39 L46 41" stroke="#30251F" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M66 39 L54 41" stroke="#30251F" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ) : (
            /* Default sparkly expressive eyes with look-at tracking */
            <g id="eyes" transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
              {/* Left Eye */}
              <ellipse cx="40" cy="46" rx="5.5" ry="6.5" fill="#30251F" />
              {/* Left Eye Sparkle */}
              <circle cx="38" cy="44" r="2.2" fill="white" />
              <circle cx="42" cy="48" r="1" fill="white" />

              {/* Right Eye */}
              <ellipse cx="60" cy="46" rx="5.5" ry="6.5" fill="#30251F" />
              {/* Right Eye Sparkle */}
              <circle cx="58" cy="44" r="2.2" fill="white" />
              <circle cx="62" cy="48" r="1" fill="white" />
            </g>
          )}

          {/* Rosy Cheeks */}
          <ellipse cx="32" cy="53" rx="4" ry="2.2" fill="#D6C3C9" fillOpacity="0.75" />
          <ellipse cx="68" cy="53" rx="4" ry="2.2" fill="#D6C3C9" fillOpacity="0.75" />

          {/* Friendly Cute Smile */}
          <path
            d="M45 54C47.5 57 52.5 57 55 54"
            stroke="#30251F"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Graduation Mortarboard Cap */}
          <g id="cap" transform="rotate(-6 50 20)">
            <polygon
              points="50,11 76,21 50,30 24,21"
              fill="#241D19"
              stroke="#98473E"
              strokeWidth="1.2"
            />
            <polygon
              points="50,13 72,21 50,28 28,21"
              fill="#30251F"
            />
            <ellipse cx="50" cy="20" rx="3" ry="1.5" fill="#98473E" />
            {/* Golden Tassel */}
            <path
              d="M50 20C62 21 68 28 67 34"
              stroke="url(#goldClay)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="67" cy="35" r="2.5" fill="#C49B59" />
          </g>

          {/* Mood-Specific Accents */}
          {(mood === "wave" || isBouncing) && (
            <g id="hand-wave">
              <ellipse cx="78" cy="40" rx="4.5" ry="4.5" fill="url(#accentClay)" />
              <circle cx="78" cy="38" r="1.5" fill="white" fillOpacity="0.6" />
            </g>
          )}

          {mood === "studying" && (
            <g id="mini-book" transform="translate(38, 64)">
              <rect x="0" y="0" width="12" height="10" rx="1.5" fill="#98473E" />
              <rect x="12" y="0" width="12" height="10" rx="1.5" fill="#A37C40" />
              <line x1="2" y1="3" x2="10" y2="3" stroke="white" strokeWidth="1" strokeLinecap="round" />
              <line x1="2" y1="6" x2="9" y2="6" stroke="white" strokeWidth="1" strokeLinecap="round" />
              <line x1="14" y1="3" x2="22" y2="3" stroke="white" strokeWidth="1" strokeLinecap="round" />
              <line x1="14" y1="6" x2="21" y2="6" stroke="white" strokeWidth="1" strokeLinecap="round" />
            </g>
          )}

          {mood === "thinking" && (
            <g id="thought-bubble" transform="translate(68, 12)">
              <circle cx="4" cy="14" r="2" fill="#A37C40" fillOpacity="0.4" />
              <circle cx="10" cy="8" r="3.5" fill="#A37C40" fillOpacity="0.6" />
              <circle cx="20" cy="4" r="6" fill="#A37C40" />
              <text x="17" y="7" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">?</text>
            </g>
          )}

          {mood === "celebrating" && (
            <g id="celebration-sparkles">
              <path d="M16 26L18 20L20 26L26 28L20 30L18 36L16 30L10 28Z" fill="#C49B59" />
              <path d="M82 22L83.5 17L85 22L90 23.5L85 25L83.5 30L82 25L77 23.5Z" fill="#D6C3C9" />
            </g>
          )}
        </svg>
      </div>

      {/* Floating Sparkles for Highlighting */}
      {withSparkles && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A37C40] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#98473E]" />
        </span>
      )}

      {/* Interactive Speech Bubble with Tip */}
      {interactive && speechTip && settings.enableMascotTips && (
        <div
          role="status"
          aria-live="polite"
          className="absolute z-50 left-0 sm:left-full top-full sm:top-1/2 mt-3 sm:mt-0 sm:ml-4 sm:-translate-y-1/2 w-64 sm:w-76 p-3 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-soft)] shadow-[var(--shadow-clay-card)] text-xs text-[var(--text)] animate-speech-bubble pointer-events-auto"
        >
          {/* Triangular Tail pointing to Pip */}
          <div
            className="hidden sm:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--surface-raised)] border-l border-b border-[var(--border-soft)] rotate-45"
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#98473E]">
                <Sparkles className="h-3 w-3" />
                <span>Pip's Study Tip</span>
                {speechTipReason && <WhyPopover reason={speechTipReason} title="Why Pip suggested this tip" />} {/* [PERSONAL] */}
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--text)] font-medium">
                {speechTip}
              </p>
              {showAiTutorLink && (
                <Link
                  href="/learn"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#98473E] hover:text-[#823C34] mt-2 no-underline hover:underline cursor-pointer"
                >
                  <span>Ask AI Tutor</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {onTipDismiss && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTipDismiss();
                }}
                aria-label="Dismiss tip"
                className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
