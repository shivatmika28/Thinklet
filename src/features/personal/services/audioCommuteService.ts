// [PERSONAL] Audio Commute service integrating Web Speech, Wake Lock API, and Media Session API
"use client";

import { CommuteAudioItem } from '../types';
import { stopSpeaking } from './speechSynthesisService';

export class AudioCommuteController {
  private items: CommuteAudioItem[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private speed: number = 1.0;
  private wakeLock: any = null;
  private onStateChange?: (state: {
    isPlaying: boolean;
    currentIndex: number;
    currentItem: CommuteAudioItem | null;
    total: number;
  }) => void;

  constructor(
    items: CommuteAudioItem[],
    onStateChange?: (state: {
      isPlaying: boolean;
      currentIndex: number;
      currentItem: CommuteAudioItem | null;
      total: number;
    }) => void
  ) {
    this.items = items;
    this.onStateChange = onStateChange;
    this.setupMediaSession();
  }

  public setItems(items: CommuteAudioItem[]): void {
    this.items = items;
    this.currentIndex = 0;
    this.notify();
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0.75, Math.min(1.5, speed));
    if (this.isPlaying) {
      // Re-trigger current utterance with new speed
      this.playCurrentItem();
    }
  }

  public async play(): Promise<void> {
    if (this.items.length === 0) return;
    this.isPlaying = true;
    await this.requestWakeLock();
    this.updateMediaSessionMetadata();
    this.playCurrentItem();
    this.notify();
  }

  public pause(): void {
    this.isPlaying = false;
    stopSpeaking();
    this.releaseWakeLock();
    this.notify();
  }

  public next(): void {
    if (this.items.length === 0) return;
    stopSpeaking();
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.updateMediaSessionMetadata();
    if (this.isPlaying) {
      this.playCurrentItem();
    }
    this.notify();
  }

  public previous(): void {
    if (this.items.length === 0) return;
    stopSpeaking();
    this.currentIndex =
      this.currentIndex <= 0 ? this.items.length - 1 : this.currentIndex - 1;
    this.updateMediaSessionMetadata();
    if (this.isPlaying) {
      this.playCurrentItem();
    }
    this.notify();
  }

  public stop(): void {
    this.pause();
    this.currentIndex = 0;
    this.notify();
  }

  private playCurrentItem(): void {
    if (!this.isPlaying || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const current = this.items[this.currentIndex];
    if (!current) return;

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(current.textToSpeak);
    utterance.rate = this.speed;

    utterance.onend = () => {
      if (!this.isPlaying) return;
      // Brief mindful pause before automatically moving to next card
      setTimeout(() => {
        if (this.isPlaying) {
          if (this.currentIndex + 1 < this.items.length) {
            this.next();
          } else {
            // Loop or finish
            this.pause();
          }
        }
      }, 1400);
    };

    utterance.onerror = (e) => {
      console.warn('[CommuteAudio] Utterance error:', e);
    };

    window.speechSynthesis.speak(utterance);
  }

  private async requestWakeLock(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('[CommuteAudio] Wake Lock unavailable:', err);
      }
    }
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
        this.wakeLock = null;
      } catch (err) {
        console.warn('[CommuteAudio] Failed to release wake lock:', err);
      }
    }
  }

  private setupMediaSession(): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const ms = navigator.mediaSession;
        ms.setActionHandler('play', () => this.play());
        ms.setActionHandler('pause', () => this.pause());
        ms.setActionHandler('nexttrack', () => this.next());
        ms.setActionHandler('previoustrack', () => this.previous());
      } catch (err) {
        console.warn('[CommuteAudio] Media Session not fully supported:', err);
      }
    }
  }

  private updateMediaSessionMetadata(): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && (window as any).MediaMetadata) {
      const current = this.items[this.currentIndex];
      if (current) {
        try {
          navigator.mediaSession.metadata = new (window as any).MediaMetadata({
            title: current.title,
            artist: 'Thinklet Commute Mode',
            album: current.type.toUpperCase(),
          });
        } catch {
          // Ignore
        }
      }
    }
  }

  private notify(): void {
    this.onStateChange?.({
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex,
      currentItem: this.items[this.currentIndex] || null,
      total: this.items.length,
    });
  }
}
