import GradientButton from "@/components/GradientButton";
import BackButton from "@/components/ui/BackButton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { audioService } from "@/services/audio/audioService";
import { MUSIC_SOURCES, musicService } from "@/services/audio/music";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback } from "react";
import {
  FlatList,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const lessons = [
  {
    id: "1",
    title: "Match Pairs",
    screen: "/(tabs)/practice/pronunciation",
    icon: "mic" as const,
    colors: ["#66BB6A", "#81C784"] as const,
  },
  {
    id: "2",
    title: "Sentence Builder",
    screen: "/(tabs)/sentencebuild",
    icon: "construct" as const,
    colors: ["#29B6F6", "#4FC3F7"] as const,
  },
  {
    id: "3",
    title: "Fix the Sentence",
    screen: "/(tabs)/fixsentence",
    icon: "build" as const,
    colors: ["#AB47BC", "#BA68C8"] as const,
  },
  {
    id: "4",
    title: "Present Simple Tense",
    screen: "/(tabs)/presentsimpletense",
    icon: "time" as const,
    colors: ["#FFB74D", "#FF9800"] as const,
  },
  {
    id: "5",
    title: "Riddles",
    screen: "/(tabs)/riddles",
    icon: "help-circle" as const,
    colors: ["#FF8A65", "#F06292"] as const,
  },
];

export default function Pract() {
  const router = useRouter();
  const { AuthGuard } = useRequireAuth();

  // ✅ PLAY CLICK SOUND THEN NAVIGATE
  const playAndNavigate = async (screen: string) => {
    try {
      await musicService.stopAsync();

      const sound = await audioService.playSound(
        require("../assets/music/drop.mp3"),
      );

      if (sound) {
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            try {
              await sound.unloadAsync();
            } catch (e) {}
            router.push(screen as any);
          }
        });
      } else {
        router.push(screen as any);
      }
    } catch {
      router.push(screen as any);
    }
  };

  // ✅ AUTO PLAY BACKGROUND MUSIC + CLEANUP
  useFocusEffect(
    useCallback(() => {
      void musicService.playAsync(MUSIC_SOURCES.practice);

      return () => {
        // DO NOT stop music here, let the destination screen decide
        Speech.stop();
      };
    }, []),
  );

  return (
    <ImageBackground
      source={require("@/assets/int.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <AuthGuard />
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton targetRoute="/home" />
          <Text style={styles.title}>PRACTICES</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* LESSON LIST */}
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GradientButton
              title={item.title}
              icon={item.icon}
              colors={item.colors}
              onPress={() => playAndNavigate(item.screen)}
            />
          )}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f9f9f9ff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f7f5f9ff",
  },
  headerSpacer: {
    width: 70, // Approximate width of navButton to balance title
  },
  list: {
    paddingBottom: 40,
    width: "100%",
    paddingHorizontal: 20,
  },
});
