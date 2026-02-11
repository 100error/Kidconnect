import GradientButton from "@/components/GradientButton";
import TutorialOverlay from "@/components/TutorialOverlay";
import { DailyProgress, getCurrent24hProgress, getDailyHistory, subscribeProgress } from "@/services/progress";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, ImageBackground, LayoutRectangle, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Progress from "react-native-progress";

const { width } = Dimensions.get('window');

const TUTORIAL_FILE = `${documentDirectory}tutorial_seen.json`;

const Home = () => {
  const navigation = useNavigation<any>();
  const bgMusicRef = useRef<Audio.Sound | null>(null);
  const lessonRef = useRef<View | null>(null);
  const progressRef = useRef<View | null>(null);
  
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);
  const [lessonLayout, setLessonLayout] = useState<LayoutRectangle | null>(null);
  const [progressLayout, setProgressLayout] = useState<LayoutRectangle | null>(null);

  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState<DailyProgress[]>([]);

  const menuItems = [
    { 
      id: "1", 
      title: "Vocabulary", 
      screen: "vocab", 
      icon: "book" as const,
      colors: ["#FFB74D", "#FF8A65"] as const // Orange Gradient
    },
    { 
      id: "2", 
      title: "Practice", 
      screen: "pract", 
      icon: "pencil" as const,
      colors: ["#F06292", "#BA68C8"] as const // Pink/Purple Gradient
    },
    { 
      id: "3", 
      title: "Games", 
      screen: "games", 
      icon: "game-controller" as const,
      colors: ["#4DD0E1", "#4FC3F7"] as const // Blue/Cyan Gradient
    },
  ];

  // HELPER: Stop & Unload Background Music
  const stopBgMusic = async () => {
    if (bgMusicRef.current) {
      try {
        await bgMusicRef.current.stopAsync();
      } catch (e) { console.log("Stop bg music error", e); }
      try {
        await bgMusicRef.current.unloadAsync();
      } catch (e) { console.log("Unload bg music error", e); }
      bgMusicRef.current = null;
    }
  };

  // PLAY BACKGROUND MUSIC
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadAndPlayMusic = async () => {
        try {
          await stopBgMusic();

          const { sound } = await Audio.Sound.createAsync(
            require("../assets/music/fun.mp3"),
            { shouldPlay: true, isLooping: true, volume: 0.3 }
          );
          
          if (isActive) {
            bgMusicRef.current = sound;
          } else {
            try { await sound.unloadAsync(); } catch(e) {}
          }
        } catch (e) {
          console.log("Error loading music", e);
        }
      };

      loadAndPlayMusic();
      
      // Check progress on focus (handles 24h reset)
      getCurrent24hProgress().then(setOverallProgress).catch(() => {});

      return () => {
        isActive = false;
        stopBgMusic();
        Speech.stop(); // Stop any narration/TTS
      };
    }, [])
  );

  useEffect(() => {
    checkTutorial();
    // Load PROGRESS initially
    getCurrent24hProgress().then(setOverallProgress).catch(() => {});
    
    // Subscribe to updates
    const unsub = subscribeProgress((_id) => {
      getCurrent24hProgress().then(setOverallProgress).catch(() => {});
    });

    // Measure targets once views are laid out
    const measureTargets = () => {
      // Measure lesson buttons container
      if (lessonRef.current && typeof lessonRef.current.measureInWindow === "function") {
        lessonRef.current.measureInWindow((x, y, width, height) => {
          setLessonLayout({ x, y, width, height });
        });
      }
      // Measure progress circle container
      if (progressRef.current && typeof progressRef.current.measureInWindow === "function") {
        progressRef.current.measureInWindow((x, y, width, height) => {
          setProgressLayout({ x, y, width, height });
        });
      }
    };
    const id = setTimeout(measureTargets, 500);

    return () => {
      stopBgMusic();
      clearTimeout(id);
      unsub();
    };
  }, []);

  const checkTutorial = async () => {
    try {
      const info = await getInfoAsync(TUTORIAL_FILE);
      if (!info.exists) {
        setShouldShowTutorial(true);
        return;
      }
      try {
        const content = await readAsStringAsync(TUTORIAL_FILE);
        const data = JSON.parse(content || "{}");
        if (!data.seen) {
          setShouldShowTutorial(true);
        }
      } catch {
        setShouldShowTutorial(true);
      }
    } catch (e) {
      console.log("Error checking tutorial:", e);
    }
  };

  const handleTutorialClose = async () => {
    setTutorialVisible(false);
    try {
      await writeAsStringAsync(TUTORIAL_FILE, JSON.stringify({ seen: true }));
    } catch (e) {
      console.log("Error saving tutorial state:", e);
    }
  };

  const handleLessonPress = async (item: { screen: string; title: string }) => {
    // Play TTS and navigate
    Speech.stop();
    Speech.speak(item.title, { rate: 1.0, pitch: 1.1 });
    
    try {
      navigation.navigate(item.screen);
    } catch (error) {
      console.log(error);
      navigation.navigate(item.screen);
    }
  };

  const handleProgressPress = async () => {
    try {
      const history = await getDailyHistory();
      setHistoryData(history);
      setHistoryVisible(true);
    } catch (e) {
      console.log("Error loading history", e);
    }
  };

  // Defer showing tutorial until key layouts are available, with a fallback timer
  useEffect(() => {
    if (!shouldShowTutorial) return;
    if (lessonLayout || progressLayout) {
      setTutorialVisible(true);
      return;
    }
    const id = setTimeout(() => setTutorialVisible(true), 1500);
    return () => clearTimeout(id);
  }, [shouldShowTutorial, lessonLayout, progressLayout]);

  return (
    <ImageBackground
      source={require("../assets/int.png")}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section - Top Right */}
          <View 
            style={styles.headerContainer}
            ref={progressRef}
            onLayout={(event) => setProgressLayout(event.nativeEvent.layout)}
          >
             <TouchableOpacity 
               style={styles.progressWrapper} 
               onPress={handleProgressPress}
               activeOpacity={0.8}
             >
              <Progress.Circle
                size={80}
                progress={overallProgress / 100}
                showsText={true}
                formatText={() => `${Math.round(overallProgress)}%`}
                color="rgb(29, 153, 181)"
                unfilledColor="rgba(255, 255, 255, 0.17)"
                borderWidth={2}
                thickness={6}
                textStyle={{ fontWeight: "bold", fontSize: 16 }}
              />
            </TouchableOpacity>
          </View>

          {/* Welcome Title */}
          <Text style={styles.welcomeText}>Hi! Ready to learn?</Text>

          {/* Lesson Buttons */}
          <View 
            style={styles.lessonContainer}
            ref={lessonRef}
            onLayout={(event) => setLessonLayout(event.nativeEvent.layout)}
          >
            {menuItems.map((item) => (
              <GradientButton
                key={item.id}
                title={item.title}
                icon={item.icon}
                colors={item.colors}
                onPress={() => handleLessonPress(item)}
              />
            ))}
          </View>

          <TutorialOverlay
              isVisible={tutorialVisible}
              onClose={handleTutorialClose}
              lessonLayout={lessonLayout}
              progressLayout={progressLayout}
          />

          {/* History Modal */}
          <Modal
            visible={historyVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setHistoryVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>My Progress 📅</Text>
                  <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                    <Ionicons name="close-circle" size={32} color="#999" />
                  </TouchableOpacity>
                </View>
                
                {historyData.length === 0 ? (
                   <View style={styles.emptyHistory}>
                     <Text style={styles.emptyText}>Start playing to see your history!</Text>
                   </View>
                ) : (
                  <FlatList
                    data={historyData}
                    keyExtractor={(item) => item.date}
                    contentContainerStyle={styles.historyList}
                    renderItem={({ item }) => (
                      <View style={styles.historyItem}>
                        <View style={styles.dateContainer}>
                          <Ionicons name="calendar-outline" size={20} color="#4AC3FF" />
                          <Text style={styles.historyDate}>{item.date}</Text>
                        </View>
                        <View style={styles.scoreContainer}>
                           <View style={[styles.progressBar, { width: `${Math.min(item.percent, 100)}%` }]} />
                           <Text style={styles.historyScore}>{item.percent}%</Text>
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: "cover",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 20,
    marginBottom: 10,
    height: 95, // Explicit height for layout stability
  },
  progressWrapper: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 5,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: "center",
    marginTop: 10,
  },
  lessonContainer: {
    width: "100%",
    // height: 50, // REMOVED to allow content to flow naturally
    alignItems: "center",
  },
  cardSpacing: {
    marginBottom: 20,
  },
  // Removed overlapping absolute positioning styles
  progressContainer: {
    // Legacy style removed to prevent overlap
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#eef7f9',
    borderRadius: 25,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    marginBottom: 15,
    backgroundColor: '#b0e9f3c2',
    padding: 15,
    borderRadius: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginLeft: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    backgroundColor: '#ffffffc2',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#91daff',
  },
  historyScore: {
    position: 'absolute',
    right: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default Home;
