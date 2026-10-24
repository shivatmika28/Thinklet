// [PERSONAL] Mascot with a Memory Tab: Personality sliders, Speech Synthesis, Wardrobe & Memory Management
"use client";

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  Award,
  Flame,
  Zap,
  RotateCcw,
  Check,
  Lock,
  Sliders,
  Brain,
  Play,
  Square,
  Smile,
  ShieldAlert,
} from 'lucide-react';
import { usePersonalStore } from '../services/personalStore';
import { StudyBuddyMascot } from '@/components/ui/StudyBuddyMascot';
import { MascotOutfitOverlay } from './MascotOutfitOverlay';
import { WhyPopover } from './WhyPopover';
import { resolveMascotSpeech } from '../utils/mascotSpeech';
import { OUTFIT_CATALOG, isOutfitUnlocked, OutfitCategory } from '../utils/outfits';
import {
  getAvailableVoices,
  speakMascotLine,
  stopSpeaking,
  SpeechVoiceOption,
} from '../services/speechSynthesisService';

export function MascotTab() {
  const {
    store,
    effectivePersonality,
    updatePersonality,
    updateMascotOutfit,
    deleteMascotMemory,
    clearAllMascotMemories,
    effectiveCelebrationIntensity,
  } = usePersonalStore();

  const [activeCategory, setActiveCategory] = useState<OutfitCategory>('hat');
  const [voices, setVoices] = useState<SpeechVoiceOption[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load browser voices on mount
  useEffect(() => {
    getAvailableVoices().then((loaded) => {
      setVoices(loaded);
    });
  }, []);

  // Compute student level from events or badges
  const userLevel = Math.max(1, Math.floor((store.events.length || 0) / 10) + 1);

  // Resolve current preview speech item
  const previewSpeech = resolveMascotSpeech({
    personality: effectivePersonality,
    memories: store.mascotMemories,
    relaxMode: store.relaxMode,
    isHardDay: false,
    streak: 3,
  });

  const handleTestSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speakMascotLine(previewSpeech.text, {
      language: effectivePersonality.language,
      speed: effectivePersonality.voiceSpeed,
      voiceName: effectivePersonality.selectedVoiceName,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const getToneLabel = (val: number, left: string, right: string) => {
    if (val < 35) return `${left} Focus`;
    if (val > 65) return `${right} Focus`;
    return 'Balanced';
  };

  const filteredVoices = voices.filter((v) => {
    if (effectivePersonality.language === 'hi') {
      return (
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.lang.includes('IN')
      );
    }
    return v.lang.toLowerCase().startsWith('en');
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Live Preview Card */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-[var(--surface-raised)] to-[var(--surface-hover)] border border-[var(--border)] shadow-[var(--shadow-clay-card)]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Mascot Live Avatar with Outfits */}
          <div className="relative shrink-0 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-inner flex items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <StudyBuddyMascot
                mood={previewSpeech.mood || 'happy'}
                size="xl"
                interactive={true}
                withSparkles={effectiveCelebrationIntensity !== 'off'}
              />
              <MascotOutfitOverlay outfit={store.mascotOutfit} />
            </div>
          </div>

          {/* Current Speech Bubble & Controls */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#98473E] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Pip's Live Voice</span>
                </span>
                <WhyPopover reason={previewSpeech.reason} title="Why Pip speaks this way" />
              </div>

              {store.relaxMode && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Calm Tone (Relax Mode)
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)] text-sm text-[var(--text)] font-medium leading-relaxed relative">
              <p>"{previewSpeech.text}"</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestSpeech}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#98473E] text-white hover:bg-[#823C34] transition-colors shadow-sm cursor-pointer"
              >
                {isSpeaking ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Listen to Pip</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-[var(--text-muted)]">
                Language:{' '}
                <span className="font-semibold text-[var(--text)]">
                  {effectivePersonality.language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}
                </span>
                {' • '}
                Speed:{' '}
                <span className="font-semibold text-[var(--text)]">
                  {effectivePersonality.voiceSpeed}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personality Sliders */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-6">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#98473E]" />
          <h3 className="text-base font-bold text-[var(--text)]">
            Mascot Personality Sliders
          </h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Tune Pip's character to match your study preferences. Personality dynamically alters the
          warmth, tone, phrasing, and speech pacing across the app.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Slider 1: Cheerful to Calm */}
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--text)]">Tone: Cheerful ↔ Calm</span>
              <span className="text-[#98473E] font-bold">
                {getToneLabel(effectivePersonality.cheerfulCalm, 'Cheerful', 'Calm')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={effectivePersonality.cheerfulCalm}
              disabled={store.relaxMode}
              onChange={(e) =>
                updatePersonality({ cheerfulCalm: parseInt(e.target.value, 10) })
              }
              aria-label="Personality slider cheerful to calm"
              className="w-full accent-[#98473E] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium">
              <span>High Energy & Bubbly</span>
              <span>Peaceful & Grounded</span>
            </div>
            {store.relaxMode && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium pt-1">
                Locked at Calm tone while Relax Mode is active.
              </p>
            )}
          </div>

          {/* Slider 2: Playful to Serious */}
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--text)]">Style: Playful ↔ Serious</span>
              <span className="text-[#A37C40] font-bold">
                {getToneLabel(effectivePersonality.playfulSerious, 'Playful', 'Serious')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={effectivePersonality.playfulSerious}
              onChange={(e) =>
                updatePersonality({ playfulSerious: parseInt(e.target.value, 10) })
              }
              aria-label="Personality slider playful to serious"
              className="w-full accent-[#A37C40] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium">
              <span>Witty & Humorous</span>
              <span>Methodical & Academic</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Voice Lines & Speech Synthesis Settings */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {effectivePersonality.voiceEnabled ? (
              <Volume2 className="h-4 w-4 text-[#98473E]" />
            ) : (
              <VolumeX className="h-4 w-4 text-[var(--text-muted)]" />
            )}
            <h3 className="text-base font-bold text-[var(--text)]">
              Speech Synthesis & Voice Lines
            </h3>
          </div>

          {/* Voice Enable Mute Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={effectivePersonality.voiceEnabled}
              onChange={(e) => updatePersonality({ voiceEnabled: e.target.checked })}
              className="sr-only peer"
              aria-label="Enable voice speech lines"
            />
            <div className="w-10 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#98473E]" />
          </label>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Pip can read tips aloud using your device's built-in Web Speech synthesizer. Includes
          tailored voice sets for English and Hindi.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Language Selector */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-2">
            <label className="text-xs font-semibold text-[var(--text)] block">
              Spoken Language
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updatePersonality({ language: 'en' })}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  effectivePersonality.language === 'en'
                    ? 'bg-[#98473E] text-white shadow-sm'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border-soft)]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => updatePersonality({ language: 'hi' })}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  effectivePersonality.language === 'hi'
                    ? 'bg-[#98473E] text-white shadow-sm'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border-soft)]'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Voice Selector */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-2">
            <label className="text-xs font-semibold text-[var(--text)] block">
              Synthesizer Voice
            </label>
            <select
              value={effectivePersonality.selectedVoiceName || ''}
              onChange={(e) => updatePersonality({ selectedVoiceName: e.target.value })}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-soft)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#98473E]"
            >
              <option value="">Default System Voice</option>
              {filteredVoices.map((v) => (
                <option key={v.voiceURI} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed Slider */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="text-[var(--text)]">Pacing Speed</label>
              <span className="text-[#98473E] font-bold">{effectivePersonality.voiceSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={effectivePersonality.voiceSpeed}
              onChange={(e) =>
                updatePersonality({ voiceSpeed: parseFloat(e.target.value) })
              }
              aria-label="Speech speed slider"
              className="w-full accent-[#98473E] cursor-pointer mt-1"
            />
          </div>
        </div>
      </div>

      {/* 4. Wardrobe & Accessories */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="h-4 w-4 text-[#98473E]" />
            <h3 className="text-base font-bold text-[var(--text)]">
              Pip's Wardrobe & Accessories
            </h3>
          </div>
          <span className="text-xs font-bold text-[#A37C40] bg-[#A37C40]/10 px-2.5 py-0.5 rounded-full border border-[#A37C40]/20">
            Scholar Level {userLevel}
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-[var(--border-soft)] pb-3">
          {(
            [
              { id: 'hat', label: 'Hats & Headwear', icon: '🎓' },
              { id: 'glasses', label: 'Glasses & Eyewear', icon: '👓' },
              { id: 'scarf', label: 'Scarfs & Wraps', icon: '🧣' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#98473E] text-white shadow-sm'
                  : 'bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border-soft)]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Item Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {OUTFIT_CATALOG.filter((i) => i.category === activeCategory).map((item) => {
            const unlocked = isOutfitUnlocked(item.id, userLevel, store.badges);
            const isEquipped = store.mascotOutfit[item.category] === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isEquipped
                    ? 'bg-[#98473E]/10 border-[#98473E]'
                    : unlocked
                    ? 'bg-[var(--surface-raised)] border-[var(--border-soft)] hover:border-[#98473E]/50'
                    : 'bg-[var(--surface)] opacity-60 border-[var(--border-soft)]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    {isEquipped ? (
                      <span className="text-[10px] font-bold text-[#98473E] bg-[#98473E]/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>Equipped</span>
                      </span>
                    ) : !unlocked ? (
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>
                          {item.requiredLevel
                            ? `Level ${item.requiredLevel}`
                            : 'Badge Required'}
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text)]">{item.name}</h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3">
                  {isEquipped ? (
                    <button
                      type="button"
                      disabled={item.id === 'cap-scholar' && item.category === 'hat'}
                      onClick={() =>
                        updateMascotOutfit({
                          [item.category]: item.category === 'hat' ? 'cap-scholar' : 'none',
                        })
                      }
                      className="w-full py-1 px-2 rounded-lg text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--surface)] border border-[var(--border-soft)] cursor-pointer"
                    >
                      {item.id === 'cap-scholar' ? 'Standard Cap' : 'Unequip'}
                    </button>
                  ) : unlocked ? (
                    <button
                      type="button"
                      onClick={() => updateMascotOutfit({ [item.category]: item.id })}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#98473E] text-white hover:bg-[#823C34] transition-colors shadow-sm cursor-pointer"
                    >
                      Equip on Pip
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border-soft)] cursor-not-allowed opacity-80"
                    >
                      Locked (L{item.requiredLevel || 3})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. What Your Mascot Remembers (Episodic Memory Hub) */}
      <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--border)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#98473E]" />
            <h3 className="text-base font-bold text-[var(--text)]">
              What Pip Remembers
            </h3>
            <span className="text-xs font-bold text-[#98473E] bg-[#98473E]/10 px-2 py-0.5 rounded-full">
              {store.mascotMemories.length} Key Moments
            </span>
          </div>

          {store.mascotMemories.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear All Memories</span>
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Pip remembers your breakthrough study moments—mastered topics, resilient quiz
          bouncebacks, and consistency milestones. These episodic memories inspire Pip's tips. You
          retain full control to delete individual memories or clear everything.
        </p>

        {showClearConfirm && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
              <ShieldAlert className="h-4 w-4" />
              <span>Are you sure you want to clear all of Pip's memories?</span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              Pip will return to default general study tips until new breakthrough moments occur.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  clearAllMascotMemories();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                Yes, Clear All
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--surface)] text-[var(--text)] border border-[var(--border-soft)] hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {store.mascotMemories.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[var(--surface-raised)] border border-dashed border-[var(--border-soft)] space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-[var(--text-muted)] opacity-60" />
            <h4 className="text-xs font-bold text-[var(--text)]">No memories recorded yet</h4>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              As you master topics, complete tough quizzes, and build streaks, Pip will
              automatically capture memories to inspire your daily study sessions!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {store.mascotMemories.map((mem) => {
              const IconComp =
                mem.type === 'streak_milestone'
                  ? Flame
                  : mem.type === 'sprint_champion'
                  ? Zap
                  : mem.type === 'comeback_return'
                  ? RotateCcw
                  : Award;

              return (
                <div
                  key={mem.id}
                  className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-soft)] flex items-start justify-between gap-3 hover:border-[var(--border)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[var(--surface)] text-[#98473E] border border-[var(--border-soft)] shrink-0">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[var(--text)]">{mem.title}</h4>
                        <span className="text-[10px] text-[var(--text-muted)]">{mem.date}</span>
                        <WhyPopover
                          reason={{
                            rule: `Mascot Episodic Memory (${mem.type})`,
                            data: [mem.detail, `Captured on ${mem.date}`],
                          }}
                          title="Memory Record Origin"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                        {mem.detail}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteMascotMemory(mem.id)}
                    aria-label={`Delete memory: ${mem.title}`}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
