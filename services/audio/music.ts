import { Audio } from "expo-av";
import { settingsService } from "../settings";

export const MUSIC_SOURCES = {
  home: require("../../assets/music/fun.mp3"),
  profile: require("../../assets/music/fun.mp3"),
  vocab: require("../../assets/music/fun.mp3"),
  practice: require("../../assets/music/fun.mp3"),
  games: require("../../assets/music/fun.mp3"),
  default: require("../../assets/music/fun.mp3"),
};

class MusicService {
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private currentSource: any = null;
  private isMuted: boolean = false;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private currentVolume: number = 1;

  constructor() {
    // Listen for music setting changes
    settingsService.addListener(async (settings) => {
      this.isMuted = !settings.musicEnabled;
      if (this.isMuted) {
        await this.stopAsync();
      } else if (this.currentSource && !this.isPlaying) {
        // If music was enabled and we have a source but not playing, start
        await this.playAsync(this.currentSource);
      }
    });

    // Initial mute state
    settingsService.isMusicEnabled().then((enabled) => {
      this.isMuted = !enabled;
    });
  }

  private clearFade() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  async duckVolume() {
    if (this.isMuted || !this.sound || !this.isPlaying) return;
    this.clearFade();
    await this.fadeTo(0.3, 300);
  }

  async restoreVolume() {
    if (this.isMuted || !this.sound || !this.isPlaying) return;
    this.clearFade();
    await this.fadeTo(1.0, 500);
  }

  private async fadeTo(targetVolume: number, duration: number) {
    if (!this.sound) return;

    const interval = 30;
    const steps = duration / interval;
    const stepAmount = (targetVolume - this.currentVolume) / steps;

    return new Promise<void>((resolve) => {
      this.fadeInterval = setInterval(async () => {
        if (!this.sound) {
          this.clearFade();
          resolve();
          return;
        }

        this.currentVolume += stepAmount;

        // Check if we reached the target
        if (
          (stepAmount > 0 && this.currentVolume >= targetVolume) ||
          (stepAmount < 0 && this.currentVolume <= targetVolume)
        ) {
          this.currentVolume = targetVolume;
          this.clearFade();
          resolve();
        }

        try {
          await this.sound.setVolumeAsync(this.currentVolume);
        } catch {
          this.clearFade();
          resolve();
        }
      }, interval);
    });
  }

  async playAsync(source: any = MUSIC_SOURCES.default) {
    // 1. Prevent duplicate playback of the same track
    if (this.currentSource === source && this.isPlaying) {
      return;
    }

    this.currentSource = source;

    // 2. Global Mute Check
    if (this.isMuted) return;

    try {
      // 3. Single Instance Management - Stop previous before playing new
      if (this.sound) {
        await this.stopAsync();
      }

      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        isLooping: true,
        volume: 0, // Start at 0 for fade in
      });
      this.sound = sound;
      this.isPlaying = true;
      this.currentVolume = 0;

      // 4. Smooth Fade-In
      await this.fadeTo(1.0, 1500);
    } catch (error) {
      console.log("Error playing music:", error);
    }
  }

  async stopAsync() {
    if (!this.sound) {
      this.isPlaying = false;
      return;
    }

    try {
      // 5. Smooth Fade-Out
      await this.fadeTo(0, 1000);

      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      }
      this.sound = null;
      this.isPlaying = false;
      this.currentVolume = 0;
    } catch (error) {
      console.log("Error stopping music:", error);
      // Ensure state is cleared even on error
      this.sound = null;
      this.isPlaying = false;
    }
  }

  // Remove old fadeIn/fadeOut methods as they are replaced by fadeTo
}

export const musicService = new MusicService();
