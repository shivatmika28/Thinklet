"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMaterial } from "@/context/MaterialContext";
import { PlusCircle, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { SettingsPanel } from "@/features/components/SettingsPanel";
import { useFeatures } from "@/features/components/FeaturesProvider";

export function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { materials, activeMaterialId, setActiveMaterialId } = useMaterial();
  const { settings } = useFeatures();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header
        style={{
          backgroundColor: "var(--panel)",
          borderBottom: "1px solid var(--border)",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div>
          {title && (
            <h1 style={{ fontSize: "17px", fontWeight: 700, color: "var(--heading)", margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, marginTop: "2px" }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Material Switcher Dropdown */}
          {materials.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }} className="hidden sm:inline">
                Material:
              </span>
              <select
                value={activeMaterialId || ""}
                onChange={(e) => setActiveMaterialId(e.target.value)}
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  backgroundColor: "var(--raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-button)",
                  padding: "6px 10px",
                  outline: "none",
                  cursor: "pointer",
                  maxWidth: "180px",
                }}
                className="focus-ring"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id} style={{ backgroundColor: "var(--panel)", color: "var(--text-primary)" }}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* AI Grounding Status Indicator (Icon + Visible Text Label) */}
          <div
            className="hidden lg:flex items-center gap-1.5"
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "rgba(127, 163, 138, 0.12)",
              border: "1px solid var(--strong)",
              color: "var(--strong)",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 style={{ width: "13px", height: "13px" }} aria-hidden="true" />
            <span>Gemini Grounded</span>
          </div>

          {/* Tutor Persona / Preferences Button */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={`Configure tutor style. Current tone: ${settings.tone}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              backgroundColor: "var(--raised)",
              color: "var(--text-primary)",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "border-color 150ms var(--ease-standard)",
            }}
            className="focus-ring hover:border-[var(--heading)] active:scale-[0.98]"
          >
            <SlidersHorizontal style={{ width: "14px", height: "14px", color: "var(--heading)" }} aria-hidden="true" />
            <span className="hidden sm:inline">Tutor: {settings.tone}</span>
          </button>

          {/* Quick Upload Action Button */}
          <Link
            href="/materials"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "var(--radius-button)",
              textDecoration: "none",
              border: "1px solid var(--button)",
              transition: "opacity 150ms var(--ease-standard)",
            }}
            className="focus-ring hover:opacity-90 active:scale-[0.98]"
          >
            <PlusCircle style={{ width: "14px", height: "14px" }} aria-hidden="true" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
