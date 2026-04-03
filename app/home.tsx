import GradientButton from "@/components/GradientButton";
import KicoMascot from "@/components/KicoMascot";
import SettingsModal from "@/components/SettingsModal"; // Import Modal
import TutorialOverlay from "@/components/TutorialOverlay";
import { audioService } from "@/services/audio/audioService";
import { MUSIC_SOURCES, musicService } from "@/services/audio/music";
import { profileService } from "@/services/profile"; // Import Profile Service
import {
  DailyProgress,
  getCurrent24hProgress,
  getDailyHistory,
  subscribeProgress,
} from "@/services/progress";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Progress from "react-native-progress";

const { width } = Dimensions.get("window");

const TUTORIAL_FILE = `${documentDirectory}tutorial_seen.json`;

const Home = () => {
  const navigation = useNavigation<any>();
  const lessonRef = useRef<View>(null);
  const progressRef = useRef<View>(null);

  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);
  const [isHomeTutorial, setIsHomeTutorial] = useState(false);
  const [lessonLayout, setLessonLayout] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);
  const [progressLayout, setProgressLayout] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);

  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState<DailyProgress[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  const [settingsVisible, setSettingsVisible] = useState(false); // Settings Modal State
  const lastEncouragementProgress = useRef(0);

  const menuItems = [
    {
      id: "1",
      title: "Vocabulary",
      screen: "vocab",
      icon: "book" as const,
      colors: ["#FFB74D", "#FF8A65"] as const, // Orange Gradient
    },
    {
      id: "2",
      title: "Practice",
      screen: "pract",
      icon: "pencil" as const,
      colors: ["#F06292", "#BA68C8"] as const, // Pink/Purple Gradient
    },
    {
      id: "3",
      title: "Games",
      screen: "games",
      icon: "game-controller" as const,
      colors: ["#4DD0E1", "#4FC3F7"] as const, // Blue/Cyan Gradient
    },
  ];

  // Monitor Progress for Encouragement
  useEffect(() => {
    if (overallProgress - lastEncouragementProgress.current >= 10) {
      // kicoRef.current?.showEncouragement(overallProgress);
      lastEncouragementProgress.current = overallProgress;
    }
  }, [overallProgress]);

  // ✅ AUTO-PLAY BACKGROUND MUSIC ON FOCUS
  useFocusEffect(
    useCallback(() => {
      void musicService.playAsync(MUSIC_SOURCES.home);

      // Check progress on focus (handles 24h reset)
      getCurrent24hProgress()
        .then(setOverallProgress)
        .catch(() => {});

      // Load Profile Name
      profileService
        .getProfile()
        .then((p) => {
          if (p?.username) setUsername(p.username);
        })
        .catch(() => {});

      return () => {
        // We don't stop here, because we want music to transition smoothly
        // musicService.playAsync will handle stopping the previous track
        Speech.stop(); // Stop any narration/TTS
      };
    }, []),
  );

  useEffect(() => {
    checkTutorial();
    // Load PROGRESS initially
    getCurrent24hProgress()
      .then(setOverallProgress)
      .catch(() => {});

    // Subscribe to updates
    const unsub = subscribeProgress((_id) => {
      getCurrent24hProgress()
        .then(setOverallProgress)
        .catch(() => {});
    });

    // Measure targets once views are laid out
    const measureTargets = () => {
      // Measure lesson buttons container
      if (
        lessonRef.current &&
        typeof lessonRef.current.measureInWindow === "function"
      ) {
        lessonRef.current.measureInWindow((x, y, width, height) => {
          setLessonLayout({ x, y, width, height });
        });
      }
      // Measure progress circle container
      if (
        progressRef.current &&
        typeof progressRef.current.measureInWindow === "function"
      ) {
        progressRef.current.measureInWindow((x, y, width, height) => {
          setProgressLayout({ x, y, width, height });
        });
      }
    };
    const id = setTimeout(measureTargets, 500);

    return () => {
      clearTimeout(id);
      unsub();
    };
  }, []);

  const checkTutorial = async () => {
    try {
      const info = await getInfoAsync(TUTORIAL_FILE);
      if (!info.exists) {
        setIsHomeTutorial(true);
        setShouldShowTutorial(true);
        return;
      }
      try {
        const content = await readAsStringAsync(TUTORIAL_FILE);
        const data = JSON.parse(content || "{}");
        if (!data.seen) {
          setIsHomeTutorial(true);
          setShouldShowTutorial(true);
        }
      } catch {
        setIsHomeTutorial(true);
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
    // Stop any existing TTS before navigating
    audioService.speak(item.title);

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

    if (isHomeTutorial) {
      setTutorialVisible(true);
      return;
    }

    if (lessonLayout || progressLayout) {
      setTutorialVisible(true);
      return;
    }
    const id = setTimeout(() => setTutorialVisible(true), 1500);
    return () => clearTimeout(id);
  }, [shouldShowTutorial, isHomeTutorial, lessonLayout, progressLayout]);

  return (
    <ImageBackground source={require("@/assets/int.png")} style={styles.bg}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            {/* Settings Button - Top Left */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setSettingsVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="menu" size={32} color="#496e62ff" />
            </TouchableOpacity>

            {/* Progress Section - Top Right */}
            <TouchableOpacity
              style={styles.progressWrapper}
              onPress={handleProgressPress}
              activeOpacity={0.8}
              ref={progressRef}
              onLayout={(event) => setProgressLayout(event.nativeEvent.layout)}
            >
              <Progress.Circle
                size={70}
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

          {/* Mascot Animation */}
          <KicoMascot />

          {/* Welcome Title */}

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

          <SettingsModal
            visible={settingsVisible}
            onClose={() => setSettingsVisible(false)}
          />

          <TutorialOverlay
            isVisible={tutorialVisible}
            onClose={() => {
              void handleTutorialClose();
            }}
            lessonLayout={lessonLayout}
            progressLayout={progressLayout}
            isHomeTutorial={isHomeTutorial}
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
                    <Text style={styles.emptyText}>
                      Start playing to see your history!
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={historyData}
                    keyExtractor={(item) => item.date}
                    contentContainerStyle={styles.historyList}
                    renderItem={({ item }) => (
                      <View style={styles.historyItem}>
                        <View style={styles.dateContainer}>
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#4AC3FF"
                          />
                          <Text style={styles.historyDate}>{item.date}</Text>
                        </View>
                        <View style={styles.scoreContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              { width: `${Math.min(item.percent, 100)}%` },
                            ]}
                          />
                          <Text style={styles.historyScore}>
                            {item.percent}%
                          </Text>
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
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    height: 95,
  },
  menuButton: {
    padding: 10,
    backgroundColor: "rgba(205, 222, 222, 0.2)",
    color: "rgba(16, 93, 93, 0.2)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  progressWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.24)",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#eef7f9",
    borderRadius: 25,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    marginBottom: 15,
    backgroundColor: "#b0e9f3c2",
    padding: 15,
    borderRadius: 15,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginLeft: 8,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    backgroundColor: "#ffffffc2",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#91daff",
  },
  historyScore: {
    position: "absolute",
    right: 10,
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  emptyHistory: {
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});

export default Home;
