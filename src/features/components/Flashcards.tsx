"use client";

import React, { useState } from 'react';
import { Topic, PageText } from '../../types';
import { FlashcardItem } from '../types.ext';
import {
  generateFlashcardsForWeakTopics,
  handleReviewCard,
  exportCardsToAnkiCSV
} from '../services/flashcards';
import { getUnifiedTopicMastery } from '../services/mastery';
import { useFeatures } from './FeaturesProvider';
import { useMaterial } from '@/context/MaterialContext';
import { Button } from '@/components/ui/Button';
import { CuriousPencilMascot } from '@/components/ui/illustrations';
import { logFlashcardReviewed } from '../personal'; // [PERSONAL]

export interface FlashcardsProps {
  topics: Topic[];
  pages: PageText[];
}

export const Flashcards: React.FC<FlashcardsProps> = ({ topics, pages }) => {
  const { store, settings } = useFeatures();
  const { activeMaterial } = useMaterial();

  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const currentTopicIds = new Set(topics.map(t => t.id));
  const cards = store.flashcards.filter(c =>
    c.materialId ? c.materialId === activeMaterial?.id : currentTopicIds.has(c.topicId)
  );
  const topicMap = new Map(topics.map(t => [t.id, t.name]));

  // Identify weak & learning topics
  const unified = getUnifiedTopicMastery(topics);
  const targetTopics = topics.filter(t => {
    const u = unified.find(item => item.topicId === t.id);
    return u?.mastery === 'weak' || u?.mastery === 'learning';
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateFlashcardsForWeakTopics({
        topics,
        pages,
        materialId: activeMaterial?.id,
        settings
      });
      setCurrentIdx(0);
      setIsFlipped(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (remembered: boolean) => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIdx];
    handleReviewCard(currentCard.id, remembered);
    logFlashcardReviewed(currentCard.id, remembered, currentCard.topicId); // [PERSONAL]

    setIsFlipped(false);
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      setCurrentIdx(0); // loop back
    }
  };

  const handleExportAnki = () => {
    if (cards.length === 0) return;
    const csv = exportCardsToAnkiCSV(cards, topics);

    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thinklet-flashcards-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('Anki CSV Downloaded!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch {
      // Clipboard fallback
      navigator.clipboard.writeText(csv);
      setExportStatus('Anki CSV text copied to clipboard!');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const activeCard: FlashcardItem | undefined = cards[currentIdx];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>🗂️</span> Adaptive Flashcards (Leitner Deck)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Targets weak & learning topics only. Reviews feed spaced repetition schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAnki}
              disabled={cards.length === 0}
              className="text-xs font-semibold"
            >
              <span>📥</span> Export Anki CSV
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
              loading={loading}
              className="text-xs font-semibold"
            >
              {loading ? 'Synthesizing...' : 'Generate New Deck'}
            </Button>
          </div>
        </div>

        {exportStatus && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-200 text-center animate-fadeIn">
            ✓ {exportStatus}
          </div>
        )}

        {/* Target Topics Info */}
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>
            Targeting {targetTopics.length} Weak/Learning topic(s):{' '}
            <strong className="text-[#98473E] dark:text-[#E8D8C6]">
              {targetTopics.map(t => t.name).join(', ') || 'All Topics'}
            </strong>
          </span>
          {cards.length > 0 && (
            <span className="font-mono font-semibold">
              Card {currentIdx + 1} of {cards.length}
            </span>
          )}
        </div>

        {/* FLIP CARD UI */}
        {cards.length > 0 && activeCard ? (
          <div className="space-y-6">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[220px] p-8 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/30 flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-all shadow-xs select-none thinklet-card-hover"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary uppercase tracking-wider">
                  {topicMap.get(activeCard.topicId) || activeCard.topicId}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-secondary-foreground border border-border">
                  Leitner Box {activeCard.box}
                </span>
              </div>

              <div className="py-6 text-center">
                {!isFlipped ? (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Prompt / Question
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {activeCard.front}
                    </h3>
                    <span className="text-[11px] text-[#98473E] dark:text-[#E8D8C6] font-medium mt-4 block">
                      (Click to flip card ↺)
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-[#7F9274] uppercase tracking-wider block mb-2">
                      Answer & Grounding
                    </span>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {activeCard.back}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 text-center">
                Syllabus Page {activeCard.page} · Space / Click to Flip
              </div>
            </div>

            {/* Answer Assessment Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                type="button"
                onClick={() => handleAnswer(false)}
                className="h-11 border-destructive/30 hover:bg-destructive/10 text-destructive text-xs font-semibold gap-2"
              >
                <span>↺</span> Not yet (Back to Box 1)
              </Button>
              <Button
                variant="default"
                size="lg"
                type="button"
                onClick={() => handleAnswer(true)}
                className="h-11 bg-[#7F9274] hover:bg-[#6E8064] text-white text-xs font-semibold shadow-xs gap-2"
              >
                <span>✓</span> I knew it! (Promote Box)
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-center">
              <CuriousPencilMascot size="lg" className="animate-gentle-bounce" />
            </div>
            <p className="text-sm font-bold text-foreground">No flashcards in your active deck yet</p>
            <p className="max-w-md mx-auto text-muted-foreground text-xs">
              Click &quot;Generate New Deck&quot; to synthesize active recall cards targeted specifically to your weak and learning topics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
