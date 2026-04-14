import InstructionButton from "@/components/InstructionButton";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from "@/hooks/useInstruction";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { musicService } from "@/services/audio/music";
import { playbackService } from "@/services/audio/playback";
import { TTS } from "@/services/audio/tts";
import { addResult } from "@/services/progress";
import { speechService } from "@/services/speechService";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

type SentenceItem = {
  id: string;
  jumbled: string;
  correct: string;
  image: any;
};

export default function Fixsentence() {
  const router = useRouter();
  const { isMountedRef, safeRun } = useSafeAsync();
  const isRunningRef = useRef(false); // ✅ MULTIPLE EXECUTION GUARD
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const numColumns = isTablet ? 2 : 1;
  const gap = 20;
  const padding = 20;
  const cardWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  // Static data
  const rawSentenceData: SentenceItem[] = [
    {
      id: "1",
      jumbled: "dog The brown is fast",
      correct: "The brown dog is fast.",
      image: require("@/assets/fixsentence/running.png"),
    },
    {
      id: "2",
      jumbled: "ate I banana a",
      correct: "I ate a banana.",
      image: require("@/assets/fixsentence/eating.png"),
    },
    {
      id: "3",
      jumbled: "blue The sky is",
      correct: "The sky is blue.",
      image: require("@/assets/fixsentence/blue.png"),
    },
    {
      id: "4",
      jumbled: "runs boy The fast very",
      correct: "The boy runs very fast.",
      image: require("@/assets/fixsentence/run.png"),
    },
    {
      id: "5",
      jumbled: "cat The sleeping is",
      correct: "The cat is sleeping.",
      image: require("@/assets/fixsentence/napping.png"),
    },
    {
      id: "6",
      jumbled: "book reading I am a",
      correct: "I am reading a book.",
      image: require("@/assets/fixsentence/reading.png"),
    },
    {
      id: "7",
      jumbled: "sun The hot is",
      correct: "The sun is hot.",
      image: require("@/assets/fixsentence/hot.png"),
    },
    {
      id: "8",
      jumbled: "ball playing They are with a",
      correct: "They are playing with a ball.",
      image: require("@/assets/fixsentence/playingball.png"),
    },
    {
      id: "9",
      jumbled: "school to go I",
      correct: "I go to school.",
      image: require("@/assets/fixsentence/student.png"),
    },
    {
      id: "10",
      jumbled: "happy very am I",
      correct: "I am very happy.",
      image: require("@/assets/fixsentence/happy.png"),
    },
    {
      id: "11",
      jumbled: "big The dog is",
      correct: "The dog is big.",
      image: require("@/assets/fixsentence/bigdog.png"),
    },
    {
      id: "12",
      jumbled: "sun The bright is",
      correct: "The sun is bright.",
      image: require("@/assets/fixsentence/sun.png"),
    },
    {
      id: "13",
      jumbled: "telephone The ringing is",
      correct: "The telephone is ringing.",
      image: require("@/assets/fixsentence/telephone.png"),
    },
    {
      id: "14",
      jumbled: "tall The tree is",
      correct: "The tree is tall.",
      image: require("@/assets/fixsentence/tree.png"),
    },
    {
      id: "15",
      jumbled: "fast The car is",
      correct: "The car is fast.",
      image: require("@/assets/fixsentence/racing.png"),
    },
    {
      id: "16",
      jumbled: "cold The water is",
      correct: "The water is cold.",
      image: require("@/assets/fixsentence/water.png"),
    },
    {
      id: "17",
      jumbled: "bright The sun is",
      correct: "The sun is bright.",
      image: require("@/assets/fixsentence/sun.png"),
    },
    {
      id: "18",
      jumbled: "sweet The cake is",
      correct: "The cake is sweet.",
      image: require("@/assets/fixsentence/cake.png"),
    },
    {
      id: "19",
      jumbled: "clean The room is",
      correct: "The room is clean.",
      image: require("@/assets/fixsentence/room.png"),
    },
    {
      id: "20",
      jumbled: "new The bag is",
      correct: "The bag is new.",
      image: require("@/assets/fixsentence/bag.png"),
    },
  ];

  const [sentenceData, setSentenceData] = useState<SentenceItem[]>([]);

  // Randomize on mount
  useEffect(() => {
    const shuffled = [...rawSentenceData].sort(() => 0.5 - Math.random());
    setSentenceData(shuffled.slice(0, 10));
  }, []);

  // ✅ CENTRALIZED SAFE EXIT
  const safeExit = useCallback(async () => {
    await speechService.stopRecording();
    Speech.stop();
    if (!isMountedRef.current) return;
    router.replace("/pract");
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
      speechService.stopRecording();
      Speech.stop();
    };
  }, [safeExit]);

  // Audio Guidance
  useFocusEffect(
    useCallback(() => {
      // ✅ STOP BACKGROUND MUSIC ON LESSON SCREENS
      void musicService.stopAsync();

      // Play guidance when screen focuses/loads
      const playGuidance = async () => {
        // Stop any previous speech first
        await Speech.stop();
        if (!isMountedRef.current) return;
        // Speak the guidance
        TTS.speak(
          "These are declarative sentences. Tap the words in the right order to build the sentence.",
          {
            rate: 0.85, // Child-friendly slow rate
            pitch: 1.1, // Slightly higher pitch for kids
          },
        );
      };

      playGuidance();

      return () => {
        Speech.stop();
      };
    }, []),
  );

  // State to track progress for EACH sentence
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [feedbackState, setFeedbackState] = useState<
    Record<string, "correct" | "incorrect" | null>
  >({});
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);

  const hasSavedRef = useRef(false); // ✅ SAVE LOCK
  const sessionIdRef = useRef(`fixsentence-${Date.now()}`); // ✅ UNIQUE SESSION ID

  // Reset lock when screen loads or restarts
  useEffect(() => {
    hasSavedRef.current = false;
    sessionIdRef.current = `fixsentence-${Date.now()}`;
  }, []);

  // Instructions
  const { play: playInstruction } = useInstruction(
    "fixsentence",
    "Tap the words in the right order to build the sentence!",
  );

  const playSentence = (text: string) => {
    if (!isMountedRef.current) return;
    Speech.stop();
    TTS.speak(text, { rate: 0.85, pitch: 1.1 });
  };

  const handleWordSelect = (id: string, word: string) => {
    if (
      isRunningRef.current ||
      completedIds.includes(id) ||
      !isMountedRef.current
    )
      return;

    isRunningRef.current = true;
    const currentSelection = selections[id] || [];
    // Prevent selecting the same word instance multiple times (simple check)
    // In a real jumbled game, we might track indices, but here words are unique enough or we just append.
    // The original logic checked `!selectedWords.includes(word)`, implying unique words.
    if (!currentSelection.includes(word)) {
      const newSelection = [...currentSelection, word];
      setSelections({ ...selections, [id]: newSelection });

      Speech.stop();
      TTS.speak(word, { rate: 0.85, pitch: 1.1 });
      Haptics.selectionAsync();

      // Clear feedback when typing
      setFeedbackState({ ...feedbackState, [id]: null });
    }
    isRunningRef.current = false;
  };

  const handleReset = (id: string) => {
    if (
      isRunningRef.current ||
      completedIds.includes(id) ||
      !isMountedRef.current
    )
      return;
    isRunningRef.current = true;
    const newSelections = { ...selections };
    delete newSelections[id];
    setSelections(newSelections);
    setFeedbackState({ ...feedbackState, [id]: null });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isRunningRef.current = false;
  };

  const handleFinish = async (finalMistakes: Set<string>) => {
    if (hasSavedRef.current || !isMountedRef.current) return; // 🚫 BLOCK duplicates
    hasSavedRef.current = true;

    const calculatedScore = Math.max(0, 10 - finalMistakes.size);

    await safeRun(() =>
      addResult({
        activityId: "fixsentence",
        sessionId: sessionIdRef.current,
        category: "practice",
        score: calculatedScore,
        maxScore: 10,
        completed: true,
        timestamp: new Date().toISOString(),
      }),
    );
  };

  const handleCheck = async (item: SentenceItem) => {
    if (isRunningRef.current || !isMountedRef.current) return;
    isRunningRef.current = true;
    const userWords = selections[item.id] || [];
    const userSentence = userWords.join(" ");
    const correctSentence = item.correct.replace(/[.?!]/g, "").toLowerCase();

    // Normalize for comparison
    if (userSentence.toLowerCase() === correctSentence) {
      // Correct
      if (!completedIds.includes(item.id)) {
        const newCompleted = [...completedIds, item.id];
        setCompletedIds(newCompleted);
        setFeedbackState({ ...feedbackState, [item.id]: "correct" });

        playbackService.playSound("correct");
        Speech.stop();
        TTS.speak("Correct!", { rate: 0.85, pitch: 1.1 });
        TTS.speak(item.correct, { rate: 0.85, pitch: 1.1 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (newCompleted.length === sentenceData.length) {
          // Finish activity
          await handleFinish(mistakes);

          setTimeout(() => {
            if (!isMountedRef.current) return;
            setShowResult(true);
            const score = 10 - mistakes.size;
            const passed = score >= 6;
            Speech.stop();
            TTS.speak(
              passed
                ? "Congratulations! You passed!"
                : "Good try! Practice more.",
              { rate: 0.85, pitch: 1.1 },
            );
          }, 1000);
        }
      }
      isRunningRef.current = false;
    } else {
      // Incorrect
      if (!isMountedRef.current) {
        isRunningRef.current = false;
        return;
      }
      setFeedbackState({ ...feedbackState, [item.id]: "incorrect" });
      setMistakes((prev) => new Set(prev).add(item.id));
      playbackService.playSound("incorrect");
      Speech.stop();
      TTS.speak("Try again", { rate: 0.85, pitch: 1.1 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      isRunningRef.current = false;
    }
  };

  const handleRestart = () => {
    if (!isMountedRef.current || isRunningRef.current) return;
    isRunningRef.current = true;
    setSelections({});
    setCompletedIds([]);
    setFeedbackState({});
    setMistakes(new Set());
    hasSavedRef.current = false; // ✅ RESET LOCK
    sessionIdRef.current = `fixsentence-${Date.now()}`; // ✅ NEW SESSION ID
    setShowResult(false);
    Speech.stop();
    isRunningRef.current = false;
  };

  const handleExit = () => {
    if (!isMountedRef.current || isRunningRef.current) return;
    isRunningRef.current = true;
    safeExit();
  };

  return (
    <LinearGradient colors={["#E1F5FE", "#FFF3E0"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/pract" color="#0288D1" />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Fix the Sentence</Text>
          <Text style={styles.headerSubtitle}>Drag words to correct order</Text>
        </View>
        <InstructionButton onPress={playInstruction} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            flexDirection: isTablet ? "row" : "column",
            flexWrap: "wrap",
            gap: isTablet ? gap : 0,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sentenceData.map((item) => {
          const currentSelection = selections[item.id] || [];
          const isCompleted = completedIds.includes(item.id);
          const status = feedbackState[item.id];
          const jumbledWords = item.jumbled.split(" ");
          const slots = Array(jumbledWords.length).fill(null);

          return (
            <View key={item.id} style={[styles.card, { width: cardWidth }]}>
              {/* Top Section: Image + Sentence Slots */}
              <View style={styles.cardHeader}>
                <View style={styles.imageContainer}>
                  <Image
                    source={item.image}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                  />
                </View>

                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => playSentence(item.correct)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="volume-medium" size={24} color="#F57C00" />
                </TouchableOpacity>

                <View style={styles.sentenceContainer}>
                  <View style={styles.slotsRow}>
                    {slots.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.slot,
                          currentSelection[idx] ? styles.filledSlot : null,
                        ]}
                      >
                        <Text style={styles.slotText}>
                          {currentSelection[idx] || "____"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Status Feedback */}
              {status === "correct" && (
                <View style={styles.feedbackContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={[styles.feedbackText, { color: "#4CAF50" }]}>
                    Great Job!
                  </Text>
                </View>
              )}
              {status === "incorrect" && (
                <View style={styles.feedbackContainer}>
                  <Ionicons name="alert-circle" size={24} color="#F44336" />
                  <Text style={[styles.feedbackText, { color: "#F44336" }]}>
                    Oops! Try again.
                  </Text>
                </View>
              )}

              {/* Word Bank (Chips) */}
              <View style={styles.divider} />
              <Text style={styles.bankLabel}>Word Bank:</Text>
              <View style={styles.wordBank}>
                {jumbledWords.map((word, idx) => {
                  const isSelected = currentSelection.includes(word);
                  return (
                    <TouchableOpacity
                      key={`${word}-${idx}`}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipDisabled : null,
                        isCompleted ? styles.chipCompleted : null,
                      ]}
                      onPress={() => handleWordSelect(item.id, word)}
                      disabled={isSelected || isCompleted}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected ? styles.chipTextDisabled : null,
                        ]}
                      >
                        {word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Actions */}
              {!isCompleted && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.resetBtn,
                      { opacity: currentSelection.length > 0 ? 1 : 0.5 },
                    ]}
                    onPress={() => handleReset(item.id)}
                    disabled={currentSelection.length === 0}
                  >
                    <Ionicons name="refresh" size={20} color="#757575" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.checkBtn,
                      { opacity: currentSelection.length > 0 ? 1 : 0.5 },
                    ]}
                    onPress={() => handleCheck(item)}
                    disabled={currentSelection.length === 0}
                  >
                    <Text style={styles.checkBtnText}>Check</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showResult}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Practice Complete!</Text>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.scoreValue}>
                {Math.max(0, 10 - mistakes.size)} / 10
              </Text>
            </View>

            <View
              style={[
                styles.resultBadge,
                10 - mistakes.size >= 6 ? styles.resultPass : styles.resultFail,
              ]}
            >
              <Ionicons
                name={
                  10 - mistakes.size >= 6 ? "checkmark-circle" : "close-circle"
                }
                size={32}
                color="#FFF"
              />
              <Text style={styles.resultText}>
                {10 - mistakes.size >= 6 ? "PASSED" : "FAILED"}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.tryAgainButton]}
                onPress={handleRestart}
              >
                <Ionicons name="refresh" size={24} color="#FFF" />
                <Text style={styles.modalButtonText}>TRY AGAIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.exitButton]}
                onPress={handleExit}
              >
                <Ionicons name="exit" size={24} color="#FFF" />
                <Text style={styles.modalButtonText}>EXIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleContainer: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    width: "100%",
  },
  cardTablet: {
    maxWidth: 600,
    alignSelf: "center",
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  imageContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#E1F5FE",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  speakerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    alignSelf: "center",
  },
  sentenceContainer: {
    flex: 1,
    justifyContent: "center",
    minHeight: 60,
  },
  slotsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  slot: {
    borderBottomWidth: 2,
    borderBottomColor: "#BDBDBD",
    paddingHorizontal: 4,
    minWidth: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  filledSlot: {
    borderBottomColor: "#0288D1",
  },
  slotText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginVertical: 12,
  },
  bankLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#757575",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  wordBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: "#FFECB3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD54F",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  chipDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
    elevation: 0,
  },
  chipCompleted: {
    opacity: 0.6,
  },
  chipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5D4037",
  },
  chipTextDisabled: {
    color: "#BDBDBD",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  resetBtn: {
    backgroundColor: "#F5F5F5",
    padding: 10,
    aspectRatio: 1,
    minWidth: 44,
  },
  checkBtn: {
    backgroundColor: "#4FC3F7",
    flex: 1,
  },
  checkBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  feedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    backgroundColor: "#F1F8E9",
    padding: 8,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3E2723",
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#757575",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#3E2723",
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    marginBottom: 32,
    gap: 10,
  },
  resultPass: {
    backgroundColor: "#4CAF50",
  },
  resultFail: {
    backgroundColor: "#F44336",
  },
  resultText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  tryAgainButton: {
    backgroundColor: "#2196F3",
  },
  exitButton: {
    backgroundColor: "#FF5722",
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
