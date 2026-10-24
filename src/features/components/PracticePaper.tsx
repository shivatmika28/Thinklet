"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Topic, PageText } from '../../types';
import { QuestionLevel, QuestionX, PracticePaperResult } from '../types.ext';
import { generatePracticePaper, gradePracticePaper, PaperGradingResult } from '../services/paper';
import { useFeatures } from './FeaturesProvider';
import { useMaterial } from '@/context/MaterialContext';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

export interface PracticePaperProps {
  topics: Topic[];
  pages: PageText[];
  weakTopicIds?: string[];
  onCompleted?: (result: PracticePaperResult) => void;
}

export const PracticePaper: React.FC<PracticePaperProps> = ({
  topics,
  pages,
  weakTopicIds = [],
  onCompleted
}) => {
  const { settings } = useFeatures();
  const { activeMaterial } = useMaterial();

  // Topic selection: Default to weak topics if available, otherwise all
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() => {
    if (weakTopicIds.length > 0) return weakTopicIds;
    return topics.map(t => t.id);
  });

  useEffect(() => {
    setSelectedTopicIds(topics.map(t => t.id));
  }, [topics]);

  const [level, setLevel] = useState<QuestionLevel>('Mixed');
  const [timedMode, setTimedMode] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuestionX[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<PaperGradingResult | null>(null);

  // Timed mode state
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleTopic = (id: string) => {
    if (selectedTopicIds.includes(id)) {
      if (selectedTopicIds.length === 1) return; // keep at least 1
      setSelectedTopicIds(selectedTopicIds.filter(t => t !== id));
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGradingResult(null);
    setAnswers({});
    setActiveQuestionIdx(0);

    try {
      const generated = await generatePracticePaper({
        topics,
        pages,
        level,
        selectedTopicIds,
        materialId: activeMaterial?.id,
        settings
      });
      setQuestions(generated);
      if (timedMode) {
        setTimeLeft(getQuestionTime(generated[0]?.section));
      }
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTime = (section?: string) => {
    if (section === 'A' || section === 'B') return 40;
    if (section === 'C') return 60;
    return 90;
  };

  // Timed mode countdown
  useEffect(() => {
    if (!timedMode || questions.length === 0 || gradingResult || grading) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(getQuestionTime(questions[activeQuestionIdx]?.section));
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Advance question
          if (activeQuestionIdx < questions.length - 1) {
            setActiveQuestionIdx(i => i + 1);
            return getQuestionTime(questions[activeQuestionIdx + 1]?.section);
          } else {
            clearInterval(timerRef.current!);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timedMode, questions, activeQuestionIdx, gradingResult, grading]);

  const handleSubmitPaper = async () => {
    if (questions.length === 0) return;
    setGrading(true);
    try {
      const res = await gradePracticePaper(questions, answers, pages, topics, activeMaterial?.id, settings);
      setGradingResult(res);
      if (onCompleted) {
        onCompleted(res.paperResult);
      }
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Configuration Panel */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>📝</span> Practice Paper Generator
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Structured exam format: Section A (MCQ), B (True/False), C (Fill-in), D (Short Answer).
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerate}
            disabled={loading || selectedTopicIds.length === 0}
            loading={loading}
            className="text-xs font-semibold"
          >
            {loading ? 'Crafting Grounded Paper...' : 'Generate Practice Paper'}
          </Button>
        </div>

        {/* Configurations */}
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          {/* Topic Select */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Topics to Test (Weak topics prioritized):
            </span>
            <div className="flex flex-wrap gap-2">
              {topics.map(t => {
                const isSelected = selectedTopicIds.includes(t.id);
                const isWeak = weakTopicIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopic(t.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{t.name}</span>
                    {isWeak && (
                      <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.2 rounded font-bold uppercase">
                        Weak
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Level Select */}
            <div>
              <label htmlFor="paper-level-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Examination Level
              </label>
              <select
                id="paper-level-select"
                value={level}
                onChange={e => setLevel(e.target.value as QuestionLevel)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Mixed">Mixed (Standard Board / Exam Prep)</option>
                <option value="Easy">Easy (Foundational & Definitions)</option>
                <option value="Medium">Medium (Application & Mechanisms)</option>
                <option value="Hard">Hard (Synthesis & Analysis)</option>
              </select>
            </div>

            {/* Timed Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <label htmlFor="paper-timed-toggle" className="text-xs font-semibold text-slate-800 dark:text-slate-200 block cursor-pointer">
                  Timed Rapid-Fire Mode
                </label>
                <span className="text-[11px] text-slate-500">
                  Per-question countdown timer (40s - 90s)
                </span>
              </div>
              <input
                id="paper-timed-toggle"
                type="checkbox"
                checked={timedMode}
                onChange={e => setTimedMode(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions List or Timed Question View */}
      {questions.length > 0 && !gradingResult && (
        <div className="space-y-6">
          {timedMode && (
            <div className="bg-indigo-600 text-white rounded-xl p-4 flex items-center justify-between shadow">
              <div className="flex items-center gap-3">
                <span className="text-xl">⏱</span>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider opacity-90">
                    Question {activeQuestionIdx + 1} of {questions.length}
                  </span>
                  <div className="text-sm font-semibold">
                    {questions[activeQuestionIdx]?.targets}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">{timeLeft}s</span>
                <span className="block text-[10px] opacity-80">Remaining</span>
              </div>
            </div>
          )}

          {/* Render questions */}
          {(timedMode ? [questions[activeQuestionIdx]] : questions).map((q, idx) => {
            const actualIdx = timedMode ? activeQuestionIdx : idx;
            const currentVal = answers[q.id];

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
              >
                {/* Header row with labels */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Section {q.section}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Q{actualIdx + 1} ({q.marks} {q.marks === 1 ? 'Mark' : 'Marks'})
                    </span>
                  </div>

                  {/* Required Target Label */}
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                    {q.targets}
                  </span>
                </div>

                {/* Question text */}
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {q.text}
                </p>

                {/* Question Input based on section */}
                {q.section === 'A' && (
                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          currentVal === optIdx
                            ? 'bg-indigo-50 border-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-600 font-medium'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`paper-q-${q.id}`}
                          checked={currentVal === optIdx}
                          onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-800 dark:text-slate-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.section === 'B' && (
                  <div className="flex gap-3 pt-1">
                    {['True', 'False'].map((tf, tfIdx) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: tfIdx })}
                        className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold border transition-all ${
                          currentVal === tfIdx
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                )}

                {q.section === 'C' && (
                  <div className="pt-1">
                    <Input
                      type="text"
                      value={typeof currentVal === 'string' ? currentVal : ''}
                      onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                      placeholder="Type your word/phrase for the blank..."
                      className="w-full text-xs"
                    />
                  </div>
                )}

                {q.section === 'D' && (
                  <div className="pt-1">
                    <Textarea
                      rows={3}
                      value={typeof currentVal === 'string' ? currentVal : ''}
                      onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                      placeholder="Write your concise, grounded conceptual answer..."
                      className="w-full text-xs"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Timed mode nav / Submit Button */}
          <div className="flex items-center justify-between pt-2">
            {timedMode && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={activeQuestionIdx === 0}
                  onClick={() => setActiveQuestionIdx(i => Math.max(0, i - 1))}
                  className="px-3 py-1.5 text-xs rounded bg-slate-200 dark:bg-slate-800 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activeQuestionIdx === questions.length - 1}
                  onClick={() => setActiveQuestionIdx(i => Math.min(questions.length - 1, i + 1))}
                  className="px-3 py-1.5 text-xs rounded bg-slate-200 dark:bg-slate-800 disabled:opacity-40"
                >
                  Next Q →
                </button>
              </div>
            )}

            <button
              onClick={handleSubmitPaper}
              disabled={grading}
              className="ml-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm focus:ring-2 focus:ring-emerald-500 transition-colors"
            >
              {grading ? 'Evaluating Answers & Grounding...' : 'Submit & Grade Practice Paper'}
            </button>
          </div>
        </div>
      )}

      {/* Scorecard & Detailed Review */}
      {gradingResult && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Practice Paper Scorecard
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Level: {gradingResult.paperResult.level} · Scored: {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {gradingResult.paperResult.score}%
                  </span>
                  <span className="block text-xs font-semibold text-slate-500">
                    {gradingResult.paperResult.scoredMarks} / {gradingResult.paperResult.totalMarks} Marks
                  </span>
                </div>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  New Paper
                </button>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detailed Question Review & Grounded Evidence
              </h4>

              {gradingResult.questionDetails.map((det, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${
                    det.isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                      : 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Q{i + 1} ({det.question.section}) · Marks: {det.scoredMarks}/{det.question.marks}
                    </span>
                    <span className="text-[11px] text-slate-500">{det.question.targets}</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {det.question.text}
                  </p>

                  <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="font-medium text-slate-500">Your Answer:</span>{' '}
                      <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {String(det.userAnswer)}
                      </span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Feedback:</span> {det.feedback}
                    </div>

                    <div className="pt-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <span className="font-semibold">Textbook Quote (Page {det.question.page}):</span>{' '}
                      <em>"{det.question.quote}"</em>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
