"use client";

import React, { useEffect, useState, useRef } from "react";
import { CelebrationIntensity } from "../types";

export interface CelebrationPayload {
  intensity: CelebrationIntensity;
  message?: string;
}

export function triggerCelebration(intensity: CelebrationIntensity, message?: string) {
  if (typeof window === "undefined" || intensity === "off") return;
  window.dispatchEvent(
    new CustomEvent<CelebrationPayload>("thinklet:celebrate", {
      detail: { intensity, message },
    })
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
}

export const CelebrationEffects: React.FC = () => {
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [activeIntensity, setActiveIntensity] = useState<CelebrationIntensity | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const handleCelebrate = (e: CustomEvent<CelebrationPayload>) => {
      const { intensity, message } = e.detail;
      if (intensity === "off") return;

      setActiveIntensity(intensity);
      if (message) {
        setActiveMessage(message);
        setTimeout(() => setActiveMessage(null), 3500);
      }

      if (intensity === "confetti" || intensity === "standard") {
        spawnCanvasParticles(intensity);
      } else if (intensity === "subtle") {
        setTimeout(() => setActiveIntensity(null), 1500);
      }
    };

    window.addEventListener("thinklet:celebrate", handleCelebrate as EventListener);
    return () => {
      window.removeEventListener("thinklet:celebrate", handleCelebrate as EventListener);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const spawnCanvasParticles = (intensity: "confetti" | "standard") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match screen dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#98473E", // Thinklet Rust Red
      "#A37C40", // Warm Gold
      "#7F9274", // Sage Green
      "#F4A261", // Terracotta Coral
      "#457B9D", // Soft Cerulean
      "#E76F51", // Warm Orange
    ];

    const particleCount = intensity === "confetti" ? 80 : 35;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.4),
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * (intensity === "confetti" ? 14 : 7),
        vy: -Math.random() * (intensity === "confetti" ? 12 : 7) - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: intensity === "confetti" ? Math.random() * 8 + 5 : Math.random() * 5 + 3,
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
      });
    }

    let frame = 0;
    const gravity = 0.35;
    const maxFrames = intensity === "confetti" ? 140 : 80;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.rotation += p.vRot;
        if (frame > maxFrames * 0.6) {
          p.alpha -= 0.03;
        }

        if (p.alpha > 0 && p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (intensity === "confetti") {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            // Star/dot shape for standard
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      });

      if (alive && frame < maxFrames) {
        animationRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setActiveIntensity(null);
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(render);
  };

  return (
    <>
      {/* Full-screen particle canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          display: activeIntensity === "confetti" || activeIntensity === "standard" ? "block" : "none",
        }}
      />

      {/* Subtle glow border pulse */}
      {activeIntensity === "subtle" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 border-4 border-[#7F9274]/40 animate-pulse transition-opacity"
        />
      )}

      {/* Optional Celebratory Toast Banner */}
      {activeMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] shadow-xl text-xs font-bold text-[var(--text)] flex items-center gap-2 animate-bounce"
        >
          <span className="text-base">🎉</span>
          <span>{activeMessage}</span>
        </div>
      )}
    </>
  );
};
