import GameWordCard from "@/components/game/GameWordCard";
import InstructionButton from "@/components/InstructionButton";
import OfflineGuard from "@/components/OfflineGuard";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from '@/hooks/useInstruction';
import { addResult } from "@/services/progress";
import { speakCorrection, speakPraise } from "@/services/voiceFeedback";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from 'expo-router';
import * as Speech from "expo-speech";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Modal, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

/* ---------------- GAME DATA ---------------- */

const GAME_WORDS: { word: string; image: any }[] = [ 
  { word: "Apple", image: require("@/assets/gamepronounce/apple.png") },
  { word: "Baby", image: require("@/assets/gamepronounce/baby.png") },
  { word: "Ball", image: require("@/assets/gamepronounce/ball.png") },
  { word: "Book", image: require("@/assets/gamepronounce/book.png") }, 
  { word: "Car", image: require("@/assets/gamepronounce/car.png") },
  { word: "Cat", image: require("@/assets/gamepronounce/cat.png") },
  { word: "Dog", image: require("@/assets/gamepronounce/dog.png") },
  { word: "Happy", image: require("@/assets/gamepronounce/happy.png") },
  { word: "House", image: require("@/assets/gamepronounce/house.png") },
  { word: "Ice Cream", image: require("@/assets/gamepronounce/icecream.png") },
  { word: "Jump", image: require("@/assets/gamepronounce/jump.png") },
  { word: "Pizza", image: require("@/assets/gamepronounce/pizza.png") },
  { word: "Run", image: require("@/assets/gamepronounce/run.png") },
  { word: "Sad", image: require("@/assets/gamepronounce/sad.png") },
  { word: "Sleep", image: require("@/assets/gamepronounce/sleep.png") },
  { word: "Star", image: require("@/assets/gamepronounce/star.png") },
  { word: "Sun", image: require("@/assets/gamepronounce/sun.png") },
  { word: "Tree", image: require("@/assets/gamepronounce/tree.png") },
  { word: "Water", image: require("@/assets/gamepronounce/water.png") },
  { word: "Flowers", image: require("@/assets/gamepronounce/flowers.png") },
];

export default function GamePronunciation() {
  const router = useRouter();

  const [restartCount, setRestartCount] = useState(0);
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);

  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const numColumns = isTablet ? 4 : 2;
  const GAP = 16;
  const PADDING = 16;
  const itemWidth = (width - (PADDING * 2) - (GAP * (numColumns - 1))) / numColumns;

  /* ---------------- INSTRUCTIONS ---------------- */

  const { play: playInstruction } = useInstruction(
    "pronunciation-game",
    "Tap the microphone and say the word shown on the card."
  );

  useFocusEffect(
    useCallback(() => {
      return () => Speech.stop();
    }, [])
  );

  /* ---------------- GAME WORDS ---------------- */

  const gameItems = useMemo(() => {
    const shuffled = [...GAME_WORDS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, [restartCount]);

  /* ---------------- RESULT HANDLERS ---------------- */

  const handleSuccess = (word: string) => {
    if (completedWords.includes(word)) return;

    const updated = [...completedWords, word];
    setCompletedWords(updated);

    if (updated.length === gameItems.length) {
      setTimeout(async () => {
        setShowResult(true);
        const score = 10 - mistakes.size;
        const passed = score >= 6;

        Speech.stop();

        if (passed) {
          speakPraise("Congratulations! You passed!");
        } else {
          speakCorrection("Good try! Practice more.");
        }

        await addResult({
          activityId: "pronunciation-game",
          category: "game",
          score: Math.max(0, score),
          maxScore: 10,
          completed: true,
        });
      }, 800);
    }
  };

  const handleFailure = (word: string) => {
    setMistakes(prev => new Set(prev).add(word));
  };

  const handleRestart = () => {
    Speech.stop();
    setCompletedWords([]);
    setMistakes(new Set());
    setShowResult(false);
    setRestartCount(c => c + 1);
  };

  const handleExit = () => {
    Speech.stop();
    router.replace("/games");
  };

  /* ---------------- UI ---------------- */

  return (
    <LinearGradient colors={["#FFF3E0", "#FFCCBC"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <OfflineGuard>
          <StatusBar barStyle="dark-content" />

          <View style={styles.header}>
            <BackButton targetRoute="/games" color="#3E2723" />
            <InstructionButton onPress={playInstruction} />
            <Text style={styles.title}>Speak It!</Text>
          </View>

          <Text style={styles.subtitle}>
            Tap the mic and say the word
          </Text>

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
                  color={
                    completedWords.includes(item.word) ? "#E8F5E9" : "#FFF"
                  }
                  style={{ width: itemWidth, margin: 0 }}
                  onSuccess={() => handleSuccess(item.word)}
                  onFailure={() => handleFailure(item.word)}
                />
            )}
          />

          {/* ---------------- RESULT MODAL ---------------- */}

          <Modal visible={showResult} transparent animationType="fade" onRequestClose={handleExit}>
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
});
