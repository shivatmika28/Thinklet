// [PERSONAL] Safe Web Speech API synthesis service with dual-language (EN/HI) support and fallback
"use client";

export interface SpeechVoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

let cachedVoices: SpeechVoiceOption[] = [];

/**
 * Returns the list of installed synthesis voices in the browser
 */
export function getAvailableVoices(): Promise<SpeechVoiceOption[]> {
  if (!isSpeechSynthesisSupported()) {
    return Promise.resolve([]);
  }

  if (cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices.map((v) => ({
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        default: v.default,
      }));
      resolve(cachedVoices);
      return;
    }

    const handler = () => {
      const updated = synth.getVoices();
      cachedVoices = updated.map((v) => ({
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        default: v.default,
      }));
      synth.removeEventListener('voiceschanged', handler);
      resolve(cachedVoices);
    };

    synth.addEventListener('voiceschanged', handler);
    // Timeout fallback if voiceschanged never fires
    setTimeout(() => {
      resolve(cachedVoices);
    }, 800);
  });
}

export interface SpeakOptions {
  language?: 'en' | 'hi';
  speed?: number; // 0.75 to 1.5
  voiceName?: string;
  pitch?: number; // 0.8 to 1.2
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Stops any current speech synthesis in progress
 */
export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  } catch (err) {
    console.warn('[SpeechSynthesis] Error cancelling utterance:', err);
  }
}

/**
 * Speaks the provided text using Web Speech API with language fallback
 */
export function speakMascotLine(text: string, options: SpeakOptions = {}): boolean {
  if (!isSpeechSynthesisSupported()) {
    console.warn('[SpeechSynthesis] Browser does not support Web Speech API');
    return false;
  }

  if (!text || text.trim().length === 0) {
    return false;
  }

  const {
    language = 'en',
    speed = 1.0,
    voiceName,
    pitch = 1.05, // Slightly bright/friendly pitch for Pip
    onStart,
    onEnd,
    onError,
  } = options;

  try {
    stopSpeaking();

    // Remove emojis from speech text for natural vocalization
    const cleanedText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}\u{200D}]/gu, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText || text);
    utterance.rate = Math.max(0.75, Math.min(1.5, speed));
    utterance.pitch = Math.max(0.8, Math.min(1.3, pitch));

    const voices = window.speechSynthesis.getVoices();

    // 1. If explicit voice name given, attempt match
    if (voiceName) {
      const match = voices.find((v) => v.name === voiceName);
      if (match) {
        utterance.voice = match;
        utterance.lang = match.lang;
      }
    }

    // 2. If no voice chosen yet, find matching voice for target language
    if (!utterance.voice && voices.length > 0) {
      if (language === 'hi') {
        const hindiVoice = voices.find(
          (v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi')
        );
        if (hindiVoice) {
          utterance.voice = hindiVoice;
          utterance.lang = hindiVoice.lang;
        } else {
          // Fallback to English voice if Hindi voice is not installed
          const enVoice = voices.find(
            (v) => v.lang.toLowerCase().startsWith('en') && (v.lang.includes('IN') || v.lang.includes('US') || v.lang.includes('GB'))
          );
          if (enVoice) {
            utterance.voice = enVoice;
            utterance.lang = enVoice.lang;
          }
        }
      } else {
        const enVoice = voices.find(
          (v) => v.lang.toLowerCase().startsWith('en')
        );
        if (enVoice) {
          utterance.voice = enVoice;
          utterance.lang = enVoice.lang;
        }
      }
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      onError?.(e);
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('[SpeechSynthesis] Failed to play utterance:', err);
    onError?.(err);
    return false;
  }
}
