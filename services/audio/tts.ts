import * as Speech from "expo-speech";
import { settingsService } from "../settings";
import { musicService } from "./music";

/**
 * Global TTS Configuration for a Child-Friendly Voice
 * Consistency across: Mascot, Games, Instructions, etc.
 */
const CHILD_FRIENDLY_CONFIG = {
  pitch: 1.3, // Higher tone for a child-like voice (approx 8-9 years old)
  rate: 0.9, // Slightly slower for better clarity for young learners
};

export const TTS = {
  /**
   * Automatically speaks the provided text using the global child-friendly configuration.
   * Ensures only one speech plays at a time by stopping any ongoing speech.
   */
  speak: async (text: string, options: Speech.SpeechOptions = {}) => {
    // TTS is ALWAYS enabled for guidance, ignoring settingsService flags

    // 1. Force stop any current speech before starting new one (Overlap Prevention)
    Speech.stop();

    // 3. Playful Phrase Adjustment: Add slight expressive pauses for a livelier tone
    // Example: "Hello! I'm Kico!" -> "Hello! ... I'm Kico!"
    let expressiveText = text;
    if (text.includes("!") || text.includes(".")) {
      expressiveText = text.replace(/([!.?])\s+/g, "$1 ... ");
    }

    // 4. Trigger music ducking
    void musicService.duckVolume();

    // 5. Speak immediately
    Speech.speak(expressiveText, {
      ...CHILD_FRIENDLY_CONFIG,
      ...options, // Keep other options (rate, onDone, etc.)
      pitch: 1.3, // FORCE high pitch for child-like voice, overriding any passed pitch
      onDone: () => {
        void musicService.restoreVolume();
        options.onDone?.();
      },
      onStopped: () => {
        void musicService.restoreVolume();
        options.onStopped?.();
      },
      onError: (error) => {
        void musicService.restoreVolume();
        options.onError?.(error);
      },
    });
  },

  /**
   * Manually stops any ongoing speech.
   */
  stop: () => {
    Speech.stop();
  },

  /**
   * Checks if the device is currently speaking.
   */
  isSpeaking: async () => {
    return await Speech.isSpeakingAsync();
  },
};
