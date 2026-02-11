import GradientButton from "@/components/GradientButton";
import BackButton from "@/components/ui/BackButton";
import { Audio } from "expo-av";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef } from "react";
import { FlatList, ImageBackground, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

const games = [
  { 
    id: "1", 
    title: "Odd Word Out", 
    screen: "/(tabs)/oddwordout", 
    icon: "help" as const,
    colors: ["#FFB74D", "#FF8A65"] as const 
  },
  {  
    id: "2", 
    title: "Story Speak", 
    screen: "/(tabs)/storyspeak", 
    icon: "book" as const,
    colors: ["#EC407A", "#F06292"] as const 
  },
  { 
    id: "3", 
    title: "Speak It! Game", 
    screen: "/(tabs)/games/pronunciation", 
    icon: "mic-circle" as const,
    colors: ["#29B6F6", "#4FC3F7"] as const 
  },
];

export default function Games() {
  const router = useRouter();
  const clickSoundRef = useRef<Audio.Sound | null>(null);
  const backgroundMusicRef = useRef<Audio.Sound | null>(null);

  // ✅ STOP BACKGROUND MUSIC
  const stopBackgroundMusic = async () => {
    if (backgroundMusicRef.current) {
      try {
        await backgroundMusicRef.current.stopAsync();
      } catch (e) { console.log("Stop error", e); }
      try {
        await backgroundMusicRef.current.unloadAsync();
      } catch (e) { console.log("Unload error", e); }
      backgroundMusicRef.current = null;
    }
  };

  // ✅ REUSABLE SOUND + NAVIGATION
  const playClickAndNavigate = async (route?: string, goBack?: boolean) => {
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
          try {
             if (clickSoundRef.current === sound) {
                 clickSoundRef.current = null;
             }
             await sound.unloadAsync();
          } catch (e) {}

          if (goBack) {
            router.back();
          } else if (route) {
            router.push(route as any);
          }
        }
      });
    } catch (error) {
      console.log("Navigation sound error:", error);

      if (goBack) router.back();
      if (route) router.push(route as any);
    }
  };

  // ✅ BACKGROUND MUSIC
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const playMusic = async () => {
        try {
          await stopBackgroundMusic();
          const { sound } = await Audio.Sound.createAsync(
            require("../assets/music/fun.mp3"),
            { isLooping: true }
          );

          if (isActive) {
            backgroundMusicRef.current = sound;
            await sound.playAsync();
          } else {
             await sound.unloadAsync();
          }
        } catch (error) {
          console.log("Background music error:", error);
        }
      };

      playMusic();

      return () => {
        isActive = false;
        stopBackgroundMusic();
        Speech.stop();
      };
    }, [])
  );

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      if (clickSoundRef.current) {
         clickSoundRef.current.unloadAsync().catch(()=>{});
      }
      if (backgroundMusicRef.current) {
         backgroundMusicRef.current.unloadAsync().catch(()=>{});
      }
    };
  }, []);

  return (
    <ImageBackground 
      source={require("@/assets/images/int.png")} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton targetRoute="/home" />

          <Text style={styles.title}>GAMES</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* GAMES LIST */}
        <FlatList
          data={games}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A1B9A',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f8f6faff",
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
