import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Audio } from "expo-av";

const { width } = Dimensions.get("window");

const games = [
  { id: "1", title: "Odd Word Out", screen: "oddwordout" },
  { id: "2", title: "Rhyme Time", screen: "rhymetime" },
];

export default function Games() {
  const router = useRouter();
  const clickSoundRef = useRef<Audio.Sound | null>(null);
  const backgroundMusicRef = useRef<Audio.Sound | null>(null);

  const stopBackgroundMusic = async () => {
    if (backgroundMusicRef.current) {
      await backgroundMusicRef.current.stopAsync();
      await backgroundMusicRef.current.unloadAsync();
      backgroundMusicRef.current = null;
    }
  };

  const playAndNavigate = async (screenName: string) => {
    try {
      await stopBackgroundMusic();

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/drop.mp3")
      );
      clickSoundRef.current = sound;
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
          await sound.unloadAsync();
          router.push(screenName);
        }
      });
    } catch (error) {
      console.error("Navigate error:", error);
      router.push(screenName);
    }
  };

  const playAndGoBack = async () => {
    try {
      await stopBackgroundMusic();

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/drop.mp3")
      );
      clickSoundRef.current = sound;
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
          await sound.unloadAsync();
          router.back();
        }
      });
    } catch (error) {
      console.error("Back error:", error);
      router.back();
    }
  };

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const playBackgroundMusic = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("../assets/music/fun.mp3"),
            { shouldPlay: true, isLooping: true }
          );

          if (mounted) {
            backgroundMusicRef.current = sound;
            await sound.playAsync();
          }
        } catch (error) {
          console.error("BGM error:", error);
        }
      };

      playBackgroundMusic();

      return () => {
        mounted = false;
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
        <Text style={styles.title}>GAMES</Text>
      </View>

      <View style={styles.divider} />

      {/* HORIZONTAL SWIPE LIST */}
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        horizontal={true} // enable horizontal swipe
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        snapToAlignment="center"
        decelerationRate="fast"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gameItem}
            activeOpacity={0.7}
            onPress={() => playAndNavigate(item.screen)}
          >
            <Text style={styles.gameTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a1c4fd",
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
  backText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
    marginRight: 30,
  },
  divider: {
    width: "90%",
    height: 2,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  gameItem: {
    backgroundColor: "#ffeaa7",
    width: width * 0.75, // slightly smaller for horizontal swipe
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10, // spacing between items
    borderRadius: 20,
    elevation: 6,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
    textAlign: "center",
  },
});
