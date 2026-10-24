"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Topic, PageText } from '../../types';
import { calculateExamReadiness, getUnifiedTopicMastery } from '../services/mastery';
import { loadCoreReadOnly, loadFeatureStore } from '../services/featureStore';
import { useFeatures } from './FeaturesProvider';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export interface ShareCardProps {
  topics: Topic[];
  pages: PageText[];
}

export const ShareCard: React.FC<ShareCardProps> = ({ topics, pages }) => {
  const { store } = useFeatures();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  const readiness = calculateExamReadiness(topics);
  const unified = getUnifiedTopicMastery(topics);
  const core = loadCoreReadOnly();

  const masteredCount = unified.filter(u => u.mastery === 'mastered').length;
  const totalTopics = topics.length;

  // Improvement between earliest attempt and latest attempt
  let improvementText = 'Baseline Diagnostic';
  if (core.attempts.length >= 2) {
    const earliest = core.attempts[core.attempts.length - 1].score;
    const latest = core.attempts[0].score;
    const diff = latest - earliest;
    improvementText = diff >= 0 ? `+${diff}% Accuracy Growth` : `${diff}% Score Shift`;
  } else if (store.practicePapers.length > 0 && core.attempts.length > 0) {
    const diff = store.practicePapers[0].score - core.attempts[0].score;
    improvementText = diff >= 0 ? `+${diff}% Practice Growth` : `${diff}% Shift`;
  }

  // Draw card on Canvas
  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 450;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
    gradient.addColorStop(1, '#312e81'); // indigo-900
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative glow rings
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width - 80, 80, 140, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(80, height - 60, 100, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Header Branding
    ctx.fillStyle = '#98473E'; // Terracotta
    ctx.fillRect(50, 45, 12, 12);

    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Thinklet', 72, 57);

    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Grounded AI Mastery & Revision Card', 72, 77);

    // 3. Readiness Score Hero Pill
    const cardX = 50;
    const cardY = 115;
    const cardW = 320;
    const cardH = 240;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText('EXAM READINESS SCORE', cardX + 24, cardY + 40);

    ctx.font = 'black 64px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${readiness.score}`, cardX + 24, cardY + 115);

    ctx.font = '22px system-ui, sans-serif';
    ctx.fillStyle = '#818cf8';
    ctx.fillText('/100', cardX + 115, cardY + 105);

    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Accuracy: ${readiness.accuracyComponent}% · Coverage: ${readiness.coverageComponent}%`, cardX + 24, cardY + 160);
    ctx.fillText(`Confidence Calibration: ${readiness.calibrationComponent}%`, cardX + 24, cardY + 185);

    // 4. Secondary Stat Blocks (Right side)
    const rightX = 400;

    // Stat Block 1: Topics Mastered
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.beginPath();
    ctx.roundRect(rightX, cardY, 350, 70, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('TOPIC MASTERY', rightX + 20, cardY + 28);
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${masteredCount} of ${totalTopics} Topics Mastered`, rightX + 20, cardY + 54);

    // Stat Block 2: Improvement
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.beginPath();
    ctx.roundRect(rightX, cardY + 85, 350, 70, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = '#c7d2fe';
    ctx.fillText('PROGRESSION TREND', rightX + 20, cardY + 113);
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(improvementText, rightX + 20, cardY + 139);

    // Stat Block 3: Streak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
    ctx.beginPath();
    ctx.roundRect(rightX, cardY + 170, 350, 70, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = '#fdba74';
    ctx.fillText('DAILY STUDY HABIT', rightX + 20, cardY + 198);
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`🔥 ${store.streak.currentStreak}-Day Active Streak`, rightX + 20, cardY + 224);

    // 5. Footer Line
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Evaluated on ${new Date().toLocaleDateString()} · Verbatim Grounded Citations`, 50, height - 35);

    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = '#98473E';
    ctx.fillText('Thinklet AI', width - 140, height - 35);
  };

  useEffect(() => {
    drawCard();
  }, [readiness.score, masteredCount, improvementText, store.streak.currentStreak]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thinklet-readiness-${readiness.score}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCopiedStatus('PNG Downloaded!');
      setTimeout(() => setCopiedStatus(null), 3000);
    }, 'image/png');
  };

  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async blob => {
        if (!blob) return;
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedStatus('Image copied to clipboard!');
            setTimeout(() => setCopiedStatus(null), 3000);
            return;
          } catch {
            // fallback to text
          }
        }

        // Fallback: copy textual summary to clipboard
        const textSummary = `Thinklet Achievement: Exam Readiness ${readiness.score}/100, ${masteredCount}/${totalTopics} topics mastered, ${improvementText}, ${store.streak.currentStreak}-day streak!`;
        await navigator.clipboard.writeText(textSummary);
        setCopiedStatus('Summary copied to clipboard!');
        setTimeout(() => setCopiedStatus(null), 3000);
      }, 'image/png');
    } catch {
      setCopiedStatus('Clipboard copy unsupported.');
      setTimeout(() => setCopiedStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>🏆</span> Progress & Exam-Readiness Share Card
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Export high-resolution achievement card with readiness score, topics mastered, and streak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyClipboard}
              className="gap-1.5"
            >
              <span>📋</span> Copy Card
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPNG}
              className="gap-1.5"
            >
              <span>⬇️</span> Download PNG
            </Button>
          </div>
        </div>

        {copiedStatus && (
          <div className="p-2.5 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 text-center animate-fadeIn">
            ✓ {copiedStatus}
          </div>
        )}

        {/* Canvas Display */}
        <div className="p-3 bg-secondary/30 border border-border rounded-xl flex justify-center overflow-x-auto">
          <canvas ref={canvasRef} className="max-w-full rounded-lg shadow-md" />
        </div>
      </Card>
    </div>
  );
};
