"use client";

import React, { useState, useEffect } from 'react';
import { Users2, Copy, Check, Target, Clock, Calendar, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { AccountabilityPartnerState } from '../types';
import {
  generateAccountabilityGoalCode,
  decodeAccountabilityGoalCode,
  getCurrentWeekLabel,
} from '../utils/collabPersonal';
import { WhyPopover } from './WhyPopover';
import { createReason } from '../utils/reasonModel';

export interface AccountabilityPartnerCardProps {
  partnerState?: AccountabilityPartnerState;
  myMinutesProgress: number;
  mySessionsProgress: number;
  userNickname: string;
  userEmoji: string;
  onUpdatePartnerState: (partner: AccountabilityPartnerState | undefined) => void;
  onDismissCheckIn: () => void;
  onShowToast?: (msg: string) => void;
}

export function AccountabilityPartnerCard({
  partnerState,
  myMinutesProgress,
  mySessionsProgress,
  userNickname,
  userEmoji,
  onUpdatePartnerState,
  onDismissCheckIn,
  onShowToast,
}: AccountabilityPartnerCardProps) {
  const [currentWeek, setCurrentWeek] = useState<string>('2026-W43');
  const [isWeekendCheckInTime, setIsWeekendCheckInTime] = useState<boolean>(false);

  useEffect(() => {
    setCurrentWeek(getCurrentWeekLabel());
    const day = new Date().getDay();
    setIsWeekendCheckInTime(day === 0 || day === 5 || day === 6);
  }, []);

  // Setup / Agreement state
  const [partnerNickname, setPartnerNickname] = useState(
    partnerState?.partnerNickname || 'Maya'
  );
  const [goalType, setGoalType] = useState<'minutes' | 'sessions'>(
    partnerState?.goalType || 'minutes'
  );
  const [target, setTarget] = useState<number>(
    partnerState?.target || 120
  );

  // Import code state
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedMyCode, setCopiedMyCode] = useState(false);
  const [myShareCode, setMyShareCode] = useState<string | null>(null);

  // Compute student progress based on agreed goal type
  const myCurrentProgress =
    goalType === 'sessions' ? mySessionsProgress : myMinutesProgress;
  const partnerCurrentProgress = partnerState?.partnerProgress || 0;

  const myPct = Math.min(100, Math.round((myCurrentProgress / (target || 1)) * 100));
  const partnerPct = Math.min(
    100,
    Math.round((partnerCurrentProgress / (target || 1)) * 100)
  );

  const handleGenerateMyCode = () => {
    const { code } = generateAccountabilityGoalCode({
      senderNickname: userNickname || 'Thinklet Scholar',
      senderEmoji: userEmoji || '🌱',
      goalType,
      target,
      currentProgress: myCurrentProgress,
      weekStartDate: currentWeek,
    });
    setMyShareCode(code);
    navigator.clipboard.writeText(code);
    setCopiedMyCode(true);
    setTimeout(() => setCopiedMyCode(false), 2500);
    if (onShowToast) {
      onShowToast('Goal progress code copied! Send it to your accountability partner.');
    }
  };

  const handleImportPartnerCode = () => {
    setImportError(null);
    if (!partnerCodeInput.trim()) {
      setImportError('Please paste your partner’s goal code.');
      return;
    }

    try {
      const decoded = decodeAccountabilityGoalCode(partnerCodeInput);
      const nextPartnerState: AccountabilityPartnerState = {
        partnerNickname: decoded.senderNickname,
        partnerEmoji: decoded.senderEmoji,
        goalType: decoded.goalType,
        target: decoded.target,
        myProgress: myCurrentProgress,
        partnerProgress: decoded.currentProgress,
        partnerLastUpdated: new Date().toISOString(),
        weekLabel: decoded.weekStartDate,
      };

      onUpdatePartnerState(nextPartnerState);
      setPartnerNickname(decoded.senderNickname);
      setGoalType(decoded.goalType);
      setTarget(decoded.target);
      setPartnerCodeInput('');
      if (onShowToast) {
        onShowToast(`Partner progress synced! ${decoded.senderNickname} is at ${decoded.currentProgress} ${decoded.goalType}.`);
      }
    } catch (err: any) {
      setImportError(err?.message || 'Invalid accountability goal code.');
    }
  };

  const handleSaveGoalAgreement = () => {
    const updated: AccountabilityPartnerState = {
      partnerNickname,
      partnerEmoji: partnerState?.partnerEmoji || '🤝',
      goalType,
      target,
      myProgress: myCurrentProgress,
      partnerProgress: partnerState?.partnerProgress || 0,
      partnerLastUpdated: partnerState?.partnerLastUpdated || new Date().toISOString(),
      weekLabel: currentWeek,
    };
    onUpdatePartnerState(updated);
    if (onShowToast) onShowToast('Weekly goal agreement updated!');
  };

  // Check if weekly check-in banner should show (e.g. today is Fri/Sat/Sun or week changed)
  const isCheckInDismissed = Boolean(partnerState?.checkInDismissedAt);
  const showCheckInBanner = Boolean(partnerState) && isWeekendCheckInTime && !isCheckInDismissed;

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--surface-hover)] text-[#98473E]">
              <Users2 className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)] font-['Quicksand',sans-serif]">
              Accountability Partner
            </h3>
            <WhyPopover
              reason={createReason(
                'Two-student agreed weekly target tracking with side-by-side progress bars',
                [
                  `Agreement: ${target} ${goalType === 'sessions' ? 'sessions' : 'minutes'} for ${currentWeek}`,
                  'Transfers ONLY progress numbers — zero quiz questions or sensitive answers',
                  'Encourages peer consistency without public rankings',
                ]
              )}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Agree on a weekly target with a study buddy and exchange progress codes to stay in lockstep
          </p>
        </div>

        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-soft)]">
          {currentWeek}
        </span>
      </div>

      {/* Weekly Check-in Banner */}
      {showCheckInBanner && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Weekly Check-in Time! </span>
              Exchange your latest progress code with {partnerNickname} to see how you both paced this week.
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateMyCode}
              className="px-3 py-1.5 rounded-lg bg-[#98473E] hover:bg-[#803B33] text-xs font-bold text-white cursor-pointer transition-colors"
            >
              Copy My Code
            </button>
            <button
              type="button"
              onClick={onDismissCheckIn}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-hover)] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Progress Visualisation */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-5">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
          <span>Weekly Goal: {target} {goalType === 'sessions' ? 'Sessions' : 'Minutes'}</span>
          <span className="text-[var(--text-muted)]">Cycle: {currentWeek}</span>
        </div>

        {/* 1. You */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>{userEmoji || '🌱'}</span>
              <span>You ({userNickname || 'Scholar'})</span>
            </span>
            <span className="font-bold text-[#98473E]">
              {myCurrentProgress} / {target} {goalType === 'sessions' ? 'sessions' : 'min'} ({myPct}%)
            </span>
          </div>
          <div className="w-full bg-[var(--surface-raised)] h-2.5 rounded-full overflow-hidden border border-[var(--border-soft)]">
            <div
              className="bg-[#98473E] h-full rounded-full transition-all duration-500"
              style={{ width: `${myPct}%` }}
            />
          </div>
        </div>

        {/* 2. Accountability Partner */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>{partnerState?.partnerEmoji || '🤝'}</span>
              <span>Partner ({partnerNickname})</span>
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {partnerCurrentProgress} / {target} {goalType === 'sessions' ? 'sessions' : 'min'} ({partnerPct}%)
            </span>
          </div>
          <div className="w-full bg-[var(--surface-raised)] h-2.5 rounded-full overflow-hidden border border-[var(--border-soft)]">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${partnerPct}%` }}
            />
          </div>
          {partnerState?.partnerLastUpdated && (
            <div className="text-[10px] text-[var(--text-muted)] text-right">
              Partner code last imported on {new Date(partnerState.partnerLastUpdated).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Code Exchange Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Share My Progress */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-3">
          <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#98473E]" />
            <span>Generate My Progress Code</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Encodes strictly your current goal progress ({myCurrentProgress} {goalType}) without any quiz answers or personal logs.
          </p>

          <button
            type="button"
            onClick={handleGenerateMyCode}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#98473E] hover:bg-[#803B33] text-xs font-bold text-white shadow-sm cursor-pointer transition-all active:scale-95"
          >
            {copiedMyCode ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Copied My Goal Code!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Generate & Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Import Partner's Progress */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-3">
          <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-[#98473E]" />
            <span>Import Partner&apos;s Progress</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={partnerCodeInput}
              onChange={(e) => setPartnerCodeInput(e.target.value)}
              placeholder="Paste THINKLET1-GOAL:... code"
              className="flex-1 p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] font-mono text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#98473E]"
            />
            <button
              type="button"
              onClick={handleImportPartnerCode}
              disabled={!partnerCodeInput.trim()}
              className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-xs font-bold text-[var(--text)] cursor-pointer disabled:opacity-50 shrink-0"
            >
              Sync
            </button>
          </div>

          {importError && (
            <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Agreement Settings Accordion */}
      <div className="pt-2 border-t border-[var(--border-soft)] space-y-3">
        <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span>Adjust Agreed Goal Quota</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              Partner Nickname
            </label>
            <input
              type="text"
              value={partnerNickname}
              onChange={(e) => setPartnerNickname(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#98473E]"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              Goal Metric
            </label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as any)}
              className="w-full mt-1 p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#98473E] cursor-pointer"
            >
              <option value="minutes">Total Minutes per Week</option>
              <option value="sessions">Study Sessions per Week</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              Weekly Target Quota
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value) || 60)}
              className="w-full mt-1 p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#98473E]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveGoalAgreement}
            className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-xs font-bold text-[var(--text)] cursor-pointer transition-colors"
          >
            Save Quota Settings
          </button>
        </div>
      </div>
    </div>
  );
}
