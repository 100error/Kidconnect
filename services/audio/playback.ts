import { Audio } from 'expo-av';

// Map of sound names to require paths
const SOUNDS = {
  correct: require('../../assets/music/feedback/correct.mp3'),
  incorrect: require('../../assets/music/feedback/wrong.mp3'),
  // Add other sounds here
};

export const playbackService = {
  playSound: async (soundName: keyof typeof SOUNDS) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        SOUNDS[soundName],
        { shouldPlay: true }
      );
      
      // We don't need to hold the reference if we just want it to play and die,
      // but unloading is good practice. 
      // For simple SFX, let's auto-unload on finish.
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }
};
