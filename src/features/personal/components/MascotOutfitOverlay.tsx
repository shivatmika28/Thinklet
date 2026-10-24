// [PERSONAL] SVG accessory overlay component anchored to Pip's 100x100 mascot coordinate space
"use client";

import React from 'react';
import { MascotOutfit } from '../types';

export interface MascotOutfitOverlayProps {
  outfit?: MascotOutfit;
  className?: string;
}

export function MascotOutfitOverlay({
  outfit,
  className = '',
}: MascotOutfitOverlayProps) {
  if (!outfit) return null;
  const { hat, glasses, scarf } = outfit;

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-10 flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="beanieGrad" x1="26" y1="14" x2="74" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6B9080" />
            <stop offset="1" stopColor="#4A6B5D" />
          </linearGradient>
          <linearGradient id="wizardGrad" x1="28" y1="4" x2="72" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6A4C93" />
            <stop offset="1" stopColor="#3C2A53" />
          </linearGradient>
          <linearGradient id="terracottaScarfGrad" x1="28" y1="58" x2="72" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B35446" />
            <stop offset="1" stopColor="#87352B" />
          </linearGradient>
          <linearGradient id="emeraldScarfGrad" x1="28" y1="58" x2="72" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2D6A4F" />
            <stop offset="1" stopColor="#1B4332" />
          </linearGradient>
        </defs>

        {/* 1. SCARFS (Rendered behind face/glasses, over chest/neck) */}
        {scarf === 'scarf-terracotta' && (
          <g id="overlay-scarf-terracotta">
            {/* Scarf back drape */}
            <path
              d="M 26 59 C 26 54, 74 54, 74 59 C 74 65, 26 65, 26 59 Z"
              fill="url(#terracottaScarfGrad)"
              stroke="#6B2921"
              strokeWidth="1.2"
            />
            {/* Hanging scarf tail */}
            <path
              d="M 33 60 L 33 77 Q 38 78 43 77 L 43 60 Z"
              fill="#87352B"
              stroke="#6B2921"
              strokeWidth="1"
            />
            {/* Knit texture stitches */}
            <line x1="35" y1="64" x2="41" y2="64" stroke="#F7EFE5" strokeWidth="0.8" strokeDasharray="1.5 1" opacity="0.8" />
            <line x1="35" y1="69" x2="41" y2="69" stroke="#F7EFE5" strokeWidth="0.8" strokeDasharray="1.5 1" opacity="0.8" />
            <line x1="35" y1="74" x2="41" y2="74" stroke="#F7EFE5" strokeWidth="0.8" strokeDasharray="1.5 1" opacity="0.8" />
            {/* Fringe threads */}
            <line x1="34.5" y1="77" x2="34.5" y2="80" stroke="#F7EFE5" strokeWidth="1" strokeLinecap="round" />
            <line x1="38" y1="77" x2="38" y2="80.5" stroke="#F7EFE5" strokeWidth="1" strokeLinecap="round" />
            <line x1="41.5" y1="77" x2="41.5" y2="80" stroke="#F7EFE5" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {scarf === 'scarf-emerald' && (
          <g id="overlay-scarf-emerald">
            {/* Scarf back drape */}
            <path
              d="M 26 59 C 26 54, 74 54, 74 59 C 74 65, 26 65, 26 59 Z"
              fill="url(#emeraldScarfGrad)"
              stroke="#0D281E"
              strokeWidth="1.2"
            />
            {/* Hanging scarf tail */}
            <path
              d="M 33 60 L 33 77 Q 38 78 43 77 L 43 60 Z"
              fill="#1B4332"
              stroke="#0D281E"
              strokeWidth="1"
            />
            {/* Golden embroidered thread accents */}
            <line x1="35" y1="65" x2="41" y2="65" stroke="#C49B59" strokeWidth="1" strokeDasharray="2 1" />
            <line x1="35" y1="71" x2="41" y2="71" stroke="#C49B59" strokeWidth="1" strokeDasharray="2 1" />
            {/* Fringe */}
            <line x1="34.5" y1="77" x2="34.5" y2="80" stroke="#C49B59" strokeWidth="1" strokeLinecap="round" />
            <line x1="38" y1="77" x2="38" y2="80.5" stroke="#C49B59" strokeWidth="1" strokeLinecap="round" />
            <line x1="41.5" y1="77" x2="41.5" y2="80" stroke="#C49B59" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* 2. GLASSES (Rendered right over eyes at cx=40, cx=60, cy=46) */}
        {glasses === 'glasses-round' && (
          <g id="overlay-glasses-round">
            {/* Left wire lens */}
            <circle
              cx="40"
              cy="46"
              r="7.5"
              fill="rgba(255,255,255,0.18)"
              stroke="#A37C40"
              strokeWidth="1.8"
            />
            {/* Right wire lens */}
            <circle
              cx="60"
              cy="46"
              r="7.5"
              fill="rgba(255,255,255,0.18)"
              stroke="#A37C40"
              strokeWidth="1.8"
            />
            {/* Center nose bridge */}
            <path
              d="M 47.5 45 Q 50 43 52.5 45"
              stroke="#A37C40"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Left temple */}
            <line x1="32.5" y1="46" x2="25" y2="44" stroke="#A37C40" strokeWidth="1.4" strokeLinecap="round" />
            {/* Right temple */}
            <line x1="67.5" y1="46" x2="75" y2="44" stroke="#A37C40" strokeWidth="1.4" strokeLinecap="round" />
            {/* Glass glint */}
            <path d="M 37 42 L 43 44" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
            <path d="M 57 42 L 63 44" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
          </g>
        )}

        {glasses === 'glasses-sunglasses' && (
          <g id="overlay-glasses-sunglasses">
            {/* Left Dark Frame */}
            <rect
              x="30"
              y="39"
              width="18"
              height="14"
              rx="4"
              fill="#241D19"
              stroke="#98473E"
              strokeWidth="1.2"
            />
            {/* Right Dark Frame */}
            <rect
              x="52"
              y="39"
              width="18"
              height="14"
              rx="4"
              fill="#241D19"
              stroke="#98473E"
              strokeWidth="1.2"
            />
            {/* Bridge */}
            <line x1="48" y1="44" x2="52" y2="44" stroke="#98473E" strokeWidth="2.8" strokeLinecap="round" />
            {/* Sleek sheen shine */}
            <path d="M 32 41 L 44 43" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
            <path d="M 54 41 L 66 43" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
          </g>
        )}

        {/* 3. HATS (Over crown and forehead) */}
        {hat === 'beanie-sage' && (
          <g id="overlay-hat-beanie">
            {/* Beanie Crown covering upper head */}
            <path
              d="M 25 29 C 25 14, 75 14, 75 29 Z"
              fill="url(#beanieGrad)"
              stroke="#354F52"
              strokeWidth="1.2"
            />
            {/* Folded ribbed cuff */}
            <rect
              x="23"
              y="25"
              width="54"
              height="7"
              rx="3.5"
              fill="#354F52"
              stroke="#2F3E46"
              strokeWidth="1"
            />
            {/* Knit vertical ribs */}
            <line x1="33" y1="26" x2="33" y2="31" stroke="#52796F" strokeWidth="1" strokeLinecap="round" />
            <line x1="41" y1="26" x2="41" y2="31" stroke="#52796F" strokeWidth="1" strokeLinecap="round" />
            <line x1="50" y1="26" x2="50" y2="31" stroke="#52796F" strokeWidth="1" strokeLinecap="round" />
            <line x1="59" y1="26" x2="59" y2="31" stroke="#52796F" strokeWidth="1" strokeLinecap="round" />
            <line x1="67" y1="26" x2="67" y2="31" stroke="#52796F" strokeWidth="1" strokeLinecap="round" />
            {/* Fluffy Pom-Pom */}
            <circle cx="50" cy="13" r="5.5" fill="#84A98C" />
            <circle cx="49" cy="12" r="2" fill="white" opacity="0.4" />
          </g>
        )}

        {hat === 'wizard-hat' && (
          <g id="overlay-hat-wizard">
            {/* Pointed Cone */}
            <path
              d="M 27 26 Q 44 2 53 4 Q 58 10 73 26 Z"
              fill="url(#wizardGrad)"
              stroke="#241438"
              strokeWidth="1.2"
            />
            {/* Wide Hat Brim */}
            <ellipse
              cx="50"
              cy="26"
              rx="28"
              ry="5.5"
              fill="#3C2A53"
              stroke="#98473E"
              strokeWidth="1.2"
            />
            {/* Gold Ribbon Band */}
            <path
              d="M 33 24 Q 50 22 67 24"
              stroke="#C49B59"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Golden Star Accent */}
            <polygon
              points="50,19 51.5,22 55,22.5 52.5,25 53,28.5 50,27 47,28.5 47.5,25 45,22.5 48.5,22"
              fill="#FFD166"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
