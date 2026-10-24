// [PERSONAL] Commute Mode Dialog: Audio-first study screen with big tactile buttons, Wake Lock & Media Session
"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  X,
  Sparkles,
  Zap,
  BookOpen,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { CommuteAudioItem } from '../types';
import { AudioCommuteController } from '../services/audioCommuteService';
import { WhyPopover } from './WhyPopover';

export interface CommuteModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcardItems?: CommuteAudioItem[];
  noteItems?: CommuteAudioItem[];
  weakTopicItems?: CommuteAudioItem[];
}

export function CommuteModeDialog({
  isOpen,
  onClose,
  flashcardItems = [],
  noteItems = [],
  weakTopicItems = [],
}: CommuteModeDialogProps) {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'notes' | 'weak_topics'>('flashcards');
  const [speed, setSpeed] = useState<number>(1.0);
  const [playerState, setPlayerState] = useState<{
    isPlaying: boolean;
    currentIndex: number;
    currentItem: CommuteAudioItem | null;
    total: number;
  }>({
    isPlaying: false,
    currentIndex: 0,
    currentItem: null,
    total: 0,
  });

  const controllerRef = useRef<AudioCommuteController | null>(null);

  // Determine current active playlist
  const currentPlaylist =
    activeTab === 'flashcards'
      ? flashcardItems
      : activeTab === 'notes'
      ? noteItems
      : weakTopicItems;

  // Initialize or update controller when playlist changes
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new AudioCommuteController(currentPlaylist, (state) => {
        setPlayerState(state);
      });
    } else {
      controllerRef.current.setItems(currentPlaylist);
    }
  }, [activeTab, currentPlaylist]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen && controllerRef.current) {
      controllerRef.current.stop();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlayPause = () => {
    if (!controllerRef.current) return;
    if (playerState.isPlaying) {
      controllerRef.current.pause();
    } else {
      controllerRef.current.play();
    }
  };

  const handleNext = () => {
    controllerRef.current?.next();
  };

  const handlePrevious = () => {
    controllerRef.current?.previous();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    controllerRef.current?.setSpeed(newSpeed);
  };

  const currentItem = playerState.currentItem || currentPlaylist[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Commute Mode audio player"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in text-left"
    >
      <div className="w-full max-w-md rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-clay-card)] p-6 sm:p-8 space-y-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#98473E]/10 text-[#98473E]">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#98473E]">
                  Commute Mode
                </span>
                <WhyPopover
                  reason={{
                    rule: 'Hands-free audio study flow',
                    data: [
                      'Screen Wake Lock keeps display awake',
                      'Media Session API integrates with hardware play/pause buttons',
                      'Web Speech synthesis reads questions and pauses before answers',
                    ],
                  }}
                  title="Audio Commute Player"
                />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)]">Hands-Free Audio Study</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close commute mode"
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Playlist Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-soft)]">
          {(
            [
              { id: 'flashcards', label: 'Flashcards', icon: Zap },
              { id: 'notes', label: 'Key Notes', icon: BookOpen },
              { id: 'weak_topics', label: 'Priority', icon: HelpCircle },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  controllerRef.current?.stop();
                  setActiveTab(tab.id);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#98473E] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Current Card Visual Display */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--surface-raised)] to-[var(--surface)] border border-[var(--border)] min-h-[180px] flex flex-col justify-between text-center space-y-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span className="uppercase tracking-wider">
              {currentItem?.type?.replace('_', ' ') || 'Card'}
            </span>
            <span>
              {playerState.total > 0
                ? `${playerState.currentIndex + 1} of ${playerState.total}`
                : currentPlaylist.length > 0
                ? `1 of ${currentPlaylist.length}`
                : 'Empty Playlist'}
            </span>
          </div>

          <div className="my-auto space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-['Quicksand',sans-serif] leading-snug">
              {currentItem?.title || 'No study items loaded in this playlist.'}
            </h3>
            {currentItem?.detail && (
              <p className="text-xs text-[var(--text-muted)] line-clamp-3">
                {currentItem.detail}
              </p>
            )}
          </div>

          {/* Sound wave animation indicator when playing */}
          <div className="flex items-center justify-center gap-1 h-4">
            {[1, 2, 3, 4, 5].map((bar) => (
              <span
                key={bar}
                className={`w-1 rounded-full bg-[#98473E] transition-all duration-300 ${
                  playerState.isPlaying
                    ? `h-${bar * 2 + 2} animate-pulse`
                    : 'h-1.5 opacity-30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Large Tactile Transport Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrevious}
            aria-label="Previous item"
            className="p-4 rounded-2xl bg-[var(--surface-raised)] text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border-soft)] transition-transform active:scale-95 cursor-pointer shadow-xs"
          >
            <SkipBack className="h-6 w-6" />
          </button>

          {/* Huge Central Play / Pause Button */}
          <button
            type="button"
            onClick={handlePlayPause}
            aria-label={playerState.isPlaying ? 'Pause speech' : 'Play speech'}
            className="p-6 rounded-3xl bg-[#98473E] text-white hover:bg-[#823C34] transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center justify-center"
          >
            {playerState.isPlaying ? (
              <Pause className="h-8 w-8 fill-current" />
            ) : (
              <Play className="h-8 w-8 fill-current ml-1" />
            )}
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next item"
            className="p-4 rounded-2xl bg-[var(--surface-raised)] text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border-soft)] transition-transform active:scale-95 cursor-pointer shadow-xs"
          >
            <SkipForward className="h-6 w-6" />
          </button>
        </div>

        {/* Speed Controls & Wake Lock Status */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-soft)] text-xs">
          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">Wake Lock Active</span>
          </div>

          <div className="flex items-center gap-1 bg-[var(--surface-raised)] p-1 rounded-xl border border-[var(--border-soft)]">
            {[0.75, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                  speed === s
                    ? 'bg-[#98473E] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
