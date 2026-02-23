import { useEffect, useRef, useState, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { checkInstructionSeen, markInstructionSeen } from '@/services/instructions';
import { useFocusEffect } from 'expo-router';

export function useInstruction(screenId: string, instruction: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isMounted = useRef(true);

  const stop = useCallback(async () => {
    try {
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
      }
      if (isMounted.current) setIsPlaying(false);
    } catch (e) {
      console.log("Error stopping speech:", e);
    }
  }, []);

  const play = useCallback(async () => {
    try {
      // Stop any existing speech first
      await stop();
      
      if (!isMounted.current) return;
      setIsPlaying(true);
      
      Speech.speak(instruction, {
        language: 'en-US',
        rate: 0.8, // Slower for kids
        pitch: 1.1, // Slightly higher pitch for kid-friendly tone
        onDone: () => {
          if (isMounted.current) setIsPlaying(false);
        },
        onStopped: () => {
          if (isMounted.current) setIsPlaying(false);
        },
        onError: () => {
          if (isMounted.current) setIsPlaying(false);
        }
      });
    } catch (e) {
      console.log("Error playing instruction:", e);
      if (isMounted.current) setIsPlaying(false);
    }
  }, [instruction, stop]);

  // Auto-play on first visit
  useEffect(() => {
    let active = true;
    isMounted.current = true;

    const checkAndPlay = async () => {
      const seen = await checkInstructionSeen(screenId);
      if (!seen && active) {
        await play();
        await markInstructionSeen(screenId);
      }
    };

    checkAndPlay();

    return () => {
      active = false;
      isMounted.current = false;
      stop();
    };
  }, [screenId, play, stop]);

  // Stop when screen loses focus (navigation)
  useFocusEffect(
    useCallback(() => {
      return () => {
        stop();
      };
    }, [stop])
  );

  return { play, isPlaying, stop };
}
