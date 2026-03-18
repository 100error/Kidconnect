import { Audio } from 'expo-av';
import { settingsService } from '../settings';

const BACKGROUND_MUSIC = require('../../assets/music/fun.mp3');

class MusicService {
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private currentPath: any = null;

  constructor() {
    // Listen for music setting changes
    settingsService.addListener(async (settings) => {
      if (!settings.musicEnabled) {
        await this.stopAsync();
      } else if (this.currentPath) {
        // If music was enabled and we have a path, resume/start
        await this.playAsync(this.currentPath);
      }
    });
  }

  async playAsync(source: any = BACKGROUND_MUSIC) {
    this.currentPath = source;
    
    const musicEnabled = await settingsService.isMusicEnabled();
    if (!musicEnabled) return;

    if (this.sound) {
      // If already playing the same source, don't restart
      if (this.isPlaying && this.currentPath === source) return;
      await this.stopAsync();
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        source,
        { 
          shouldPlay: true, 
          isLooping: true,
          volume: 0 // Start at 0 for fade in
        }
      );
      this.sound = sound;
      this.isPlaying = true;

      // Fade in
      await this.fadeIn();
    } catch (error) {
      console.log('Error playing music:', error);
    }
  }

  async stopAsync() {
    if (!this.sound) return;

    try {
      // Fade out before stopping
      await this.fadeOut();
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.isPlaying = false;
    } catch (error) {
      console.log('Error stopping music:', error);
    }
  }

  private async fadeIn(duration: number = 1000) {
    if (!this.sound) return;
    let volume = 0;
    const interval = 50;
    const step = 1 / (duration / interval);

    const fade = setInterval(async () => {
      volume += step;
      if (volume >= 1) {
        volume = 1;
        clearInterval(fade);
      }
      if (this.sound) {
        await this.sound.setVolumeAsync(volume);
      } else {
        clearInterval(fade);
      }
    }, interval);
  }

  private async fadeOut(duration: number = 1000) {
    if (!this.sound) return;
    let volume = 1;
    const interval = 50;
    const step = 1 / (duration / interval);

    return new Promise<void>((resolve) => {
      const fade = setInterval(async () => {
        volume -= step;
        if (volume <= 0) {
          volume = 0;
          clearInterval(fade);
          resolve();
        }
        if (this.sound) {
          await this.sound.setVolumeAsync(volume);
        } else {
          clearInterval(fade);
          resolve();
        }
      }, interval);
    });
  }
}

export const musicService = new MusicService();
