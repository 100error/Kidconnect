import { useSafeAsync } from "@/hooks/useSafeAsync";
import { audioService } from "@/services/audio/audioService";
import { speechService } from "@/services/speechService";
import { Audio, ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { settingsService } from "@/services/settings";

export default function Intro() {
  const { isMountedRef, safeRun } = useSafeAsync();
  const isRunningRef = useRef(false);
  const videoRef = useRef<Video>(null);
  const [audio, setAudio] = useState<Audio.Sound | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState("");

  // Subtitle lines with start/end times (ms)
  const subtitles = [
    {
      text: "Hi, friends! I’m Kico, your buddy here at KidConnect!",
      start: 0,
      end: 4000,
    },
    { text: "Welcome to our fun learning adventure!", start: 4000, end: 7000 },
    {
      text: "Here in KidConnect, we play games, learn new things,",
      start: 7000,
      end: 12000,
    },
    {
      text: "and have lots of fun while practicing reading, speaking, and understanding!",
      start: 12000,
      end: 17000,
    },
    {
      text: "Are you ready? Let’s start our adventure and have fun learning together!",
      start: 17000,
      end: 22000,
    },
  ];

  useEffect(() => {
    let soundInstance: Audio.Sound | null = null;

    async function playVoice() {
      try {
        const sound = await audioService.playSound(
          require("../assets/audio/kiko2.mp3"),
        );
        if (sound && isMountedRef.current) {
          setAudio(sound);
          soundInstance = sound;

          // Playback status listener
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              if (status.didJustFinish) {
                // Clear subtitle and show button when audio ends
                if (isMountedRef.current) {
                  setCurrentSubtitle("");
                  setShowButton(true);
                }
              } else if (
                status.positionMillis != null &&
                !status.didJustFinish
              ) {
                // Update current subtitle while playing
                const subtitle = subtitles.find(
                  (s) =>
                    status.positionMillis >= s.start &&
                    status.positionMillis <= s.end,
                );
                if (isMountedRef.current) {
                  setCurrentSubtitle(subtitle ? subtitle.text : "");
                }
              }
            }
          });
        } else {
          if (isMountedRef.current) setShowButton(true); // fallback if muted
        }
      } catch (error) {
        console.log("Error playing audio:", error);
        if (isMountedRef.current) setShowButton(true); // fallback
      }
    }

    playVoice();

    return () => {
      if (soundInstance) {
        soundInstance.stopAsync().catch(() => {});
        soundInstance.unloadAsync().catch(() => {});
      }
      speechService.stopRecording();
      Speech.stop();
    };
  }, []);

  const handleContinue = async () => {
    if (isRunningRef.current || !isMountedRef.current) return;
    isRunningRef.current = true;

    try {
      if (audio) {
        await audio.stopAsync();
        await audio.unloadAsync();
        if (isMountedRef.current) setAudio(null);
      }
      await settingsService.setHasSeenWelcome(true);
      if (isMountedRef.current) router.replace("/home");
    } catch (error) {
      console.log("Error stopping audio:", error);
      await settingsService.setHasSeenWelcome(true);
      if (isMountedRef.current) router.replace("/home");
    } finally {
      isRunningRef.current = false;
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/in.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.skipButtonContainer}>
        <TouchableOpacity onPress={handleContinue} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      {/* Full screen Kico */}
      <Video
        ref={videoRef}
        source={require("../assets/videos/kik.mp4")}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        useNativeControls={false}
        onError={(error) => console.log("Video Error:", error)}
        onLoad={() => console.log("Video Loaded")}
        usePoster
        posterSource={require("@/assets/in.png")}
        posterStyle={{ resizeMode: "cover" }}
      />

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        {currentSubtitle ? (
          <BlurView intensity={40} tint="dark" style={styles.blurWrapper}>
            <Text style={styles.subtitleText}>{currentSubtitle}</Text>
          </BlurView>
        ) : null}
      </View>

      {/* Continue button */}
      {showButton && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#A1CEDC" },
  video: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  subtitleContainer: {
    position: "absolute",
    bottom: 150,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  blurWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 15,
    maxWidth: "100%",
  },
  subtitleText: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 175,
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#4AC3FF",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButtonContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
  },
  skipButton: {
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  skipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
