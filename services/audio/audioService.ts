import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { settingsService } from "../settings";
import { musicService } from "./music";
import { playbackService } from "./playback";
import { TTS } from "./tts";

class AudioService {
  private musicMuted: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    this.musicMuted = !(await settingsService.isMusicEnabled());

    settingsService.addListener((settings) => {
      this.musicMuted = !settings.musicEnabled;

      if (this.musicMuted) {
        musicService.stopAsync();
      }
    });
  }

  async setMusicMuted(muted: boolean) {
    await settingsService.setMusicEnabled(!muted);
  }

  getIsMusicMuted() {
    return this.musicMuted;
  }

  async stopAllAudio() {
    // 1. Stop Music
    await musicService.stopAsync();

    // 2. Stop Sound Effects
    await playbackService.stop();

    // 3. Stop TTS
    await Speech.stop();
  }

  /**
   * Stop any current speech
   */
  async stop() {
    await Speech.stop();
  }

  /**
   * Wrapper for TTS that ALWAYS works
   */
  async speak(text: string, options?: Speech.SpeechOptions) {
    // TTS ignores mute state for guidance
    await TTS.speak(text, options);
  }

  /**
   * Generic sound player
   */
  async playSound(source: any) {
    try {
      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
      });

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync().catch(() => {});
        }
      });

      return sound;
    } catch (error) {
      console.log("Error playing sound:", error);
      return null;
    }
  }
}

export const audioService = new AudioService();
