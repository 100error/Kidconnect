import React, { useEffect, useRef, useState } from "react";
import { View, Animated, ImageBackground, StyleSheet, Dimensions } from "react-native";
import { Audio } from "expo-av";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function Start() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let soundInstance: Audio.Sound | null = null;

    async function startLoading() {
      const { sound: bgSound } = await Audio.Sound.createAsync(
        require("../assets/music/fun.mp3"),
        { shouldPlay: true, isLooping: true }
      );
      await bgSound.playAsync();
      setSound(bgSound);
      soundInstance = bgSound;

      Animated.timing(lineAnim, {
        toValue: width * 0.8,
        duration: 5000,
        useNativeDriver: false,
      }).start(() => {
        if (soundInstance) {
          soundInstance.stopAsync();
          soundInstance.unloadAsync();
        }
        router.replace("/intro"); // relative path
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
      source={require("../assets/back.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <Animated.Image source={require("../assets/images/dong.png")} style={styles.logo} />
      <View style={styles.lineContainer}>
        <Animated.View style={[styles.line, { width: lineAnim }]} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" },
  logo: { 
    width: 300, 
    height: 300, 
    resizeMode: "contain", 
    marginBottom: 50 },
  lineContainer: {
    height: 5,
    width: width * 0.8,
    backgroundColor: "#ffffff50",
    borderRadius: 3,
    overflow: "hidden",
  },
  line: { height: 5, backgroundColor: "#4AC3FF", borderRadius: 3 },
});
