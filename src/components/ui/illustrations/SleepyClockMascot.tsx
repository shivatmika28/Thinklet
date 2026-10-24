"use client";

import React from "react";

export interface SleepyClockMascotProps {
  size?: number | "sm" | "md" | "lg";
  className?: string;
  withSparkles?: boolean;
}

export function SleepyClockMascot({
  size = "md",
  className = "",
  withSparkles = true,
}: SleepyClockMascotProps) {
  const sizeMap: Record<string, number> = {
    sm: 48,
    md: 80,
    lg: 120,
  };
  const dim = typeof size === "number" ? size : sizeMap[size] || 80;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: dim, height: dim }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Copper / Terracotta Outer Clock Rim */}
          <linearGradient id="clockRimGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A37C40" />
            <stop offset="0.6" stopColor="#B49082" />
            <stop offset="1" stopColor="#98473E" />
          </linearGradient>

          {/* Warm Cream Clock Dial */}
          <linearGradient id="clockDialGrad" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF9F2" />
            <stop offset="1" stopColor="#F7EFE5" />
          </linearGradient>

          {/* Golden Copper Sparkle */}
          <linearGradient id="clockSparkleGrad" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C49B59" />
            <stop offset="1" stopColor="#A37C40" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="88" rx="24" ry="4.5" fill="#30251F" fillOpacity="0.16" />

        {/* Twin Alarm Bells / Ears */}
        {/* Left Bell */}
        <path
          d="M26 34 C21 28 27 20 34 24 Z"
          fill="url(#clockRimGrad)"
          stroke="#30251F"
          strokeWidth="1.6"
        />
        {/* Right Bell */}
        <path
          d="M74 34 C79 28 73 20 66 24 Z"
          fill="url(#clockRimGrad)"
          stroke="#30251F"
          strokeWidth="1.6"
        />

        {/* Top Handle / Ring */}
        <path
          d="M44 23 C44 18 56 18 56 23"
          stroke="#A37C40"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cute Rounded Feet */}
        <rect x="30" y="76" width="6" height="8" rx="3" transform="rotate(20 30 76)" fill="#30251F" />
        <rect x="64" y="76" width="6" height="8" rx="3" transform="rotate(-20 64 76)" fill="#30251F" />

        {/* Clock Main Body (Outer Rim) */}
        <circle
          cx="50"
          cy="54"
          r="28"
          fill="url(#clockRimGrad)"
          stroke="#30251F"
          strokeWidth="2"
        />

        {/* Clock Inner Dial */}
        <circle
          cx="50"
          cy="54"
          r="23"
          fill="url(#clockDialGrad)"
          stroke="#D8C8B8"
          strokeWidth="1.2"
        />

        {/* Subtle Hour Dots */}
        <circle cx="50" cy="34" r="1.2" fill="#B49082" />
        <circle cx="70" cy="54" r="1.2" fill="#B49082" />
        <circle cx="50" cy="74" r="1.2" fill="#B49082" />
        <circle cx="30" cy="54" r="1.2" fill="#B49082" />

        {/* Peaceful Sleepy Closed Curved Eyes ^ ^ */}
        <path
          d="M39 52 Q43 47 47 52"
          stroke="#30251F"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M53 52 Q57 47 61 52"
          stroke="#30251F"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheerful Rosy Cheeks */}
        <ellipse cx="36" cy="56" rx="2.5" ry="1.6" fill="#D6C3C9" fillOpacity="0.85" />
        <ellipse cx="64" cy="56" rx="2.5" ry="1.6" fill="#D6C3C9" fillOpacity="0.85" />

        {/* Gentle Happy Mouth */}
        <path
          d="M48 57 Q50 60 52 57"
          stroke="#30251F"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Clock Hands Resting at Ten-Past-Ten */}
        <line x1="50" y1="54" x2="43" y2="44" stroke="#75665D" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
        <line x1="50" y1="54" x2="58" y2="48" stroke="#75665D" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.6" />
        <circle cx="50" cy="54" r="1.8" fill="#98473E" />

        {/* Cute Floating "z Z" Sleepy Letters & Sparkles */}
        {withSparkles && (
          <>
            <text x="73" y="27" fill="#A37C40" fontSize="9" fontWeight="bold" fontFamily="sans-serif">z</text>
            <text x="81" y="19" fill="#98473E" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Z</text>
            <path
              d="M17 48 Q17 51 14 51 Q17 51 17 54 Q17 51 20 51 Q17 51 17 48 Z"
              fill="url(#clockSparkleGrad)"
            />
          </>
        )}
      </svg>
    </div>
  );
}
