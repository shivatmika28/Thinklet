"use client";

import React from "react";

export interface CuteBookMascotProps {
  size?: number | "sm" | "md" | "lg";
  className?: string;
  withSparkles?: boolean;
}

export function CuteBookMascot({
  size = "md",
  className = "",
  withSparkles = true,
}: CuteBookMascotProps) {
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
          {/* Earthy Book Cover Gradient: Terracotta to Warm Charcoal */}
          <linearGradient id="bookCoverGrad" x1="15" y1="25" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#98473E" />
            <stop offset="1" stopColor="#7A342D" />
          </linearGradient>

          {/* Warm Cream Pages Gradient */}
          <linearGradient id="bookPageGrad" x1="20" y1="28" x2="80" y2="75" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF9F2" />
            <stop offset="0.7" stopColor="#F7EFE5" />
            <stop offset="1" stopColor="#E1CFC0" />
          </linearGradient>

          {/* Soft Sage Bookmark Ribbon */}
          <linearGradient id="bookmarkGrad" x1="50" y1="20" x2="50" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9BAF8D" />
            <stop offset="1" stopColor="#7F9274" />
          </linearGradient>

          {/* Golden Copper Sparkle */}
          <linearGradient id="sparkleGrad" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C49B59" />
            <stop offset="1" stopColor="#A37C40" />
          </linearGradient>
        </defs>

        {/* Back Cover Shadow / Spine */}
        <path
          d="M12 70 C12 73 16 77 22 77 L48 81 C49.5 81.2 50.5 81.2 52 81 L78 77 C84 77 88 73 88 70 L86 36 C86 33 82 31 78 32 L51 37 C50.5 37.1 49.5 37.1 49 37 L22 32 C18 31 14 33 14 36 Z"
          fill="#30251F"
          fillOpacity="0.25"
        />

        {/* Outer Hardcover */}
        <path
          d="M14 67 C14 71 18 74 24 75 L48 78 C49.3 78.2 50.7 78.2 52 78 L76 75 C82 74 86 71 86 67 L84 34 C84 30 80 28 75 29 L51 34 C50.3 34.1 49.7 34.1 49 34 L25 29 C20 28 16 30 16 34 Z"
          fill="url(#bookCoverGrad)"
          stroke="#30251F"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Left Page Leaf */}
        <path
          d="M20 33 C20 31 23 30 26 31 L48 35 C49 35.2 49.5 35.5 50 36.5 L50 72 C49.5 71.5 49 71.2 48 71 L26 67 C22 66 20 64 20 62 Z"
          fill="url(#bookPageGrad)"
          stroke="#30251F"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Right Page Leaf */}
        <path
          d="M80 33 C80 31 77 30 74 31 L52 35 C51 35.2 50.5 35.5 50 36.5 L50 72 C50.5 71.5 51 71.2 52 71 L74 67 C78 66 80 64 80 62 Z"
          fill="url(#bookPageGrad)"
          stroke="#30251F"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Page Ridge Texture Lines (Subtle) */}
        <line x1="28" y1="39" x2="44" y2="42" stroke="#B49082" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <line x1="28" y1="45" x2="42" y2="47.5" stroke="#B49082" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <line x1="56" y1="42" x2="72" y2="39" stroke="#B49082" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <line x1="58" y1="47.5" x2="72" y2="45" stroke="#B49082" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />

        {/* Center Bookmark Ribbon */}
        <path
          d="M47 34 L53 34 L53 54 L50 51 L47 54 Z"
          fill="url(#bookmarkGrad)"
          stroke="#30251F"
          strokeWidth="1.2"
        />

        {/* Cute Mascot Face in the Center Book Spread */}
        {/* Left Eye */}
        <circle cx="37" cy="54" r="2.8" fill="#30251F" />
        <circle cx="36" cy="53" r="1" fill="#FFFFFF" />

        {/* Right Eye */}
        <circle cx="63" cy="54" r="2.8" fill="#30251F" />
        <circle cx="62" cy="53" r="1" fill="#FFFFFF" />

        {/* Cheerful Rosy Cheeks */}
        <ellipse cx="32" cy="58" rx="2.5" ry="1.6" fill="#D6C3C9" fillOpacity="0.85" />
        <ellipse cx="68" cy="58" rx="2.5" ry="1.6" fill="#D6C3C9" fillOpacity="0.85" />

        {/* Sweet Smiling Mouth (Crossing the gentle spine) */}
        <path
          d="M46 58 Q50 63 54 58"
          stroke="#30251F"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tiny Graduation Cap perched on the top right */}
        <g transform="translate(62, 12) rotate(12)">
          {/* Cap Diamond */}
          <polygon points="12,2 24,7 12,12 0,7" fill="#30251F" stroke="#98473E" strokeWidth="1" />
          <polygon points="12,3 22,7 12,11 2,7" fill="#241D19" />
          {/* Cap Skull Base */}
          <path d="M5 8.5 C5 13 19 13 19 8.5" fill="#30251F" />
          {/* Tassel */}
          <path d="M12 7 C14 8 16 13 16 16" stroke="url(#sparkleGrad)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <circle cx="16" cy="16.5" r="1" fill="#C49B59" />
        </g>

        {/* Decorative Sparkles & Stars */}
        {withSparkles && (
          <>
            {/* Top-Left Sparkle */}
            <path
              d="M18 18 Q18 22 14 22 Q18 22 18 26 Q18 22 22 22 Q18 22 18 18 Z"
              fill="url(#sparkleGrad)"
            />
            {/* Bottom-Right Small Star */}
            <circle cx="86" cy="78" r="1.5" fill="#C49B59" />
            <circle cx="12" cy="46" r="1.2" fill="#D6C3C9" />
          </>
        )}
      </svg>
    </div>
  );
}
