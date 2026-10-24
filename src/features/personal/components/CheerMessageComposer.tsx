"use client";

import React, { useState } from 'react';
import { Send, Heart, Copy, Check, MessageSquare, AlertCircle, Smile } from 'lucide-react';
import { CheerMessageItem } from '../types';
import {
  generateCheerCode,
  decodeCheerCode,
  MAX_CHEER_MESSAGE_LENGTH,
} from '../utils/collabPersonal';
import { WhyPopover } from './WhyPopover';
import { createReason } from '../utils/reasonModel';

export interface CheerMessageComposerProps {
  userNickname: string;
  userEmoji: string;
  cheerNotes: CheerMessageItem[];
  onImportCheer: (cheer: CheerMessageItem) => boolean;
  onClearCheers: () => void;
  onShowToast?: (msg: string) => void;
}

export function CheerMessageComposer({
  userNickname,
  userEmoji,
  cheerNotes,
  onImportCheer,
  onClearCheers,
  onShowToast,
}: CheerMessageComposerProps) {
  // Send state
  const [message, setMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌟');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Import state
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const emojiOptions = ['🌟', '🚀', '💪', '☕', '🦉', '🌱', '🧠', '🎯', '✨', '🔥'];

  const charsLeft = MAX_CHEER_MESSAGE_LENGTH - message.length;

  const handleGenerateCheer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const { code } = generateCheerCode({
        senderNickname: userNickname || 'Thinklet Scholar',
        senderEmoji: userEmoji || '🌱',
        message,
        emoji: selectedEmoji,
      });
      setGeneratedCode(code);
      if (onShowToast) onShowToast('Cheer code ready! Copy and send it to your friend.');
    } catch (err: any) {
      if (onShowToast) onShowToast(err?.message || 'Failed to create cheer code.');
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onShowToast) onShowToast('Cheer code copied to clipboard!');
  };

  const handleImport = () => {
    setImportError(null);
    setImportSuccess(null);

    if (!importCode.trim()) {
      setImportError('Please paste a Thinklet cheer code.');
      return;
    }

    try {
      const decoded = decodeCheerCode(importCode);
      const cheerItem: CheerMessageItem = {
        id: `cheer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderNickname: decoded.senderNickname,
        senderEmoji: decoded.senderEmoji,
        message: decoded.message,
        emoji: decoded.emoji,
        createdAt: decoded.createdAt,
        delivered: false,
      };

      const accepted = onImportCheer(cheerItem);
      if (accepted) {
        setImportSuccess(
          `Cheer note received from ${decoded.senderNickname}! Pip will deliver it at your next study session.`
        );
        setImportCode('');
        if (onShowToast) onShowToast('Cheer note imported! Pip is ready to speak it.');
      } else {
        setImportError(
          `Cheers from ${decoded.senderNickname} are currently blocked according to your buddy privacy settings.`
        );
      }
    } catch (err: any) {
      setImportError(err?.message || 'Invalid or malformed cheer code.');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--surface-hover)] text-[#98473E]">
              <Heart className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)] font-['Quicksand',sans-serif]">
              Peer Cheer Messages
            </h3>
            <WhyPopover
              reason={createReason(
                'Short asynchronous encouragement notes delivered by Pip during focus starts or hard days',
                [
                  'Strict 120-character plain text ceiling',
                  'Encrypted into zero-server shareable codes',
                  'Mute and block filters actively respected',
                ]
              )}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Write a quick cheer for a buddy, or paste a friend&apos;s code for Pip to deliver in your mascot bubble
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Compose Cheer */}
        <form onSubmit={handleGenerateCheer} className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
            <span className="flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-[#98473E]" />
              <span>Send a Cheer Note</span>
            </span>
            <span className={`text-[10px] font-mono ${charsLeft < 15 ? 'text-amber-500 font-bold' : 'text-[var(--text-muted)]'}`}>
              {charsLeft} chars left
            </span>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHEER_MESSAGE_LENGTH))}
            placeholder="e.g. Keep crushing the biology diagrams! You've got this!"
            rows={3}
            className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#98473E] resize-none"
          />

          {/* Emoji Picker */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Pick Reaction Emoji:
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {emojiOptions.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setSelectedEmoji(em)}
                  className={`p-1.5 rounded-lg text-base cursor-pointer transition-all ${
                    selectedEmoji === em
                      ? 'bg-[#98473E]/15 scale-110 ring-1 ring-[#98473E]'
                      : 'hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#98473E] hover:bg-[#803B33] text-xs font-bold text-white shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <span>Create Cheer Code</span>
          </button>

          {/* Generated Code Display */}
          {generatedCode && (
            <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-2 animate-fade-in">
              <div className="text-[11px] font-bold text-[var(--text)] flex items-center justify-between">
                <span>Your Cheer Code:</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-[11px] text-[#98473E] font-bold hover:underline cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface)] font-mono text-[10px] break-all border border-[var(--border-soft)] text-[var(--text-muted)]">
                {generatedCode}
              </div>
            </div>
          )}
        </form>

        {/* Right: Import Cheer Code */}
        <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[#98473E]" />
              <span>Import a Friend&apos;s Cheer</span>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Paste the cheer code sent by your study buddy. Pip will deliver it at the start of your next revision session!
            </p>

            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Paste THINKLET1-CHEER:... code here"
              rows={3}
              className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] font-mono text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#98473E] resize-none"
            />

            {importError && (
              <div className="p-2.5 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/20 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={!importCode.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-xs font-bold text-[var(--text)] shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <span>Import Cheer Code</span>
          </button>
        </div>
      </div>

      {/* Cheer Notes Archive */}
      {cheerNotes.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-[var(--border-soft)]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text)]">Recent Cheer Messages ({cheerNotes.length})</span>
            <button
              type="button"
              onClick={onClearCheers}
              className="text-[11px] text-[var(--text-muted)] hover:text-rose-600 cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {cheerNotes.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
                    <span>{c.senderEmoji}</span>
                    <span>{c.senderNickname}</span>
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {c.delivered ? 'Delivered by Pip' : 'Queued for session'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text)] italic leading-relaxed">
                  {c.emoji} &ldquo;{c.message}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
