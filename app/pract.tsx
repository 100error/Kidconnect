import React, { useRef, useCallback } from "react";
import {View,Text,TouchableOpacity,StyleSheet,FlatList,Dimensions,} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Audio, AVPlaybackStatus } from "expo-av";

const { width } = Dimensions.get("window");

type Lesson = {
  id: string;
  title: string;
  screen: string;
};

const lessons: Lesson[] = [
  { id: "1", title: "Word Pronunciation", screen: "/wordpronunce" },
  { id: "2", title: "Sentence Builder", screen: "/sentencebuild" },
  { id: "3", title: "Fix the Sentence", screen: "/fixsentence" },
];

export default function Pract(): JSX.Element {
  const router = useRouter();

  // ✅ PROPERLY TYPED REF
  const backgroundMusicRef = useRef<Audio.Sound | null>(null);

  // ✅ STOP & CLEANUP MUSIC
  const stopBackgroundMusic = async () => {
    if (backgroundMusicRef.current) {
      await backgroundMusicRef.current.stopAsync();
      await backgroundMusicRef.current.unloadAsync();
      backgroundMusicRef.current = null;
    }
  };

  // ✅ PLAY CLICK SOUND THEN NAVIGATE
  const playAndNavigate = async (screen: string) => {
    try {
      await stopBackgroundMusic();

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/drop.mp3")
      );

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          router.push(screen as any);
        }
      });
    } catch {
      router.push(screen as any);
    }
  };

  // ✅ PLAY CLICK SOUND THEN GO BACK
  const playAndGoBack = async () => {
    try {
      await stopBackgroundMusic();

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/drop.mp3")
      );

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          router.back();
        }
      });
    } catch {
      router.back();
    }
  };

  // ✅ AUTO PLAY BACKGROUND MUSIC + CLEANUP
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const playMusic = async () => {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/music/fun.mp3"),
          { isLooping: true }
        );

        if (isActive) {
          backgroundMusicRef.current = sound;
          await sound.playAsync();
        }
      };

      playMusic();

      return () => {
        isActive = false;
        stopBackgroundMusic();
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={playAndGoBack}>
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>

        <Text style={styles.title}>PRACTICES</Text>
      </View>

      <View style={styles.divider} />

      {/* HORIZONTAL SWIPE */}
      <FlatList
        data={lessons}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.lessonItem}
            activeOpacity={0.8}
            onPress={() => playAndNavigate(item.screen)}
          >
            <Text style={styles.lessonTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a29bfe",
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
  backText: {
    fontWeight: "bold",
    color: "#6c5ce7",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginRight: 40,
  },
  divider: {
    width: "90%",
    height: 2,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  list: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  lessonItem: {
    width: width * 0.8,
    height: 220,
    backgroundColor: "#ffeaa7",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    elevation: 6,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2d3436",
  },
});
