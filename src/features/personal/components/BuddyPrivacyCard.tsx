"use client";

import React, { useState } from 'react';
import { Shield, Copy, Check, Eye, AlertTriangle, VolumeX, Ban, User, Sparkles } from 'lucide-react';
import { BuddyPrivacyLevel, BuddyPersonalSettings } from '../types';
import { generateBuddyProgressSnapshot } from '../utils/collabPersonal';
import { WhyPopover } from './WhyPopover';
import { createReason } from '../utils/reasonModel';

export interface BuddyInfo {
  id: string;
  nickname: string;
  avatarEmoji?: string;
}

export interface BuddyPrivacyCardProps {
  buddies: BuddyInfo[];
  streak: number;
  weeklyActiveDays: number;
  masteredTopics: string[];
  userNickname: string;
  userEmoji: string;
  buddySettings: Record<string, BuddyPersonalSettings>;
  onUpdateBuddySettings: (buddyId: string, settings: Partial<BuddyPersonalSettings>) => void;
  onShowToast?: (msg: string) => void;
}

export function BuddyPrivacyCard({
  buddies,
  streak,
  weeklyActiveDays,
  masteredTopics,
  userNickname,
  userEmoji,
  buddySettings,
  onUpdateBuddySettings,
  onShowToast,
}: BuddyPrivacyCardProps) {
  const [selectedBuddyId, setSelectedBuddyId] = useState<string>(
    buddies[0]?.id || 'general'
  );
  const [privacyLevel, setPrivacyLevel] = useState<BuddyPrivacyLevel>('streak_only');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [previewJson, setPreviewJson] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const currentBuddy = buddies.find((b) => b.id === selectedBuddyId) || {
    id: 'general',
    nickname: 'Any Friend',
    avatarEmoji: '🤝',
  };

  const currentSetting = buddySettings[currentBuddy.nickname] || {
    privacyLevel: 'streak_only',
    muted: false,
    blocked: false,
  };

  const handleGenerateCode = () => {
    const snapshot = generateBuddyProgressSnapshot({
      privacyLevel,
      nickname: userNickname || 'Scholar',
      emoji: userEmoji || '🌱',
      streak,
      weeklyActiveDays,
      masteredTopics,
    });
    setGeneratedCode(snapshot.code);
    setPreviewJson(snapshot.previewJson);
    setShowPreviewModal(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onShowToast) onShowToast('Progress code copied! Ready to share.');
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--surface-hover)] text-[#98473E]">
              <Shield className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)] font-['Quicksand',sans-serif]">
              Buddy Privacy & Progress Sharing
            </h3>
            <WhyPopover
              reason={createReason(
                'Per-buddy granular disclosure levels enforcing exact zero-leakage payload compilation',
                [
                  `Selected level: ${privacyLevel.replace(/_/g, ' ')}`,
                  'Code preview guarantees student inspects raw JSON before sharing',
                ]
              )}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Choose what details each study partner can see before generating your encrypted progress snapshot
          </p>
        </div>

        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-soft)]">
          Zero Backend
        </span>
      </div>

      {/* Buddy Selector */}
      {buddies.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentBuddy.avatarEmoji || '👤'}</span>
            <div>
              <div className="text-xs font-bold text-[var(--text)]">Target Study Partner</div>
              <div className="text-[11px] text-[var(--text-muted)]">{currentBuddy.nickname}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedBuddyId}
              onChange={(e) => setSelectedBuddyId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-medium text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#98473E] cursor-pointer"
            >
              {buddies.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.avatarEmoji || '👤'} {b.nickname}
                </option>
              ))}
            </select>

            {/* Mute and Block Controls */}
            {selectedBuddyId !== 'general' && (
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateBuddySettings(currentBuddy.nickname, {
                      muted: !currentSetting.muted,
                    })
                  }
                  title={currentSetting.muted ? 'Unmute cheers from this buddy' : 'Mute cheers from this buddy'}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    currentSetting.muted
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <VolumeX className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateBuddySettings(currentBuddy.nickname, {
                      blocked: !currentSetting.blocked,
                    })
                  }
                  title={currentSetting.blocked ? 'Unblock this buddy' : 'Block all cheers and sync from this buddy'}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    currentSetting.blocked
                      ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <Ban className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3 Privacy Levels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. None */}
        <label
          className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
            privacyLevel === 'none'
              ? 'border-[#98473E] bg-[#98473E]/5 ring-1 ring-[#98473E]'
              : 'border-[var(--border-soft)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)]">None</span>
            <input
              type="radio"
              name="privacy-level"
              checked={privacyLevel === 'none'}
              onChange={() => setPrivacyLevel('none')}
              className="accent-[#98473E]"
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Minimalist presence. Shares only your avatar emoji and nickname. Zero study numbers.
          </p>
        </label>

        {/* 2. Streak only */}
        <label
          className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
            privacyLevel === 'streak_only'
              ? 'border-[#98473E] bg-[#98473E]/5 ring-1 ring-[#98473E]'
              : 'border-[var(--border-soft)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)]">Streak Only</span>
            <input
              type="radio"
              name="privacy-level"
              checked={privacyLevel === 'streak_only'}
              onChange={() => setPrivacyLevel('streak_only')}
              className="accent-[#98473E]"
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Shares your streak ({streak}d) and weekly days ({weeklyActiveDays}d). Topics remain completely private.
          </p>
        </label>

        {/* 3. Streak + Topics */}
        <label
          className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
            privacyLevel === 'streak_topics'
              ? 'border-[#98473E] bg-[#98473E]/5 ring-1 ring-[#98473E]'
              : 'border-[var(--border-soft)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)]">Streak + Topics</span>
            <input
              type="radio"
              name="privacy-level"
              checked={privacyLevel === 'streak_topics'}
              onChange={() => setPrivacyLevel('streak_topics')}
              className="accent-[#98473E]"
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Collaborative view. Shares streak plus mastered topics ({masteredTopics.length} topics) for mutual review.
          </p>
        </label>
      </div>

      {/* Action to Generate and Inspect Code */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          <span>You can review the exact raw data before copying.</span>
        </span>

        <button
          type="button"
          onClick={handleGenerateCode}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#98473E] hover:bg-[#803B33] text-xs font-bold text-white shadow-sm cursor-pointer transition-all active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Generate Progress Code</span>
        </button>
      </div>

      {/* Snapshot Preview & Disclosure Modal */}
      {showPreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[var(--text)] font-['Quicksand',sans-serif]">
                Code Content Inspection
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Verify exactly what fields are included in this code snapshot:
              </p>
            </div>

            {/* Warning Disclosure */}
            <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Irrevocable Snapshot Notice: </span>
                This code is a self-contained offline snapshot. Once you share it with a friend,
                it cannot be revoked or modified remotely.
              </div>
            </div>

            {/* Raw JSON Preview */}
            <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)] font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed text-[var(--text)]">
              <pre>{previewJson}</pre>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#98473E] hover:bg-[#803B33] text-xs font-bold text-white shadow-sm cursor-pointer transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Copied Snapshot!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Encrypted Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
