import * as Speech from "expo-speech";

export const TTS = {
  speak: (text: string, options: Speech.SpeechOptions = {}) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.85, pitch: 1.0, ...options });
  },
  stop: () => {
    Speech.stop();
  },
  isSpeaking: async () => {
    return await Speech.isSpeakingAsync();
  },
};
