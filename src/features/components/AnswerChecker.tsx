"use client";

import React, { useState } from 'react';
import { Topic, PageText } from '../../types';
import { contextOf } from '../../utils/verify';
import { checkAnswer } from '../services/checker';
import { AnswerCheckRecord } from '../types.ext';
import { useFeatures } from './FeaturesProvider';
import { useMaterial } from '@/context/MaterialContext';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

export interface AnswerCheckerProps {
  topics: Topic[];
  pages: PageText[];
  initialTopicId?: string;
  initialMode?: 'qa' | 'teach_back';
}

export const AnswerChecker: React.FC<AnswerCheckerProps> = ({
  topics,
  pages,
  initialTopicId,
  initialMode = 'qa'
}) => {
  const { settings, store } = useFeatures();
  const { activeMaterial } = useMaterial();

  const [mode, setMode] = useState<'qa' | 'teach_back'>(initialMode);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || topics[0]?.id || '');
  const [question, setQuestion] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnswerCheckRecord | null>(null);

  React.useEffect(() => {
    if (!topics.some(t => t.id === selectedTopicId) && topics[0]) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  const selectedTopic = topics.find(t => t.id === selectedTopicId) || topics[0];

  const handleEvaluate = async () => {
    if (!studentAnswer.trim()) return;
    setLoading(true);

    const effectiveTopic = selectedTopic;
    const context = effectiveTopic ? contextOf(effectiveTopic, pages) : pages.map(p => p.text).join('\n\n');
    const effectiveQuestion = mode === 'teach_back'
      ? `Explain the concept of "${effectiveTopic?.name || 'this topic'}" in detail in your own words.`
      : question.trim() || `Explain key concepts related to ${effectiveTopic?.name || 'the material'}.`;

    try {
      const evaluation = await checkAnswer({
        question: effectiveQuestion,
        studentAnswer,
        context,
        pages,
        topicId: effectiveTopic?.id,
        materialId: activeMaterial?.id,
        isTeachBack: mode === 'teach_back',
        settings
      });
      setResult(evaluation);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setResult(null);
  };

  const handleClear = () => {
    setQuestion('');
    setStudentAnswer('');
    setResult(null);
  };

  const verdictStyles = {
    correct: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    partial: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    incorrect: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-xs">
        {/* Header & Mode Switcher */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>✍️</span> Grounded Answer Checker & Teach-Back
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Evaluates your typed reasoning strictly against verbatim quotes from your syllabus.
            </p>
          </div>

          <div className="flex bg-secondary/50 p-1 rounded-lg text-xs font-semibold border border-border">
            <button
              onClick={() => { setMode('qa'); setResult(null); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === 'qa'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Q&A Check
            </button>
            <button
              onClick={() => { setMode('teach_back'); setResult(null); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === 'teach_back'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🗣️ Teach-Back Mode
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          {/* Topic Selector */}
          <div>
            <label htmlFor="check-topic-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Topic
            </label>
            <select
              id="check-topic-select"
              value={selectedTopicId}
              onChange={e => setSelectedTopicId(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} (Pages {t.pages.join(', ')})
                </option>
              ))}
            </select>
          </div>

          {mode === 'qa' && (
            <div>
              <label htmlFor="check-question-input" className="block text-xs font-semibold text-foreground mb-1">
                Question / Prompt
              </label>
              <Input
                id="check-question-input"
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. What is the role of RuBisCO in the Calvin Cycle?"
                className="w-full text-xs sm:text-sm"
              />
            </div>
          )}

          {mode === 'teach_back' && selectedTopic && (
            <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
              <span className="font-semibold block mb-0.5">Teach-Back Challenge:</span>
              Imagine explaining <strong className="underline">{selectedTopic.name}</strong> to a peer who has never studied it before. Include the mechanism, what goes in, what comes out, and key components.
            </div>
          )}

          <div>
            <label htmlFor="check-student-answer" className="block text-xs font-semibold text-foreground mb-1">
              Your Written Explanation / Answer
            </label>
            <Textarea
              id="check-student-answer"
              rows={4}
              value={studentAnswer}
              onChange={e => setStudentAnswer(e.target.value)}
              placeholder={
                mode === 'teach_back'
                  ? 'Type your explanation here in your own words...'
                  : 'Write your answer to the question...'
              }
              className="w-full text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear inputs
            </button>
            <Button
              variant="default"
              size="sm"
              onClick={handleEvaluate}
              disabled={loading || !studentAnswer.trim()}
              loading={loading}
              className="text-xs font-semibold"
            >
              {loading ? 'Analyzing with Grounding...' : 'Evaluate My Answer'}
            </Button>
          </div>
        </div>

        {/* Evaluation Output Result */}
        {result && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${verdictStyles[result.verdict]}`}>
                  {result.verdict}
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Score: {Math.round(result.score * 100)}%
                </span>
              </div>
              <button
                onClick={handleTryAgain}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Try Again ↺
              </button>
            </div>

            {/* Grounding Verification Alert */}
            {!result.verified ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200">
                <span className="font-semibold block mb-0.5">⚠️ Unverified Evidence:</span>
                I can't check this against your material. The supporting fact could not be confirmed verbatim in the uploaded pages.
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold block mb-0.5">
                  ✓ Verified Textbook Evidence (Page {result.page}):
                </span>
                <blockquote className="italic border-l-2 border-emerald-500 pl-2 mt-1">
                  "{result.evidenceQuote}"
                </blockquote>
              </div>
            )}

            {/* Misconception Alert if any */}
            {result.misconception && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-900 dark:text-rose-200">
                <span className="font-bold flex items-center gap-1 mb-1">
                  <span>💡</span> Potential Misconception:
                </span>
                <p>{result.misconception}</p>
              </div>
            )}

            {/* Missing Key Points */}
            {result.missingPoints.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Missing Critical Points (Page {result.page}):
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {result.missingPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternative ways to phrase */}
            {result.alternatives.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Alternative Model Answers / Formulations:
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  {result.alternatives.map((alt, i) => (
                    <li key={i} className="italic">• "{alt}"</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
