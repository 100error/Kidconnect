import GameWordCard from "@/components/game/GameWordCard";
import InstructionButton from "@/components/InstructionButton";
import OfflineGuard from "@/components/OfflineGuard";
import { useInstruction } from "@/hooks/useInstruction";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { addResult } from "@/services/progress";
import { speechService } from "@/services/speechService";
import { speakCorrection, speakPraise } from "@/services/voiceFeedback";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    BackHandler,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

/* ---------------- GAME DATA ---------------- */

const GAME_WORDS: { word: string; image: any }[] = [
  { word: "Aisle", image: require("@/assets/gamepronounce/aisle.png") },
  { word: "Autumn", image: require("@/assets/gamepronounce/autumn.png") },
  { word: "Ballet", image: require("@/assets/gamepronounce/ballet.png") },
  { word: "Beautiful", image: require("@/assets/gamepronounce/beautiful.png") },
  { word: "Calm", image: require("@/assets/gamepronounce/calm.png") },
  { word: "Castle", image: require("@/assets/gamepronounce/castle.png") },
  { word: "Chauffeur", image: require("@/assets/gamepronounce/chauffeur.png") },
  { word: "Choir", image: require("@/assets/gamepronounce/choir.png") },
  { word: "Climb", image: require("@/assets/gamepronounce/climb.png") },
  { word: "Comb", image: require("@/assets/gamepronounce/comb.png") },
  { word: "Cough", image: require("@/assets/gamepronounce/cough.png") },
  { word: "Croissant", image: require("@/assets/gamepronounce/croissant.png") },
  { word: "Daughter", image: require("@/assets/gamepronounce/daughter.png") },
  { word: "Exhaust", image: require("@/assets/gamepronounce/exhaust.png") },
  { word: "Gnome", image: require("@/assets/gamepronounce/gnome.png") },
  { word: "Guide", image: require("@/assets/gamepronounce/guide.png") },
  { word: "Guitar", image: require("@/assets/gamepronounce/guitar.png") },
  {
    word: "Handkerchief",
    image: require("@/assets/gamepronounce/handkerchief.png"),
  },
  { word: "Height", image: require("@/assets/gamepronounce/height.png") },
  { word: "Hymns", image: require("@/assets/gamepronounce/hymns.png") },
  { word: "Island", image: require("@/assets/gamepronounce/island.png") },
  { word: "Knee", image: require("@/assets/gamepronounce/knee.png") },
  { word: "Knife", image: require("@/assets/gamepronounce/knife.png") },
  { word: "Knight", image: require("@/assets/gamepronounce/knight.png") },
  { word: "Knock", image: require("@/assets/gamepronounce/knock.png") },
  { word: "Laugh", image: require("@/assets/gamepronounce/laugh.png") },
  { word: "Listen", image: require("@/assets/gamepronounce/listen.png") },
  {
    word: "Matchstick",
    image: require("@/assets/gamepronounce/matchstick.png"),
  },
  { word: "Muscle", image: require("@/assets/gamepronounce/muscle.png") },
  {
    word: "Psychology",
    image: require("@/assets/gamepronounce/psychology.png"),
  },
  { word: "Queue", image: require("@/assets/gamepronounce/queue.png") },
  { word: "Receipt", image: require("@/assets/gamepronounce/receipt.png") },
  { word: "Rhythm", image: require("@/assets/gamepronounce/rhythm.png") },
  { word: "Scissor", image: require("@/assets/gamepronounce/scissor.png") },
  {
    word: "Silhouette",
    image: require("@/assets/gamepronounce/silhouette.png"),
  },
  { word: "Walk", image: require("@/assets/gamepronounce/walk.png") },
  { word: "Wheat", image: require("@/assets/gamepronounce/wheat.png") },
  { word: "Wrap", image: require("@/assets/gamepronounce/wrap.png") },
  { word: "Wrist", image: require("@/assets/gamepronounce/wrist.png") },
  { word: "Yacht", image: require("@/assets/gamepronounce/yacht.png") },
];

