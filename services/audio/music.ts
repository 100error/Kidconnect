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

  constructor() {
    // Listen for music setting changes
    settingsService.addListener(async (settings) => {
      this.isMuted = !settings.musicEnabled;
      if (this.isMuted) {
        await this.stopAsync();
      } else if (this.currentSource) {
        // If music was enabled and we have a source, start playing
        await this.playAsync(this.currentSource);
      }
    });

    // Initial mute state
    settingsService.isMusicEnabled().then((enabled) => {
      this.isMuted = !enabled;
    });
  }

  async playAsync(source: any = MUSIC_SOURCES.default) {
    // Update current source
    this.currentSource = source;

    // 1. Global Mute Check - If muted, don't play
    if (this.isMuted) {
      return;
    }

    // 2. Prevent duplicate playback if already playing the same source
    if (this.isPlaying && this.currentSource === source && this.sound) {
      return;
    }

    try {
      // 3. Single Instance Management - Stop previous before playing new
      await this.stopAsync();

      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        isLooping: true,
        volume: 1,
      });
      
      this.sound = sound;
      this.isPlaying = true;
    } catch (error) {
      console.log("Error playing music:", error);
      this.isPlaying = false;
    }
  }

  async stopAsync() {
    this.isPlaying = false;
    
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    } catch (error) {
      console.log("Error stopping music:", error);
      this.sound = null;
    }
  }
}

export const musicService = new MusicService();
