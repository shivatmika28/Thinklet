"use client";

import React from "react";

export interface CelebrationTrophyMascotProps {
  size?: number | "sm" | "md" | "lg";
  className?: string;
  withSparkles?: boolean;
}

export function CelebrationTrophyMascot({
  size = "md",
  className = "",
  withSparkles = true,
}: CelebrationTrophyMascotProps) {
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
          {/* Muted Copper to Golden Warm Trophy Gradient */}
          <linearGradient id="trophyCupGrad" x1="25" y1="20" x2="75" y2="65" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E5C384" />
            <stop offset="0.45" stopColor="#C49B59" />
            <stop offset="1" stopColor="#A37C40" />
          </linearGradient>

          {/* Pedestal Base: Terracotta & Warm Charcoal */}
          <linearGradient id="pedestalGrad" x1="30" y1="72" x2="70" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#98473E" />
            <stop offset="1" stopColor="#7A342D" />
          </linearGradient>

          {/* Sparkle Gradient */}
          <linearGradient id="trophySparkleGrad" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F7EFE5" />
            <stop offset="1" stopColor="#C49B59" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="90" rx="22" ry="4" fill="#30251F" fillOpacity="0.16" />

        {/* Trophy Base Pedestal */}
        <rect
          x="34"
          y="79"
          width="32"
          height="9"
          rx="3"
          fill="url(#pedestalGrad)"
          stroke="#30251F"
          strokeWidth="1.6"
        />
        {/* Pedestal Upper Tier */}
        <rect
          x="40"
          y="73"
          width="20"
          height="7"
          rx="2"
          fill="#30251F"
          stroke="#30251F"
          strokeWidth="1.2"
        />
        {/* Trophy Stem */}
        <path
          d="M47 62 L53 62 L52 74 L48 74 Z"
          fill="url(#trophyCupGrad)"
          stroke="#30251F"
          strokeWidth="1.5"
        />

        {/* Left Trophy Handle */}
        <path
          d="M32 30 C19 30 19 48 32 52"
          stroke="#A37C40"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M32 30 C21 30 21 48 32 52"
          stroke="#30251F"
          strokeWidth="1.4"
          fill="none"
        />

        {/* Right Trophy Handle */}
        <path
          d="M68 30 C81 30 81 48 68 52"
          stroke="#A37C40"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M68 30 C79 30 79 48 68 52"
          stroke="#30251F"
          strokeWidth="1.4"
          fill="none"
        />

        {/* Trophy Main Cup */}
        <path
          d="M28 25 C28 25 28 62 50 62 C72 62 72 25 72 25 Z"
          fill="url(#trophyCupGrad)"
          stroke="#30251F"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Cup Rim Highlight */}
        <ellipse cx="50" cy="25" rx="22" ry="4" fill="#E5C384" stroke="#30251F" strokeWidth="1.6" />
        <ellipse cx="50" cy="25" rx="19" ry="2.5" fill="#C49B59" />

        {/* Cute Mascot Face on Cup */}
        {/* Left Joyous Eye */}
        <circle cx="43" cy="38" r="2.6" fill="#30251F" />
        <circle cx="42" cy="37" r="0.9" fill="#FFFFFF" />

        {/* Right Joyous Eye */}
        <circle cx="57" cy="38" r="2.6" fill="#30251F" />
        <circle cx="56" cy="37" r="0.9" fill="#FFFFFF" />

        {/* Cheeks */}
        <ellipse cx="37" cy="42" rx="2.5" ry="1.5" fill="#D6C3C9" fillOpacity="0.85" />
        <ellipse cx="63" cy="42" rx="2.5" ry="1.5" fill="#D6C3C9" fillOpacity="0.85" />

        {/* Big Joyful Smile */}
        <path
          d="M45 42 Q50 48 55 42"
          stroke="#30251F"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Star Badge on Cup */}
        <g transform="translate(50, 52) scale(0.65)">
          <path
            d="M0 -6 L2 -2 L6 -1 L3 2 L4 6 L0 4 L-4 6 L-3 2 L-6 -1 L-2 -2 Z"
            fill="#FFF9F2"
            stroke="#98473E"
            strokeWidth="1"
          />
        </g>

        {/* Celebratory Confetti & Sparkles */}
        {withSparkles && (
          <>
            {/* Top-Right Sparkle */}
            <path
              d="M78 14 Q78 19 73 19 Q78 19 78 24 Q78 19 83 19 Q78 19 78 14 Z"
              fill="url(#trophySparkleGrad)"
            />
            {/* Top-Left Tiny Star */}
            <path
              d="M19 19 Q19 23 16 23 Q19 23 19 27 Q19 23 22 23 Q19 23 19 19 Z"
              fill="#C49B59"
            />
            {/* Confetti specs */}
            <circle cx="21" cy="63" r="1.5" fill="#7F9274" />
            <circle cx="81" cy="60" r="1.5" fill="#D6C3C9" />
            <circle cx="50" cy="11" r="1.4" fill="#C49B59" />
          </>
        )}
      </svg>
    </div>
  );
}