export default function GamePronunciation() {
  const router = useRouter();
  const { isMountedRef, safeRun } = useSafeAsync();
  const isRunningRef = useRef(false); // ✅ MULTIPLE EXECUTION GUARD
  const isExitingRef = useRef(false); // ✅ Fix: define isExitingRef

  const [restartCount, setRestartCount] = useState(0);
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);

  const hasSavedRef = useRef(false); // ✅ SAVE LOCK
  const sessionIdRef = useRef(`${Date.now()}`); // ✅ UNIQUE SESSION ID

  // Reset lock when screen loads
  useEffect(() => {
    hasSavedRef.current = false;
    sessionIdRef.current = `${Date.now()}`;
    isExitingRef.current = false;
  }, []);

  // ✅ CENTRALIZED SAFE EXIT
  const safeExit = useCallback(async () => {
    isExitingRef.current = true;
    try {
      await speechService.stopRecording();
      Speech.stop();
    } catch (e) {
      console.log("Safe Exit Error:", e);
    }
    if (!isMountedRef.current) return;
    router.replace("/games");
  }, [router, isMountedRef]);

  // Global Cleanup on Unmount
  useEffect(() => {
    const backAction = () => {
      void safeExit();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => {
      backHandler.remove();
      isExitingRef.current = true;
      void speechService.stopRecording();
      Speech.stop();
    };
  }, [safeExit]);

  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const numColumns = isTablet ? 4 : 2;
  const GAP = 16;
  const PADDING = 16;
  const itemWidth = (width - PADDING * 2 - GAP * (numColumns - 1)) / numColumns;

  /* ---------------- INSTRUCTIONS ---------------- */

  const { play: playInstruction } = useInstruction(
    "pronunciation-game",
    "Tap the microphone and say the word shown on the card.",
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        void speechService.stopRecording();
        Speech.stop();
      };
    }, []),
  );

  /* ---------------- GAME WORDS ---------------- */

  const gameItems = useMemo(() => {
    // Fisher-Yates shuffle algorithm for proper randomization
    const shuffledPool = [...GAME_WORDS];
    for (let i = shuffledPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
    }

    // Select 10 unique words from the shuffled pool
    return shuffledPool.slice(0, 10);
  }, [restartCount]);

  /* ---------------- RESULT HANDLERS ---------------- */

  const handleSuccess = (word: string) => {
    if (completedWords.includes(word) || !isMountedRef.current) return;

    const updated = [...completedWords, word];
    setCompletedWords(updated);

    if (updated.length === gameItems.length) {
      setTimeout(async () => {
        if (!isMountedRef.current) return;
        setShowResult(true);
        const score = 10 - mistakes.size;
        const passed = score >= 6;

        Speech.stop();

        if (passed) {
          speakPraise("Congratulations! You passed!");
        } else {
          speakCorrection("Good try! Practice more.");
        }

        if (!hasSavedRef.current) {
          hasSavedRef.current = true;
          await safeRun(() =>
            addResult({
              activityId: "speakit",
              sessionId: sessionIdRef.current,
              category: "game",
              score: Math.max(0, score),
              maxScore: 10,
              completed: true,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      }, 800);
    }
  };

  const handleFailure = (word: string) => {
    if (!isMountedRef.current) return;
    setMistakes((prev) => new Set(prev).add(word));
  };

  const handleRestart = () => {
    if (!isMountedRef.current || isRunningRef.current) return;
    isRunningRef.current = true;
    Speech.stop();
    setCompletedWords([]);
    setMistakes(new Set());
    setShowResult(false);
    hasSavedRef.current = false; // ✅ Reset guard on restart
    sessionIdRef.current = `${Date.now()}`; // ✅ New session ID
    isExitingRef.current = false;
    setRestartCount((c) => c + 1);
    isRunningRef.current = false;
  };

  const handleExit = () => {
    if (!isMountedRef.current || isRunningRef.current) return;
    isRunningRef.current = true;
    safeExit();
  };

  /* ---------------- UI ---------------- */

  return (
    <LinearGradient colors={["#FFF3E0", "#FFCCBC"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <OfflineGuard>
          <StatusBar barStyle="dark-content" />

          <View style={styles.header}>
            <TouchableOpacity onPress={safeExit} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#3E2723" />
            </TouchableOpacity>
            <InstructionButton onPress={playInstruction} />
            <Text style={styles.title}>Speak It!</Text>
          </View>

          <Text style={styles.subtitle}>Tap the mic and say the word</Text>

          <FlatList
            data={gameItems}
            keyExtractor={(item, i) => `${item.word}-${i}`}
            key={numColumns} // Force re-render on column change
            numColumns={numColumns}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={[styles.columnWrapper, { gap: GAP }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <GameWordCard
                word={item.word}
                image={item.image}
                disabled={completedWords.includes(item.word)}
                isExiting={isExitingRef.current}
                color={completedWords.includes(item.word) ? "#E8F5E9" : "#FFF"}
                style={{ width: itemWidth, margin: 0 }}
                onSuccess={() => handleSuccess(item.word)}
                onFailure={() => handleFailure(item.word)}
              />
            )}
          />

          {/* ---------------- RESULT MODAL ---------------- */}

          <Modal
            visible={showResult}
            transparent
            animationType="fade"
            onRequestClose={handleExit}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Game Complete!</Text>

                <Text style={styles.scoreValue}>
                  {Math.max(0, 10 - mistakes.size)} / 10
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.tryAgainButton}
                    onPress={handleRestart}
                  >
                    <Text style={styles.modalButtonText}>TRY AGAIN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.exitButton}
                    onPress={handleExit}
                  >
                    <Text style={styles.modalButtonText}>EXIT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </OfflineGuard>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#BF360C",
  },
  scoreBadge: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: { fontWeight: "700", color: "#BF360C" },
  subtitle: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 16,
    color: "#5D4037",
    fontWeight: "600",
  },
  listContainer: { padding: 16 },
  columnWrapper: { justifyContent: "flex-start" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 20,
    width: "90%",
    maxWidth: 500,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "900",
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  tryAgainButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 14,
  },
  exitButton: {
    backgroundColor: "#FF5722",
    padding: 16,
    borderRadius: 14,
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "800",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});
