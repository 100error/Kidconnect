import GradientButton from "@/components/GradientButton";
import BackButton from "@/components/ui/BackButton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { audioService } from "@/services/audio/audioService";
import { MUSIC_SOURCES, musicService } from "@/services/audio/music";
import { Audio } from "expo-av";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef } from "react";
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
    title: "Common Words",
    screen: "/(tabs)/common",
    icon: "chatbubbles" as const,
    colors: ["#FFB74D", "#FF8A65"] as const,
  },
  {
    id: "2",
    title: "Nouns",
    screen: "/(tabs)/nouns",
    icon: "pricetag" as const,
    colors: ["#EF5350", "#E57373"] as const,
  },
  {
    id: "3",
    title: "Tense Words",
    screen: "/(tabs)/tenses",
    icon: "time" as const,
    colors: ["#42A5F5", "#64B5F6"] as const,
  },
  {
    id: "4",
    title: "Irregular Words",
    screen: "/(tabs)/irregular",
    icon: "extension-puzzle" as const,
    colors: ["#AB47BC", "#BA68C8"] as const,
  },
  {
    id: "5",
    title: "Comparison Words",
    screen: "/(tabs)/comparison",
    icon: "resize" as const,
    colors: ["#66BB6A", "#81C784"] as const,
  },
  {
    id: "7",
    title: "Question Words",
    screen: "/(tabs)/questions",
    icon: "help-circle" as const,
    colors: ["#FFA726", "#FFB74D"] as const,
  },
  {
    id: "8",
    title: "Dialogue Words",
    screen: "/(tabs)/dialogue",
    icon: "chatbox-ellipses" as const,
    colors: ["#EC407A", "#F06292"] as const,
  },
  {
    id: "9",
    title: "Context Clues",
    screen: "/(tabs)/context",
    icon: "search" as const,
    colors: ["#5C6BC0", "#7986CB"] as const,
  },
  {
    id: "10",
    title: "Problem Solving",
    screen: "/(tabs)/problemsolving",
    icon: "bulb" as const,
    colors: ["#26A69A", "#4DB6AC"] as const,
  },
  {
    id: "11",
    title: "Spelling Practice",
    screen: "/(tabs)/spelled",
    icon: "create" as const,
    colors: ["#29B6F6", "#4FC3F7"] as const,
  },
];

const Vocab = () => {
  const router = useRouter();
  const { AuthGuard } = useRequireAuth();
  const clickSoundRef = useRef<Audio.Sound | null>(null);

  // ✅ REUSABLE SOUND + NAVIGATION
  const playClickAndNavigate = async (route?: string, goBack?: boolean) => {
    try {
      await musicService.stopAsync().catch(() => {});

      // Cleanup previous click sound if exists
      if (clickSoundRef.current) {
        try {
          await clickSoundRef.current.unloadAsync();
        } catch (error) {
          console.warn("Error unloading previous click sound:", error);
        }
        clickSoundRef.current = null;
      }

      const soundAsset = require("../assets/music/drop.mp3");
      const sound = await audioService.playSound(soundAsset);

      if (sound) {
        clickSoundRef.current = sound;
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (!status.isLoaded) return;

          if (status.didJustFinish) {
            try {
              if (clickSoundRef.current === sound) {
                clickSoundRef.current = null;
              }
              await sound.unloadAsync().catch(() => {});
            } catch (error) {
              console.warn("Error unloading finished click sound:", error);
            }

            if (goBack) {
              router.back();
            } else if (route) {
              router.push(route as any);
            }
          }
        });
      } else {
        // If sound couldn't play (e.g. muted), still navigate
        if (goBack) router.back();
        else if (route) router.push(route as any);
      }
    } catch (error) {
      console.warn("Navigation sound error, proceeding without sound:", error);

      if (goBack) {
        router.back();
      } else if (route) {
        router.push(route as any);
      }
    }
  };

  // ✅ AUTO-PLAY BACKGROUND MUSIC ON FOCUS
  useFocusEffect(
    useCallback(() => {
      void musicService.playAsync(MUSIC_SOURCES.vocab);
      return () => {
        Speech.stop();
      };
    }, []),
  );

  useEffect(() => {
    return () => {
      if (clickSoundRef.current) {
        clickSoundRef.current
          .unloadAsync()
          .catch((err) => console.log("Unload click sound error:", err));
      }
    };
  }, []);

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

          <Text style={styles.title}>VOCABULARY</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* LESSONS LIST */}
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
              onPress={() => playClickAndNavigate(item.screen)}
            />
          )}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Vocab;

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
    color: "#ffffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffffff",
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
