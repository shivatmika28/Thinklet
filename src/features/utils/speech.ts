import { Lang } from '../../types';
import { Topic, PageText } from '../../types';
import { askJson } from '../../services/gemini';
import { contextOf } from '../../utils/verify';
import { loadFeatureStore } from '../services/featureStore';

export const LANG_SPEECH_CODES: Record<Lang, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Hinglish: 'en-IN', // en-IN voice handles Latin script Hinglish naturally
  Tamil: 'ta-IN',
  Bengali: 'bn-IN',
  Marathi: 'mr-IN'
};

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(
  text: string,
  lang: Lang = 'English',
  customRate?: number,
  customPitch?: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      resolve();
      return;
    }

    stopSpeaking();

    const store = loadFeatureStore();
    const prefs = store.voicePrefs;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = LANG_SPEECH_CODES[lang] || 'en-IN';
    utterance.rate = customRate ?? prefs.rate ?? 1.0;
    utterance.pitch = customPitch ?? prefs.pitch ?? 1.0;

    // Pick appropriate system voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetLangCode = utterance.lang.toLowerCase();
    const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLangCode.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error', e);
      resolve(); // graceful degrade
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function startVoiceRecognition(
  lang: Lang = 'English',
  onResult: (transcript: string) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!isSpeechRecognitionSupported()) {
    console.warn('SpeechRecognition is not supported in this browser.');
    return () => {};
  }

  const SpeechRecognitionAPI =
    (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionAPI();
  recognition.lang = LANG_SPEECH_CODES[lang] || 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) {
      onResult(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event);
  };

  try {
    recognition.start();
  } catch (err) {
    if (onError) onError(err);
  }

  return () => {
    try {
      recognition.stop();
    } catch {
      // ignore stop errors
    }
  };
}

/**
 * "Listen to weak topics" audio feature:
 * Code assembles verified facts for weak topics, and Gemini writes
 * an engaging, punchy 60-second spoken audio script (~130-150 words).
 */
export async function generate60SecondReviewScript(
  weakTopics: Topic[],
  pages: PageText[],
  lang: Lang = 'English'
): Promise<string> {
  if (weakTopics.length === 0) {
    return 'Great job! You currently have no weak topics. Keep up your active recall sessions to retain mastery!';
  }

  // Code assembles facts strictly from supplied material
  const assembledFacts = weakTopics.map(t => {
    const ctx = contextOf(t, pages);
    return `[Topic: ${t.name}]\n${t.summary}\nSample excerpts:\n${ctx.slice(0, 300)}`;
  }).join('\n\n');

  const langDirective = lang !== 'English'
    ? `\nMANDATORY LANGUAGE DIRECTIVE: Write the spoken review script in ${lang}. For Hindi use हिंदी, for Tamil use தமிழ், for Bengali use বাংলা, for Marathi use मराठी, for Hinglish use natural conversational Latin script.`
    : '';

  const prompt = `You are an audio study coach. Write an engaging, high-yield 60-second spoken review script (approx 130-150 words) for a student to listen to right before exam prep.
Focus ONLY on the supplied facts for these weak topics.
Make it conversational, direct, and emphasize critical memory hooks.
${langDirective}

Assembled Facts:
${assembledFacts}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      audioScript: { type: 'STRING' }
    },
    required: ['audioScript']
  };

  try {
    const res = await askJson<{ audioScript?: string; script?: string; reviewScript?: string }>(
      prompt,
      schema,
      v => Boolean(v && ((v as any).audioScript || (v as any).script || (v as any).reviewScript))
    );
    return res.audioScript || res.script || res.reviewScript || '';
  } catch (err) {
    console.warn('Audio script generation failed, using assembled facts fallback', err);
    return `Welcome to your rapid 60-second weak topic review. ${weakTopics.map(t => `${t.name}: ${t.summary}`).join('. ')}`;
  }
}
