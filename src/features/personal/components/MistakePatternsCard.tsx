"use client";

import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import {
  MistakePatternItem,
  WrongAnswerSample,
  CachedMistakeAnalysis,
} from '../types';
import { WhyPopover } from './WhyPopover';
import { createReason } from '../utils/reasonModel';
import { analyzeMistakesWithGemini, analyzeMistakePatternsFromCode } from '../utils/insightsAnalysis';

export interface MistakePatternsCardProps {
  wrongAnswers: WrongAnswerSample[];
  cachedAnalysis?: CachedMistakeAnalysis;
  onSaveAnalysis: (analysis: CachedMistakeAnalysis) => void;
  onShowToast?: (msg: string) => void;
}

export function MistakePatternsCard({
  wrongAnswers,
  cachedAnalysis,
  onSaveAnalysis,
  onShowToast,
}: MistakePatternsCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(null);

  // Use cached AI analysis if available, otherwise pure code analysis
  const patterns: MistakePatternItem[] =
    cachedAnalysis?.patterns && cachedAnalysis.patterns.length > 0
      ? cachedAnalysis.patterns
      : analyzeMistakePatternsFromCode(wrongAnswers);

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeMistakesWithGemini(wrongAnswers);
      onSaveAnalysis(result);
      if (onShowToast) {
        onShowToast('Mistake patterns analyzed and cached!');
      }
    } catch (err: any) {
      console.error('Failed to run AI mistake analysis:', err);
      if (onShowToast) {
        onShowToast('Error analyzing mistakes: ' + (err?.message || 'Check connection'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPatternId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-5">
      {/* Header with trigger button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--surface-hover)] text-[#98473E]">
              <Brain className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)] font-['Quicksand',sans-serif]">
              Mistake Patterns & Blindspots
            </h3>
            <WhyPopover
              reason={createReason(
                'Pattern recognition grouped across diagnostic question attempts and misconception tags',
                [
                  `Analyzed ${wrongAnswers.length} recorded mistake samples`,
                  cachedAnalysis ? 'Grounded AI schema diagnosis active' : 'Deterministic code heuristic active',
                ]
              )}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Identifies recurring cognitive traps and negative-phrasing errors with concrete remediation
          </p>
        </div>

        {/* User-Triggered "Analyse my mistakes" Button */}
        <button
          type="button"
          onClick={handleRunAiAnalysis}
          disabled={isAnalyzing || wrongAnswers.length === 0}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#98473E] hover:bg-[#803B33] active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing Stems...</span>
            </>
          ) : cachedAnalysis ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-analyse with Gemini</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Analyse My Mistakes</span>
            </>
          )}
        </button>
      </div>

      {cachedAnalysis?.analyzedAt && (
        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span>
            AI Analysis cached on {new Date(cachedAnalysis.analyzedAt).toLocaleDateString()} (based on {cachedAnalysis.totalWrongAnalyzed} recent mistakes)
          </span>
        </div>
      )}

      {/* Patterns List */}
      <div className="space-y-3">
        {patterns.map((item) => {
          const isExpanded = expandedPatternId === item.id;
          const badgeColors =
            item.frequency === 'frequent'
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900'
              : item.frequency === 'recurring'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900';

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-3 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-[var(--text)]">
                      {item.pattern}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeColors}`}
                    >
                      {item.frequency}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    <span className="font-semibold text-[var(--text)]">Remedy: </span>
                    {item.remedy}
                  </p>
                </div>

                {item.exampleQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors shrink-0"
                    aria-label={isExpanded ? 'Collapse evidence' : 'Expand evidence'}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {/* Expandable Example Questions Evidence */}
              {isExpanded && item.exampleQuestions.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-soft)] space-y-2 animate-fade-in">
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Evidence Questions:
                  </div>
                  <ul className="space-y-1.5 text-xs text-[var(--text)]">
                    {item.exampleQuestions.map((q, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-soft)] font-mono text-[11px] leading-relaxed"
                      >
                        &ldquo;{q}&rdquo;
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
