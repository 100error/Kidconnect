import React, { useRef, useCallback } from "react";
import {View,Text,TouchableOpacity,StyleSheet,FlatList,Dimensions,} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Audio } from "expo-av";

const { width } = Dimensions.get("window");

const lessons = [
  { id: "1", title: "Vowel digraphs in common words", screen: "common" },
  { id: "2", title: "Common & Proper Nouns", screen: "nouns" },
  { id: "3", title: "Tense-related words", screen: "tenses" },  
  { id: "4", title: "Irregularly spelled words", screen: "irregular" },
  { id: "5", title: "Comparison words", screen: "comparison" },
  { id: "6", title: "Plural nouns", screen: "plural" },
  { id: "7", title: "Question words", screen: "questions" },
  { id: "8", title: "Dialogue words", screen: "dialogue" },
  { id: "9", title: "Context clues words", screen: "context" },
  { id: "10", title: "Problem-solving words", screen: "problemsolving" },
  { id: "11", title: "Irregularly spelled words", screen: "spelled" },
];

const Vocab = () => {
  const router = useRouter();
  const clickSoundRef = useRef<Audio.Sound | null>(null);
  const backgroundMusicRef = useRef<Audio.Sound | null>(null);

  // Stop background music
  const stopBackgroundMusic = async () => {
    if (backgroundMusicRef.current) {
      await backgroundMusicRef.current.stopAsync();
      await backgroundMusicRef.current.unloadAsync();
      backgroundMusicRef.current = null;
    }
  };

  // Play click sound then navigate
  const playAndNavigate = async (screenName: string) => {
    try {
      await stopBackgroundMusic();
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/drop.mp3")
      );
      clickSoundRef.current = sound;
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
          router.push(screenName);
        }
      });
    } catch (error) {
      console.error("Navigation sound error:", error);
      router.push(screenName);
    }
  };

  // Back button with sound
  const playAndGoBack = async () => {
    try {
      await stopBackgroundMusic();
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/drop.mp3")
      );
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
          router.back();
        }
      });
    } catch (error) {
      router.back();
    }
  };

  // Background music
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const playBackgroundMusic = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("../assets/music/fun.mp3"),
            { isLooping: true }
          );
          if (isActive) {
            backgroundMusicRef.current = sound;
            await sound.playAsync();
          }
        } catch (error) {
          console.log("Background music error", error);
        }
      };

      playBackgroundMusic();

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
        <Text style={styles.title}>VOCABULARY</Text>
      </View>

      <View style={styles.divider} />

      {/* SWIPE LESSONS */}
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        decelerationRate="fast"
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#74b9ff",
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: "#dff9fb",
    padding: 10,
    borderRadius: 30,
    elevation: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0984e3",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 40,
  },
  divider: {
    width: "90%",
    height: 2,
    backgroundColor: "#fff",
    marginVertical: 20,
  },
  list: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  lessonItem: {
    width: width * 0.75,
    height: 220,
    backgroundColor: "#ffeaa7",
    borderRadius: 30,
    marginHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  swipeHint: {
    marginTop: 15,
    fontSize: 14,
    color: "#636e72",
  },
});

export default Vocab;
