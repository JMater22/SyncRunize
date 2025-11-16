import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const isNative = Capacitor.isNativePlatform();

let webVoice: SpeechSynthesisVoice | null = null;

const speakWeb = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  if (webVoice) {
    utterance.voice = webVoice;
  } else {
    const voices = window.speechSynthesis.getVoices();
    webVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ?? null;
    if (webVoice) {
      utterance.voice = webVoice;
    }
  }
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};

export const speakText = async (text: string | null | undefined) => {
  if (!text) return;
  try {
    if (isNative) {
      await TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate: 1,
        pitch: 1,
        category: 'ambient',
      });
    } else {
      speakWeb(text);
    }
  } catch (err) {
    console.warn('[TTS] Unable to speak text', err);
  }
};
