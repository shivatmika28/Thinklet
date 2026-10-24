"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Download, Copy, X, Sparkles, Check, Flame, Clock, Award, BookOpen } from 'lucide-react';
import { ThinkletWrappedData } from '../types';

export interface ThinkletWrappedModalProps {
  wrappedData: ThinkletWrappedData;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export function ThinkletWrappedModal({
  wrappedData,
  isOpen,
  onClose,
  onShowToast,
}: ThinkletWrappedModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Detect dark mode from documentElement
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Render canvas graphic
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 800;
    const h = 960;
    canvas.width = w;
    canvas.height = h;

    // 1. Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    if (isDarkMode) {
      bgGrad.addColorStop(0, '#1c1917');
      bgGrad.addColorStop(0.5, '#292524');
      bgGrad.addColorStop(1, '#1c1917');
    } else {
      bgGrad.addColorStop(0, '#fdfbf7');
      bgGrad.addColorStop(0.5, '#f5efe6');
      bgGrad.addColorStop(1, '#eae0d0');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Decorative background glow
    const glow = ctx.createRadialGradient(w / 2, 200, 50, w / 2, 200, 380);
    glow.addColorStop(0, isDarkMode ? 'rgba(152, 71, 62, 0.25)' : 'rgba(152, 71, 62, 0.12)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Outer border
    ctx.strokeStyle = isDarkMode ? '#44403c' : '#d6c7b2';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // Header badge
    ctx.fillStyle = '#98473E';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 110, 50, 220, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Quicksand, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THINKLET REVISION', w / 2, 73);

    // Title
    ctx.fillStyle = isDarkMode ? '#f5f5f4' : '#292524';
    ctx.font = 'bold 36px Quicksand, sans-serif';
    ctx.fillText(`${wrappedData.monthName} Wrapped`, w / 2, 130);

    ctx.fillStyle = isDarkMode ? '#a8a29e' : '#78716c';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Your personal study consistency and mastery recap', w / 2, 160);

    // Draw Pip Mascot Avatar
    const pipX = w / 2;
    const pipY = 250;
    // Body
    ctx.fillStyle = '#e07a5f';
    ctx.beginPath();
    ctx.ellipse(pipX, pipY, 55, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDarkMode ? '#1c1917' : '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.arc(pipX - 16, pipY - 4, 5, 0, Math.PI * 2);
    ctx.arc(pipX + 16, pipY - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Rosy cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(pipX - 25, pipY + 8, 8, 0, Math.PI * 2);
    ctx.arc(pipX + 25, pipY + 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pipX, pipY + 2, 12, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Scholar Cap
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(pipX - 35, pipY - 45);
    ctx.lineTo(pipX, pipY - 60);
    ctx.lineTo(pipX + 35, pipY - 45);
    ctx.lineTo(pipX, pipY - 30);
    ctx.closePath();
    ctx.fill();

    // 4 Metric Cards
    const cardBg = isDarkMode ? '#292524' : '#ffffff';
    const cardBorder = isDarkMode ? '#44403c' : '#e7d8c5';
    const textColor = isDarkMode ? '#f5f5f4' : '#1c1917';
    const mutedColor = isDarkMode ? '#a8a29e' : '#78716c';

    const drawMetricCard = (
      x: number,
      y: number,
      widthCard: number,
      heightCard: number,
      label: string,
      value: string,
      subtext: string,
      accentColor: string
    ) => {
      ctx.fillStyle = cardBg;
      ctx.beginPath();
      ctx.roundRect(x, y, widthCard, heightCard, 16);
      ctx.fill();

      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top color pill
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(x + 18, y + 16, 8, 8, 4);
      ctx.fill();

      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = mutedColor;
      ctx.fillText(label.toUpperCase(), x + 34, y + 24);

      ctx.font = 'bold 26px Quicksand, sans-serif';
      ctx.fillStyle = textColor;
      ctx.fillText(value, x + 18, y + 62);

      ctx.font = '13px Inter, sans-serif';
      ctx.fillStyle = mutedColor;
      ctx.fillText(subtext, x + 18, y + 90);
    };

    const cardW = 340;
    const cardH = 115;
    const gap = 24;
    const startX = (w - (cardW * 2 + gap)) / 2;
    const startY = 340;

    // Card 1: Hours
    drawMetricCard(
      startX,
      startY,
      cardW,
      cardH,
      'Deep Study Time',
      `${wrappedData.hoursStudied} Hours`,
      'Focused revision logged',
      '#98473E'
    );

    // Card 2: Streak
    drawMetricCard(
      startX + cardW + gap,
      startY,
      cardW,
      cardH,
      'Longest Streak',
      `${wrappedData.longestStreak} Days`,
      'Unbroken learning rhythm',
      '#f59e0b'
    );

    // Card 3: Biggest Improvement
    drawMetricCard(
      startX,
      startY + cardH + gap,
      cardW,
      cardH,
      'Biggest Mastery Leap',
      wrappedData.biggestImprovement?.topicName || 'General Concepts',
      `+${wrappedData.biggestImprovement?.gain || 40}% score surge`,
      '#10b981'
    );

    // Card 4: Favourite Topic
    drawMetricCard(
      startX + cardW + gap,
      startY + cardH + gap,
      cardW,
      cardH,
      'Favourite Topic',
      wrappedData.favouriteTopic?.topicName || 'Science & Fundamentals',
      `${wrappedData.favouriteTopic?.questionsPracticed || 20} items practiced`,
      '#3b82f6'
    );

    // Mascot Quote Banner
    const quoteY = 640;
    ctx.fillStyle = isDarkMode ? '#201d1b' : '#f0e6d6';
    ctx.beginPath();
    ctx.roundRect(startX, quoteY, cardW * 2 + gap, 80, 16);
    ctx.fill();
    ctx.strokeStyle = isDarkMode ? '#44403c' : '#d8c7b0';
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = 'italic 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(wrappedData.keyMascotQuote, w / 2, quoteY + 46);

    // Footer Watermark
    ctx.fillStyle = mutedColor;
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('learnmate.thinklet.app • Grounded Learning & Personal Wellbeing', w / 2, 890);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(drawCanvas, 100);
    }
  }, [isOpen, wrappedData, isDarkMode]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);
    try {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `thinklet-wrapped-${wrappedData.monthName.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        if (onShowToast) onShowToast('Wrapped card downloaded as PNG!');
      }, 'image/png');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
          if (onShowToast) onShowToast('Wrapped PNG copied to clipboard!');
        } else {
          // Fallback to direct download
          handleDownloadPng();
        }
      }, 'image/png');
    } catch {
      handleDownloadPng();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wrapped-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
          aria-label="Close Wrapped Modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-[#98473E] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Monthly Celebration</span>
          </div>
          <h2
            id="wrapped-title"
            className="text-2xl font-bold text-[var(--text)] font-['Quicksand',sans-serif]"
          >
            {wrappedData.monthName} Wrapped
          </h2>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Your personal learning milestones, consistency streaks, and biggest breakthroughs
          </p>
        </div>

        {/* Visual Preview Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-raised)] space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Clock className="h-3.5 w-3.5 text-[#98473E]" />
                <span>Deep Study Time</span>
              </div>
              <div className="text-xl font-bold text-[var(--text)]">
                {wrappedData.hoursStudied} hrs
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Focused learning logged</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span>Longest Streak</span>
              </div>
              <div className="text-xl font-bold text-[var(--text)]">
                {wrappedData.longestStreak} Days
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Consistent habit</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Award className="h-3.5 w-3.5 text-emerald-500" />
                <span>Top Mastery Leap</span>
              </div>
              <div className="text-sm font-bold text-[var(--text)] truncate">
                {wrappedData.biggestImprovement?.topicName || 'Foundations'}
              </div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                +{wrappedData.biggestImprovement?.gain || 35}% score leap
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                <span>Favourite Topic</span>
              </div>
              <div className="text-sm font-bold text-[var(--text)] truncate">
                {wrappedData.favouriteTopic?.topicName || 'Core Science'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {wrappedData.favouriteTopic?.questionsPracticed || 15} questions solved
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)] text-center text-xs italic text-[var(--text)]">
            {wrappedData.keyMascotQuote}
          </div>
        </div>

        {/* Off-screen Canvas for High-Res PNG Generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-soft)]">
          <button
            type="button"
            onClick={handleCopyClipboard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-xs font-bold text-[var(--text)] cursor-pointer transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Copied PNG!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Image</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#98473E] hover:bg-[#803B33] text-xs font-bold text-white shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
