import { Audio } from "expo-av";
import { settingsService } from "../settings";

const SOUNDS = {
  correct: require("../../assets/music/buttons/button.mp3"),
  incorrect: require("../../assets/music/buttons/error.mp3"),
};

export const playbackService = {
  _current: null as Audio.Sound | null,
  _isMuted: false,

  init: async () => {
    playbackService._isMuted = !(await settingsService.isSoundEffectsEnabled());
    settingsService.addListener((settings) => {
      playbackService._isMuted = !settings.soundEffectsEnabled;
      if (playbackService._isMuted) {
        playbackService.stop();
      }
    });
  },

  stop: async () => {
    if (!playbackService._current) return;
    try {
      await playbackService._current.stopAsync();
    } catch {}
    try {
      await playbackService._current.unloadAsync();
    } catch {}
    playbackService._current = null;
  },

  playSound: async (soundName: keyof typeof SOUNDS) => {
    // 1. Check if sound is muted
    if (playbackService._isMuted) return;

    try {
      // 2. Single Instance Management - Stop previous sound effects
      await playbackService.stop();

      const { sound } = await Audio.Sound.createAsync(SOUNDS[soundName], {
        shouldPlay: true,
        volume: 1,
      });
      playbackService._current = sound;

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          if (playbackService._current === sound) {
            playbackService._current = null;
          }
          await sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      console.log("Error playing sound:", error);
    }
  },
};

// Initialize the service
playbackService.init();
