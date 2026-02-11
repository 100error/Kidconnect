import { Audio, ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Intro() {
  const videoRef = useRef<Video>(null);
  const [audio, setAudio] = useState<Audio.Sound | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState("");

  // Subtitle lines with start/end times (ms)
  const subtitles = [
    { text: "Hi, friends! I’m Kico, your buddy here at KidConnect!", start: 0, end: 4000 },
    { text: "Welcome to our fun learning adventure!", start: 4000, end: 7000 },
    { text: "Here in KidConnect, we play games, learn new things,", start: 7000, end: 12000 },
    { text: "and have lots of fun while practicing reading, speaking, and understanding!", start: 1200, end: 17000 },
    { text: "Are you ready? Let’s start our adventure and have fun learning together!", start: 17000, end: 22000 },
  ];

  useEffect(() => {
    let soundInstance: Audio.Sound | null = null;

    async function playVoice() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/audio/kiko2.mp3")
        );
        setAudio(sound);
        soundInstance = sound;

        // Playback status listener
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              // Clear subtitle and show button when audio ends
              setCurrentSubtitle("");
              setShowButton(true);
            } else if (status.positionMillis != null && !status.didJustFinish) {
              // Update current subtitle while playing
              const subtitle = subtitles.find(
                (s) =>
                  status.positionMillis >= s.start &&
                  status.positionMillis <= s.end
              );
              setCurrentSubtitle(subtitle ? subtitle.text : "");
            }
          }
        });

        await sound.playAsync();
      } catch (error) {
        console.log("Error playing audio:", error);
        setShowButton(true); // fallback
      }
    }

    playVoice();

    return () => {
      if (soundInstance) {
        soundInstance.stopAsync();
        soundInstance.unloadAsync();
      }
    };
  }, []);

  const handleContinue = async () => {
    try {
      if (audio) {
        await audio.stopAsync();
        await audio.unloadAsync();
        setAudio(null);
      }
      router.push("/home");
    } catch (error) {
      console.log("Error stopping audio:", error);
      router.push("/home");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/in.png")}
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
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
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
