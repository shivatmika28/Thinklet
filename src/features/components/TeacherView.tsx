"use client";

import React, { useState } from 'react';
import { Topic } from '../../types';
import {
  generateProgressCode,
  decodeProgressCode,
  StudentProgressSnapshot
} from '../services/progressCode';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';

export interface TeacherViewProps {
  topics: Topic[];
}

export const TeacherView: React.FC<TeacherViewProps> = ({ topics }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'portal'>('export');
  const [pastedCode, setPastedCode] = useState('');
  const [inspectedData, setInspectedData] = useState<StudentProgressSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const studentCode = generateProgressCode(topics);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(studentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleInspect = () => {
    setErrorMessage(null);
    if (!pastedCode.trim()) {
      setErrorMessage('Please paste a progress code.');
      return;
    }

    const decoded = decodeProgressCode(pastedCode);
    if (!decoded) {
      setErrorMessage('Invalid or corrupted progress code. Please check the code and try again.');
      setInspectedData(null);
    } else {
      setInspectedData(decoded);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>👨‍🏫</span> Teacher & Parent Progress Portal
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Zero backend, zero accounts: portable compressed base64 progress codes for parent/teacher accountability.
            </p>
          </div>

          <div className="flex bg-secondary/40 p-1 rounded-lg text-xs font-semibold border border-border">
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'export'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Student Code
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'portal'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Teacher / Parent View
            </button>
          </div>
        </div>

        {/* TAB 1: STUDENT PROGRESS CODE EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground">
              <span className="font-bold text-foreground block mb-1">Share your progress with parents or instructors:</span>
              Copy this secure one-line progress snapshot code and send it over WhatsApp, email, or your LMS. It encodes your readiness score, streak, and mastered topics without requiring an account.
            </div>

            <div>
              <label htmlFor="student-code-box" className="block text-xs font-semibold text-foreground mb-1">
                Your Progress Code:
              </label>
              <Textarea
                id="student-code-box"
                readOnly
                value={studentCode}
                rows={3}
                className="w-full text-xs font-mono select-all"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleCopyCode}
                size="sm"
                className="gap-1.5"
              >
                <span>📋</span> {copied ? 'Copied to Clipboard!' : 'Copy Progress Code'}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: TEACHER / PARENT INSPECTOR */}
        {activeTab === 'portal' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="teacher-paste-box" className="block text-xs font-semibold text-foreground">
                Paste Student's Progress Code:
              </label>
              <Textarea
                id="teacher-paste-box"
                rows={3}
                value={pastedCode}
                onChange={e => setPastedCode(e.target.value)}
                placeholder="Paste code starting with LM1-..."
                className="w-full text-xs font-mono"
              />

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setPastedCode(studentCode)}
                  className="text-xs text-primary hover:underline"
                >
                  (Demo: Load current session code)
                </button>
                <Button
                  onClick={handleInspect}
                  size="sm"
                >
                  Inspect Student Progress
                </Button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-destructive/15 border border-destructive/30 text-destructive rounded-lg text-xs font-medium">
                  ⚠️ {errorMessage}
                </div>
              )}
            </div>

            {/* Read-Only Student Report Card */}
            {inspectedData && (
              <div className="mt-6 p-6 rounded-xl border border-border bg-secondary/30 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                      Verified Student Report Card
                    </span>
                    <h3 className="text-base font-bold text-foreground">
                      Academic Readiness Snapshot
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Exported: {inspectedData.exportedDate}
                  </span>
                </div>

                {/* Score Hero */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Readiness</span>
                    <span className="text-2xl font-black text-primary">
                      {inspectedData.readinessScore}%
                    </span>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Accuracy</span>
                    <span className="text-2xl font-black text-foreground">
                      {inspectedData.accuracy}%
                    </span>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Study Streak</span>
                    <span className="text-2xl font-black text-primary">
                      🔥 {inspectedData.currentStreak}d
                    </span>
                  </div>
                  <div className="p-3 bg-card rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Assessments</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {inspectedData.practicePaperCount + inspectedData.answerCheckCount}
                    </span>
                  </div>
                </div>

                {/* Topic Mastery Distribution */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block mb-1">
                      ✓ Mastered Topics ({inspectedData.masteredTopicNames.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedData.masteredTopicNames.map((name, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 font-medium">
                          {name}
                        </span>
                      ))}
                      {inspectedData.masteredTopicNames.length === 0 && (
                        <span className="text-xs text-muted-foreground">No topics fully mastered yet.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-rose-400 block mb-1">
                      ⚠️ Weak / Priority Review Topics ({inspectedData.weakTopicNames.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedData.weakTopicNames.map((name, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded bg-destructive/15 text-weak font-medium">
                          {name}
                        </span>
                      ))}
                      {inspectedData.weakTopicNames.length === 0 && (
                        <span className="text-xs text-muted-foreground">All topics are learning or mastered!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Teacher / Parent Recommendation */}
                <div className="p-3.5 bg-secondary/50 border border-border rounded-lg text-xs text-muted-foreground">
                  <span className="font-bold text-foreground block mb-0.5">Pedagogical Recommendation:</span>
                  {inspectedData.weakTopicNames.length > 0 ? (
                    <span>
                      Focus homework and guided inquiry on{' '}
                      <strong className="text-foreground">{inspectedData.weakTopicNames.join(', ')}</strong>. Encourage the student to complete a Practice Paper in Teach-Back mode.
                    </span>
                  ) : (
                    <span>
                      The student demonstrates excellent retention across all syllabus topics. Maintain spaced repetition reviews to preserve exam calibration.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
