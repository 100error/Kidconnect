import { audioService } from "@/services/audio/audioService";
import { Audio, ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function Greeting() {
  const videoRef = useRef<Video>(null);
  const [audio, setAudio] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let soundInstance: Audio.Sound | null = null;

    async function playVoice() {
      try {
        const sound = await audioService.playSound(
          require("../assets/audio/kiko1.mp3"), // your voice file
        );
        if (sound) {
          setAudio(sound);
          soundInstance = sound;
        }
      } catch (error) {
        console.log("Error playing audio:", error);
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
      // Stop and unload Kico's voice immediately
      if (audio) {
        await audio.stopAsync();
        await audio.unloadAsync();
        setAudio(null);
      }

      // Navigate to the next screen
      router.push("/intro");
    } catch (error) {
      console.log("Error stopping audio:", error);
      router.push("/intro");
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/in.png")}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Full screen video */}
      <Video
        ref={videoRef}
        source={require("../assets/videos/kik.mp4")}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        useNativeControls={false}
        onError={(error) => console.log("Greeting Video Error:", error)}
        onLoad={() => console.log("Greeting Video Loaded")}
        usePoster
        posterSource={require("@/assets/in.png")}
        posterStyle={{ resizeMode: "cover" }}
      />

      {/* Continue button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
    bottom: 200,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  subtitleText: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    backgroundColor: "rgba(177, 210, 207, 0.5)",
    padding: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100, // pataas gamay
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
});
