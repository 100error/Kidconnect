import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
import { Video, ResizeMode, Audio } from "expo-av";
import { router } from "expo-router";

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
      source={require("../assets/back.png")}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Full screen Kico */}
      <Video
        ref={videoRef} 
        source={require("../assets/videos/intro.mp4")}
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
      />

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitleText}>{currentSubtitle}</Text>
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
    bottom: 200,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  subtitleText: {
    color: "#5a9d9d",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0)",
    padding: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    width: "100%",
    alignItems: "center",
    paddingBottom: 100,
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
});