"use client";

import React, { useState } from "react";
import { RoomSlot, RoomItem } from "../types";
import { ROOM_ITEMS_CATALOG, isItemUnlocked } from "../utils/studyRoom";
import { Sparkles, Check, Lock, Undo2 } from "lucide-react";

export interface StudyRoomProps {
  roomPlacements: Partial<Record<RoomSlot, string>>;
  studentLevel: number;
  totalXp: number;
  onUpdatePlacement: (slot: RoomSlot, itemId: string | undefined) => void;
  className?: string;
}

export const StudyRoom: React.FC<StudyRoomProps> = ({
  roomPlacements,
  studentLevel,
  totalXp,
  onUpdatePlacement,
  className = "",
}) => {
  const [selectedSlot, setSelectedSlot] = useState<RoomSlot>("desk");

  const getItem = (id?: string) => ROOM_ITEMS_CATALOG.find((item) => item.id === id);

  const placedDesk = getItem(roomPlacements.desk);
  const placedPlant = getItem(roomPlacements.plant);
  const placedLamp = getItem(roomPlacements.lamp);
  const placedPoster = getItem(roomPlacements.poster);
  const placedRug = getItem(roomPlacements.rug);

  const slotItems = ROOM_ITEMS_CATALOG.filter((item) => item.slot === selectedSlot);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Visual SVG / CSS Interactive Room Frame */}
      <div className="relative w-full aspect-[16/9] max-h-[300px] rounded-3xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow)] bg-[#F5EBE0] dark:bg-[#201A18] select-none">
        <svg
          viewBox="0 0 640 360"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Wall Gradient */}
            <linearGradient id="roomWall" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--surface-raised, #FAF0CA)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--surface, #E0D3C1)" stopOpacity="1" />
            </linearGradient>

            {/* Floor Gradient */}
            <linearGradient id="roomFloor" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C9ADA7" />
              <stop offset="100%" stopColor="#9A8C98" />
            </linearGradient>

            {/* Window Daylight */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A2D2FF" />
              <stop offset="100%" stopColor="#BDE0FE" />
            </linearGradient>

            {/* Lamp Ambient Glow */}
            <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={placedLamp?.color || "#F4A261"} stopOpacity="0.5" />
              <stop offset="100%" stopColor={placedLamp?.color || "#F4A261"} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Wall background */}
          <rect x="0" y="0" width="640" height="260" fill="url(#roomWall)" />

          {/* Floor */}
          <polygon points="0,260 640,260 640,360 0,360" fill="url(#roomFloor)" />
          {/* Baseboard border */}
          <line x1="0" y1="260" x2="640" y2="260" stroke="#7A6858" strokeWidth="4" />

          {/* Window */}
          <g transform="translate(420, 40)">
            <rect x="0" y="0" width="140" height="150" rx="8" fill="url(#skyGrad)" stroke="#7A6858" strokeWidth="6" />
            {/* Window crossbars */}
            <line x1="70" y1="0" x2="70" y2="150" stroke="#7A6858" strokeWidth="4" />
            <line x1="0" y1="75" x2="140" y2="75" stroke="#7A6858" strokeWidth="4" />
            {/* Clouds */}
            <ellipse cx="45" cy="50" rx="20" ry="10" fill="white" opacity="0.8" />
            <ellipse cx="60" cy="45" rx="15" ry="8" fill="white" opacity="0.9" />
            <ellipse cx="100" cy="90" rx="18" ry="9" fill="white" opacity="0.8" />
          </g>

          {/* --- POSTER SLOT --- */}
          {placedPoster ? (
            <g transform="translate(80, 45)">
              <rect x="0" y="0" width="110" height="130" rx="4" fill={placedPoster.color} stroke="#4A3F35" strokeWidth="4" />
              <rect x="6" y="6" width="98" height="118" rx="2" fill="white" fillOpacity="0.15" />
              <circle cx="55" cy="55" r="24" fill="white" fillOpacity="0.25" />
              <text x="55" y="105" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                {placedPoster.name.slice(0, 14)}
              </text>
            </g>
          ) : (
            <g transform="translate(80, 45)">
              <rect x="0" y="0" width="110" height="130" rx="4" fill="none" stroke="currentColor" strokeDasharray="4 4" strokeWidth="2" opacity="0.3" />
              <text x="55" y="70" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.4" fontFamily="sans-serif">
                Empty Poster
              </text>
            </g>
          )}

          {/* --- RUG SLOT --- */}
          {placedRug && (
            <g transform="translate(200, 275)">
              <ellipse cx="120" cy="40" rx="140" ry="35" fill={placedRug.color} stroke="#4A3F35" strokeWidth="3" opacity="0.9" />
              <ellipse cx="120" cy="40" rx="120" ry="25" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
            </g>
          )}

          {/* --- DESK SLOT --- */}
          {placedDesk && (
            <g transform="translate(180, 185)">
              {/* Desk Top */}
              <polygon points="0,45 280,45 250,85 -30,85" fill={placedDesk.color} stroke="#3D2B1F" strokeWidth="3" />
              {/* Desk Front Panel */}
              <polygon points="-30,85 250,85 250,110 -30,110" fill={placedDesk.color} stroke="#3D2B1F" strokeWidth="3" filter="brightness(0.85)" />
              {/* Desk Legs */}
              <rect x="-24" y="110" width="12" height="45" fill="#3D2B1F" rx="2" />
              <rect x="232" y="110" width="12" height="45" fill="#3D2B1F" rx="2" />
              <rect x="10" y="90" width="10" height="35" fill="#2E2016" rx="2" />
              <rect x="200" y="90" width="10" height="35" fill="#2E2016" rx="2" />
            </g>
          )}

          {/* --- LAMP SLOT (Placed on Desk) --- */}
          {placedLamp && (
            <g transform="translate(190, 135)">
              {/* Ambient Glow */}
              <circle cx="20" cy="25" r="55" fill="url(#lampGlow)" />
              {/* Base */}
              <ellipse cx="20" cy="55" rx="14" ry="4" fill="#333" />
              {/* Stem */}
              <path d="M 20 55 Q 24 35 20 20" fill="none" stroke="#222" strokeWidth="4" />
              {/* Shade */}
              <polygon points="5,22 35,22 28,8 12,8" fill={placedLamp.color} stroke="#111" strokeWidth="2" />
            </g>
          )}

          {/* --- PLANT SLOT (Placed on Desk) --- */}
          {placedPlant && (
            <g transform="translate(380, 150)">
              {/* Pot */}
              <polygon points="10,40 30,40 26,60 14,60" fill="#B07D62" stroke="#4A3F35" strokeWidth="2" />
              {/* Leaves */}
              <ellipse cx="14" cy="30" rx="8" ry="12" fill={placedPlant.color} transform="rotate(-25 14 30)" />
              <ellipse cx="26" cy="30" rx="8" ry="12" fill={placedPlant.color} transform="rotate(25 26 30)" />
              <ellipse cx="20" cy="24" rx="8" ry="14" fill={placedPlant.color} />
            </g>
          )}

          {/* Mascot Pip Reading by the Desk */}
          <g transform="translate(290, 215)">
            {/* Penguin Shadow */}
            <ellipse cx="25" cy="55" rx="20" ry="7" fill="black" opacity="0.18" />
            {/* Body */}
            <ellipse cx="25" cy="30" rx="18" ry="22" fill="#1E293B" />
            {/* White Belly */}
            <ellipse cx="25" cy="33" rx="12" ry="16" fill="#F8FAFC" />
            {/* Eyes */}
            <circle cx="20" cy="22" r="2.5" fill="#0F172A" />
            <circle cx="30" cy="22" r="2.5" fill="#0F172A" />
            {/* Beak */}
            <polygon points="23,26 27,26 25,30" fill="#F59E0B" />
            {/* Cheeks */}
            <circle cx="17" cy="26" r="2.5" fill="#F43F5E" opacity="0.45" />
            <circle cx="33" cy="26" r="2.5" fill="#F43F5E" opacity="0.45" />
            {/* Tiny Open Book in flippers */}
            <polygon points="15,40 25,43 35,40 34,48 25,50 16,48" fill="#F1F5F9" stroke="#98473E" strokeWidth="1.5" />
            <line x1="25" y1="43" x2="25" y2="50" stroke="#98473E" strokeWidth="1.5" />
            {/* Graduation Cap */}
            <polygon points="12,12 25,8 38,12 25,16" fill="#98473E" />
            <circle cx="25" cy="12" r="1.5" fill="#F59E0B" />
            <line x1="25" y1="12" x2="35" y2="17" stroke="#F59E0B" strokeWidth="1" />
          </g>
        </svg>

        {/* Room Header Overlay */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] text-[10px] font-bold text-[var(--text)] flex items-center gap-1.5 shadow-xs">
          <Sparkles className="h-3 w-3 text-[#A37C40]" />
          <span>Pip&apos;s Study Room • Level {studentLevel}</span>
        </div>
      </div>

      {/* 2. Slot Selection Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] overflow-x-auto no-scrollbar">
        {(["desk", "plant", "lamp", "poster", "rug"] as RoomSlot[]).map((slot) => {
          const isSelected = selectedSlot === slot;
          const currentItem = getItem(roomPlacements[slot]);
          return (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap text-center ${
                isSelected
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <span>{slot}</span>
              {currentItem && (
                <span className="ml-1 text-[10px] text-[#7F9274]">●</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Catalog Items for Selected Slot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {slotItems.map((item) => {
          const unlocked = isItemUnlocked(item, studentLevel, totalXp);
          const isPlaced = roomPlacements[item.slot] === item.id;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                isPlaced
                  ? "bg-[#7F9274]/15 border-[#7F9274]/40 shadow-xs"
                  : unlocked
                  ? "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
                  : "bg-[var(--surface-raised)]/60 border-[var(--border)] opacity-60"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text)] truncate">
                    {item.name}
                  </span>
                  <div
                    className="h-3 w-3 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--border-soft)] flex items-center justify-between">
                {unlocked ? (
                  isPlaced ? (
                    <button
                      type="button"
                      onClick={() => onUpdatePlacement(item.slot, undefined)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                    >
                      <Undo2 className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpdatePlacement(item.slot, item.id)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--primary)] hover:text-white transition-colors text-[10px] font-bold text-[var(--text)] cursor-pointer"
                    >
                      Place Item
                    </button>
                  )
                ) : (
                  <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)]">
                    <Lock className="h-3 w-3" />
                    <span>Unlocks at Lv {item.requiredLevel}</span>
                  </div>
                )}

                {isPlaced && (
                  <span className="text-[10px] font-bold text-[#7F9274] flex items-center gap-0.5">
                    <Check className="h-3 w-3" />
                    <span>Placed</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
