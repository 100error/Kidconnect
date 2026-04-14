import InstructionButton from "@/components/InstructionButton";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from "@/hooks/useInstruction";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { playbackService } from "@/services/audio/playback";
import { TTS } from "@/services/audio/tts";
import { addResult } from "@/services/progress";
import { speechService } from "@/services/speechService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    BackHandler,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

// Define all available icons
const ICON_ASSETS = [
  { word: "Battery", source: require("@/assets/icons/battery.png") },
  { word: "Bird", source: require("@/assets/icons/bird.png") },
  { word: "Box", source: require("@/assets/icons/box.png") },
  { word: "Boy", source: require("@/assets/icons/boy.png") },
  { word: "Brain", source: require("@/assets/icons/brain.png") },
  { word: "Bunny", source: require("@/assets/icons/bunny.png") },
  { word: "Hamburger", source: require("@/assets/icons/hamburger.png") },
  { word: "Car", source: require("@/assets/icons/car.png") },
  { word: "Carrot", source: require("@/assets/icons/carrot.png") },
  { word: "Cat", source: require("@/assets/icons/cat.png") },
  { word: "Cherry", source: require("@/assets/icons/cherry.png") },
  { word: "Chick", source: require("@/assets/icons/chick.png") },
  { word: "Clock", source: require("@/assets/icons/clock.png") },
  { word: "Clouds", source: require("@/assets/icons/clouds.png") },
  { word: "Comic", source: require("@/assets/icons/comic.png") },
  { word: "Cow", source: require("@/assets/icons/cow.png") },
  { word: "Mouse", source: require("@/assets/icons/mouse.png") },
  { word: "Reindeer", source: require("@/assets/icons/reindeer.png") },
  { word: "Eagle", source: require("@/assets/icons/eagle.png") },
  { word: "Feet", source: require("@/assets/icons/feet.png") },
  { word: "Fish", source: require("@/assets/icons/fish.png") },
  { word: "Flashlight", source: require("@/assets/icons/flashlight.png") },
  { word: "Can", source: require("@/assets/icons/can.png") },
  { word: "Girl", source: require("@/assets/icons/girl.png") },
  { word: "Glasses", source: require("@/assets/icons/glasses.png") },
  { word: "Hand", source: require("@/assets/icons/hand.png") },
  { word: "Hat", source: require("@/assets/icons/hat.png") },
  { word: "House", source: require("@/assets/icons/house.png") },
  { word: "Kid", source: require("@/assets/icons/kid.png") },
  { word: "Magnifier", source: require("@/assets/icons/magnifier.png") },
  { word: "Man", source: require("@/assets/icons/man.png") },
  { word: "Mango", source: require("@/assets/icons/mango.png") },
  { word: "Microphone", source: require("@/assets/icons/microphone.png") },
  { word: "Milk", source: require("@/assets/icons/milk.png") },
  { word: "Monkey", source: require("@/assets/icons/monkey.png") },
  { word: "Notebook", source: require("@/assets/icons/notebook.png") },
  { word: "Orange", source: require("@/assets/icons/orange.png") },
  { word: "Pig", source: require("@/assets/icons/pig.png") },
  { word: "Pillow", source: require("@/assets/icons/pillow.png") },
  { word: "Plane", source: require("@/assets/icons/plane.png") },
  { word: "Ring", source: require("@/assets/icons/ring.png") },
  { word: "Rocket Ship", source: require("@/assets/icons/rocketship.png") },
  { word: "Sad", source: require("@/assets/icons/sad.png") },
  { word: "Sheep", source: require("@/assets/icons/sheep.png") },
  { word: "Snake", source: require("@/assets/icons/snake.png") },
  { word: "Star", source: require("@/assets/icons/star.png") },
  { word: "Sun", source: require("@/assets/icons/sun.png") },
  { word: "Telephone", source: require("@/assets/icons/telephone.png") },
  { word: "Tree", source: require("@/assets/icons/tree.png") },
  { word: "TV", source: require("@/assets/icons/tv.png") },
  { word: "Two", source: require("@/assets/icons/two.png") },
  { word: "UFO", source: require("@/assets/icons/ufo.png") },
  { word: "Watermelon", source: require("@/assets/icons/watermelon.png") },
  { word: "We", source: require("@/assets/icons/we.png") },
  { word: "Whale", source: require("@/assets/icons/whale.png") },
  { word: "Yarn", source: require("@/assets/icons/yarn.png") },
];

interface CardItem {
  id: string;
  matchKey: string;
  word: string;
  imageSource?: any;
  type: "image" | "word";
  color: string;
  state: "idle" | "selected" | "matched" | "mismatch";
}

