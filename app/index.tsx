import { audioService } from "@/services/audio/audioService";
import { Audio } from "expo-av";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, ImageBackground, StyleSheet, View } from "react-native";
import { settingsService } from "@/services/settings";

const { width } = Dimensions.get("window");

export default function Index() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let soundInstance: Audio.Sound | null = null;

    async function startLoading() {
      // Start checking settings in parallel with animation/sound setup
      const hasSeenWelcomePromise = settingsService.hasSeenWelcome();

      try {
        const bgSound = await audioService.playSound(require("../assets/music/fun.mp3"));
        if (bgSound) {
          await bgSound.setIsLoopingAsync(true);
          setSound(bgSound);
          soundInstance = bgSound;
        }
      } catch (e) {
        console.log("Error loading sound", e);
      }

      Animated.timing(lineAnim, {
        toValue: width * 0.8,
        duration: 3000,
        useNativeDriver: false,
      }).start(async () => {
        if (soundInstance) {
          try {
            await soundInstance.stopAsync();
            await soundInstance.unloadAsync();
          } catch (e) { console.log("Error stopping sound", e); }
        }
        
        const hasSeenWelcome = await hasSeenWelcomePromise;
        if (hasSeenWelcome) {
          router.replace("/home");
        } else {
          router.replace("/intro");
        }
      });
    }

    startLoading();

    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, []);

  return (
    <ImageBackground
      source={require("@/assets/ba.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar translucent backgroundColor="transparent" style="dark" />
      {/*<Animated.Image source={require("../assets/images/dong.png")} style={styles.logo} />*/}
      <View style={styles.lineContainer}>
        <Animated.View style={[styles.line, { width: lineAnim }]} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    width: "100%",
    height: "100%",
    justifyContent: "center", 
    alignItems: "center",
   
  },
  logo: { 
    width: 200, 
    height: 200, 
    resizeMode: "contain", 
    marginBottom: 50 
  },
  lineContainer: {
    height: 5,
    width: width * 0.8,
    backgroundColor: "#ffffff50",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 390,
  },
  line: { height: 5, backgroundColor: "#4AC3FF", borderRadius: 3 },
});
