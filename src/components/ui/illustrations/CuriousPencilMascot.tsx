"use client";

import React from "react";

export interface CuriousPencilMascotProps {
  size?: number | "sm" | "md" | "lg";
  className?: string;
  withSparkles?: boolean;
}

export function CuriousPencilMascot({
  size = "md",
  className = "",
  withSparkles = true,
}: CuriousPencilMascotProps) {
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
          {/* Pencil Wooden Body Gradient: Terracotta to Dusty Taupe */}
          <linearGradient id="pencilWoodGrad" x1="25" y1="20" x2="75" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#98473E" />
            <stop offset="0.6" stopColor="#B49082" />
            <stop offset="1" stopColor="#A37C40" />
          </linearGradient>

          {/* Eraser Gradient: Dusty Rose */}
          <linearGradient id="eraserGrad" x1="35" y1="10" x2="65" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E5D0D6" />
            <stop offset="1" stopColor="#D6C3C9" />
          </linearGradient>

          {/* Copper Ferrule Metal Ring */}
          <linearGradient id="ferruleGrad" x1="30" y1="22" x2="70" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C49B59" />
            <stop offset="0.5" stopColor="#F7EFE5" />
            <stop offset="1" stopColor="#A37C40" />
          </linearGradient>

          {/* Sharpened Wood Cone Gradient */}
          <linearGradient id="pencilTipWoodGrad" x1="35" y1="65" x2="65" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F7EFE5" />
            <stop offset="1" stopColor="#E1CFC0" />
          </linearGradient>

          {/* Sparkle Gradient */}
          <linearGradient id="pencilSparkleGrad" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C49B59" />
            <stop offset="1" stopColor="#A37C40" />
          </linearGradient>
        </defs>

        {/* Shadow under pencil */}
        <ellipse cx="50" cy="90" rx="22" ry="5" fill="#30251F" fillOpacity="0.16" />

        {/* Mascot Pencil Main Body (Gently Tilted) */}
        <g transform="rotate(-6 50 50)">
          {/* Soft Rounded Eraser Cap */}
          <path
            d="M38 24 C38 15 62 15 62 24 Z"
            fill="url(#eraserGrad)"
            stroke="#30251F"
            strokeWidth="1.6"
          />

          {/* Metal Ferrule Band */}
          <rect
            x="36"
            y="23"
            width="28"
            height="8"
            rx="2.5"
            fill="url(#ferruleGrad)"
            stroke="#30251F"
            strokeWidth="1.6"
          />
          {/* Metal Crimp Ridges */}
          <line x1="41" y1="24" x2="41" y2="30" stroke="#75665D" strokeWidth="1" strokeLinecap="round" />
          <line x1="50" y1="24" x2="50" y2="30" stroke="#75665D" strokeWidth="1" strokeLinecap="round" />
          <line x1="59" y1="24" x2="59" y2="30" stroke="#75665D" strokeWidth="1" strokeLinecap="round" />

          {/* Pencil Hexagonal Body */}
          <rect
            x="37"
            y="31"
            width="26"
            height="36"
            rx="4"
            fill="url(#pencilWoodGrad)"
            stroke="#30251F"
            strokeWidth="1.8"
          />

          {/* Body Facet Shadow Lines */}
          <line x1="45" y1="31" x2="45" y2="67" stroke="#7A342D" strokeWidth="1.2" strokeOpacity="0.5" />
          <line x1="55" y1="31" x2="55" y2="67" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.35" />

          {/* Sharpened Wooden Tip (Cone) */}
          <polygon
            points="37,67 63,67 50,86"
            fill="url(#pencilTipWoodGrad)"
            stroke="#30251F"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Graphite Lead Point */}
          <polygon
            points="46,79 54,79 50,86"
            fill="#30251F"
          />

          {/* Cute Friendly Cartoon Face */}
          {/* Left Eye */}
          <circle cx="44" cy="45" r="3" fill="#30251F" />
          <circle cx="43" cy="44" r="1.1" fill="#FFFFFF" />

          {/* Right Eye */}
          <circle cx="56" cy="45" r="3" fill="#30251F" />
          <circle cx="55" cy="44" r="1.1" fill="#FFFFFF" />

          {/* Rosy Cheeks */}
          <ellipse cx="40" cy="50" rx="2.5" ry="1.5" fill="#D6C3C9" fillOpacity="0.85" />
          <ellipse cx="60" cy="50" rx="2.5" ry="1.5" fill="#D6C3C9" fillOpacity="0.85" />

          {/* Curious Cheerful Mouth */}
          <path
            d="M48 51 Q50 55 52 51"
            stroke="#30251F"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Tiny Little Cute Hands holding the pencil sides */}
          <circle cx="36" cy="55" r="2.8" fill="#F7EFE5" stroke="#30251F" strokeWidth="1.2" />
          <circle cx="64" cy="55" r="2.8" fill="#F7EFE5" stroke="#30251F" strokeWidth="1.2" />
        </g>

        {/* Floating Sparkles & Inspiring Idea Star */}
        {withSparkles && (
          <>
            {/* Upper Right Sparkle */}
            <path
              d="M74 18 Q74 23 69 23 Q74 23 74 28 Q74 23 79 23 Q74 23 74 18 Z"
              fill="url(#pencilSparkleGrad)"
            />
            {/* Small Left Sparkle */}
            <path
              d="M20 42 Q20 45 17 45 Q20 45 20 48 Q20 45 23 45 Q20 45 20 42 Z"
              fill="#D6C3C9"
            />
            {/* Tiny accent dot */}
            <circle cx="78" cy="48" r="1.4" fill="#C49B59" />
          </>
        )}
      </svg>
    </div>
  );
}