export default function PracticePronunciation() {
  const router = useRouter();
  const { isMountedRef, safeRun } = useSafeAsync();
  const isRunningRef = useRef(false); // ✅ MULTIPLE EXECUTION GUARD
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const numColumns = isTablet ? 5 : 4; // Use 4 columns for mobile to fit 16 items perfectly
  const GAP = 12;
  const PADDING = 16;
  const cardSize = (width - PADDING * 2 - GAP * (numColumns - 1)) / numColumns;

  const TOTAL_PAIRS = 8; // 16 items total

  const [restartCount, setRestartCount] = useState(0);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0); // ✅ Added state for final score
  const [isProcessing, setIsProcessing] = useState(false);

  const hasSavedRef = useRef(false); // ✅ SAVE LOCK
  const sessionIdRef = useRef(`matchpairs-${Date.now()}`); // ✅ UNIQUE SESSION ID

  // Instructions
  const { play: playInstruction } = useInstruction(
    "pronunciation",
    "Match the correct pairs! Find the picture and the word that goes with it.",
  );

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

  // Stop audio on unmount/blur
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        speechService.stopRecording();
        Speech.stop();
      };
    }, []),
  );

  // Reset lock when screen loads
  useEffect(() => {
    hasSavedRef.current = false;
    sessionIdRef.current = `matchpairs-${Date.now()}`;
  }, []);

  // Pastel colors palette
  const cardColors = [
    "#FFF9C4", // Yellow
    "#E1F5FE", // Light Blue
    "#F8BBD0", // Pink
    "#DCEDC8", // Light Green
    "#D1C4E9", // Lavender
    "#B2EBF2", // Cyan
    "#FFCCBC", // Deep Orange
    "#F0F4C3", // Lime
    "#CFD8DC", // Blue Grey
    "#FFE0B2", // Orange
  ];

  // Initialize Game
  useEffect(() => {
    // 1. Get all valid items (Using ICON_ASSETS now)
    const validItems = ICON_ASSETS;

    // 2. Select random items
    const shuffledItems = [...validItems]
      .sort(() => 0.5 - Math.random())
      .slice(0, TOTAL_PAIRS);

    // 3. Create Pairs (Image Card + Word Card)
    const newCards: CardItem[] = [];
    shuffledItems.forEach((item, index) => {
      const color = cardColors[index % cardColors.length];

      // Image Card
      newCards.push({
        id: `img-${index}`,
        matchKey: item.word,
        word: item.word,
        imageSource: item.source,
        type: "image",
        color: color,
        state: "idle",
      });

      // Word Card
      newCards.push({
        id: `txt-${index}`,
        matchKey: item.word,
        word: item.word,
        type: "word",
        color: color,
        state: "idle",
      });
    });

    // 4. Shuffle all cards
    setCards(newCards.sort(() => 0.5 - Math.random()));
    setMistakes(new Set());
    setSelectedId(null);
    setShowResult(false);
    setFinalScore(0);
    setIsProcessing(false);
    hasSavedRef.current = false;
    sessionIdRef.current = `matchpairs-${Date.now()}`;
    // Reset game state for a new round
  }, [restartCount]);

  const handleCardPress = (card: CardItem) => {
    if (
      isProcessing ||
      isRunningRef.current ||
      card.state === "matched" ||
      card.state === "selected" ||
      !isMountedRef.current
    )
      return;

    isRunningRef.current = true;

    // Play TTS on tap (optional but helpful)
    Speech.stop();
    TTS.speak(card.word, { rate: 0.85, pitch: 1.1 });

    if (!selectedId) {
      // First card selected
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, state: "selected" } : c)),
      );
      setSelectedId(card.id);
      isRunningRef.current = false;
    } else {
      // Second card selected
      const firstCard = cards.find((c) => c.id === selectedId);
      if (!firstCard) {
        isRunningRef.current = false;
        return;
      }

      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, state: "selected" } : c)),
      );
      setIsProcessing(true);

      // Check Match
      if (firstCard.matchKey === card.matchKey) {
        // Correct Match
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setCards((prev) =>
            prev.map((c) =>
              c.matchKey === card.matchKey ? { ...c, state: "matched" } : c,
            ),
          );
          playbackService.playSound("correct");
          Speech.stop();
          TTS.speak("Correct!", { rate: 0.85, pitch: 1.1 });
          setSelectedId(null);
          setIsProcessing(false);
          isRunningRef.current = false;
          checkCompletion();
        }, 500);
      } else {
        // Incorrect Match
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCard.id || c.id === card.id
                ? { ...c, state: "mismatch" }
                : c,
            ),
          );
          playbackService.playSound("incorrect");
          Speech.stop();
          TTS.speak("Try again", { rate: 0.85, pitch: 1.1 });
          setMistakes((prev) =>
            new Set(prev).add(firstCard.matchKey).add(card.matchKey),
          );
        }, 500);

        // Reset after delay
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setCards((prev) =>
            prev.map((c) =>
              c.state === "mismatch" ? { ...c, state: "idle" } : c,
            ),
          );
          setSelectedId(null);
          setIsProcessing(false);
          isRunningRef.current = false;
        }, 1500);
      }
    }
  };

  const checkCompletion = () => {
    // We need to check if this was the last pair.
    // State updates are async, so we count matched cards + 2 (the ones just matched)
    // Actually, safer to rely on an effect or just check count.
    // Let's use a timeout to check the state after update.
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setCards((currentCards) => {
        const matchedCount = currentCards.filter(
          (c) => c.state === "matched",
        ).length;
        if (matchedCount === TOTAL_PAIRS * 2) {
          handleFinish();
        }
        return currentCards;
      });
    }, 600);
  };

  const handleFinish = async () => {
    if (hasSavedRef.current || !isMountedRef.current) return; // ✅ Guard: don't save twice
    hasSavedRef.current = true;

    const rawScore = Math.max(0, TOTAL_PAIRS - mistakes.size);
    const score = Math.min(10, Math.round((rawScore / TOTAL_PAIRS) * 10)); // ✅ Score out of 10
    const passed = score >= 6; // ✅ 60% passing (6/10)

    if (!isMountedRef.current) return;
    setFinalScore(score); // ✅ Store final score in state BEFORE showing results

    await safeRun(() =>
      addResult({
        activityId: "pronunciation-matching",
        sessionId: sessionIdRef.current,
        category: "practice",
        score: score, // ✅ Store as value between 0-10
        maxScore: 10,
        completed: true,
        timestamp: new Date().toISOString(),
      }),
    );

    if (!isMountedRef.current) return;
    setShowResult(true);
    Speech.stop();

    TTS.speak(passed ? "Awesome! You did it!" : "Good practice! Try again.", {
      rate: 0.85,
      pitch: 1.1,
    });
  };

  const handleRestart = () => {
    if (!isMountedRef.current || isRunningRef.current) return;
    isRunningRef.current = true;
    Speech.stop();
    setRestartCount((prev) => prev + 1);
    isRunningRef.current = false;
  };

  const handleExit = () => {
    if (!isMountedRef.current || isRunningRef.current) return;
    isRunningRef.current = true;
    safeExit();
  };

  return (
    <LinearGradient colors={["#E0F2F1", "#80CBC4"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <BackButton targetRoute="/pract" color="#00695C" />
          <InstructionButton
            onPress={playInstruction}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.title}>Match Pairs</Text>
          <View style={styles.scoreBadge}>
            {/* Show matched pairs count */}
            <Text style={styles.scoreText}>
              {cards.filter((c) => c.state === "matched").length / 2} /{" "}
              {TOTAL_PAIRS}
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>Match the pictures with the words!</Text>

        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridContainer}>
            {cards.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  {
                    width: cardSize,
                    height: cardSize,
                    backgroundColor:
                      item.state === "matched" ? "#E8F5E9" : item.color,
                    borderColor:
                      item.state === "selected"
                        ? "#2196F3"
                        : item.state === "mismatch"
                          ? "#F44336"
                          : item.state === "matched"
                            ? "#4CAF50"
                            : "transparent",
                    opacity: item.state === "matched" ? 0.6 : 1,
                  },
                ]}
                onPress={() => handleCardPress(item)}
                activeOpacity={0.8}
              >
                {item.type === "image" && item.imageSource ? (
                  <Image
                    source={item.imageSource}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text
                    style={styles.wordText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {item.word}
                  </Text>
                )}

                {/* Status Indicator (Icon Overlay) */}
                {item.state === "matched" && (
                  <View style={styles.statusOverlay}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4CAF50"
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Result Modal */}
        <Modal
          visible={showResult}
          transparent={true}
          animationType="fade"
          onRequestClose={handleExit}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {finalScore >= 6 ? "Great Job! 🎉" : "Keep Trying! 💪"}
              </Text>

              <View style={styles.resultScoreContainer}>
                <Text style={styles.resultScoreLabel}>Your Score</Text>
                <Text
                  style={[
                    styles.resultScoreValue,
                    { color: finalScore >= 6 ? "#4CAF50" : "#FF9800" },
                  ]}
                >
                  {finalScore} / 10
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={handleRestart}
                >
                  <Text style={styles.buttonText}>Try Again</Text>
                  <Ionicons
                    name="refresh"
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={handleExit}
                >
                  <Text style={styles.buttonText}>Exit</Text>
                  <Ionicons
                    name="exit-outline"
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00695C",
    flex: 1,
    textAlign: "center",
  },
  scoreBadge: {
    backgroundColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#004D40",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#004D40",
    marginBottom: 10,
    opacity: 0.8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12, // Matches the GAP constant
  },
  card: {
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    padding: 8, // Added padding for images
  },
  cardImage: {
    width: "85%",
    height: "85%",
  },
  wordText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  statusOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  resultScoreContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  resultScoreLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  resultScoreValue: {
    fontSize: 48,
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
  },
  tryAgainButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  exitButton: {
    backgroundColor: "#FF5722",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
