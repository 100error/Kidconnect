import GameWordCard from "@/components/game/GameWordCard";
import BackButton from "@/components/ui/BackButton";
import { addResult } from "@/services/progress";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { vowelSections } from "../common";

export default function GamePronunciation() {
  const router = useRouter();
  const [restartCount, setRestartCount] = useState(0);
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);

  // 1. Get 10 random words from common data
  const gameItems = useMemo(() => {
    // Flatten all examples from vowelSections
    const allExamples = vowelSections.flatMap(section => section.examples);
    // Filter items that have icons (most do, but safety check)
    const validItems = allExamples.filter(item => item.icon);
    
    // Shuffle and pick 10
    const shuffled = [...validItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, [restartCount]);

  const handleSuccess = (word: string) => {
    if (!completedWords.includes(word)) {
      const newCompleted = [...completedWords, word];
      setCompletedWords(newCompleted);

      // Check if game finished
      if (newCompleted.length === gameItems.length) {
        setTimeout(async () => {
          setShowResult(true);
          const score = 10 - mistakes.size;
          const passed = score >= 6;
          Speech.speak(passed ? "Congratulations! You passed!" : "Good try! Practice more.", { rate: 0.95 });
          
          await addResult({
            activityId: "pronunciation-game",
            category: "game",
            score: Math.max(0, score * 10), // Scale to 100
            maxScore: 100,
            completed: true,
          });
        }, 1000);
      }
    }
  };

  const handleFailure = (word: string) => {
    if (!completedWords.includes(word)) {
        setMistakes(prev => new Set(prev).add(word));
    }
  };

  const handleRestart = () => {
    setCompletedWords([]);
    setMistakes(new Set());
    setShowResult(false);
    setRestartCount(prev => prev + 1);
    Speech.stop();
  };

  const handleExit = () => {
    Speech.stop();
    setShowResult(false);
    // Route back to games screen (assuming /games is the route, or home if games is on home)
    // User requested "route back to the Games screen". 
    // If /games exists as a file (app/games.tsx), this works.
    router.replace('/games');
  };

  return (
    <LinearGradient colors={["#FFF3E0", "#FFCCBC"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
          <BackButton targetRoute="/games" color="#3E2723" />
          <Text style={styles.title}>Speak It!</Text>
          <View style={styles.scoreBadge}>
             <Text style={styles.scoreText}>{completedWords.length} / 10</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>Tap the mic and say the word!</Text>

        <FlatList
          data={gameItems}
          keyExtractor={(item, index) => `${item.word}-${index}`}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <GameWordCard 
              word={item.word}
              icon={item.icon}
              color={completedWords.includes(item.word) ? "#E8F5E9" : "#FFF"}
              onSuccess={() => handleSuccess(item.word)}
              onFailure={() => handleFailure(item.word)}
              disabled={completedWords.includes(item.word)}
            />
          )}
        />

        {/* Result Popup */}
        <Modal visible={showResult} transparent={true} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Game Complete!</Text>
                
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Your Score</Text>
                  <Text style={styles.scoreValue}>{Math.max(0, 10 - mistakes.size)} / 10</Text>
                </View>

                <View style={[styles.resultBadge, (10 - mistakes.size) >= 6 ? styles.resultPass : styles.resultFail]}>
                  <Ionicons 
                    name={(10 - mistakes.size) >= 6 ? "checkmark-circle" : "close-circle"} 
                    size={32} 
                    color="#FFF" 
                  />
                  <Text style={styles.resultText}>
                    {(10 - mistakes.size) >= 6 ? "PASSED" : "FAILED"}
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, styles.tryAgainButton]} onPress={handleRestart}>
                    <Ionicons name="refresh" size={24} color="#FFF" />
                    <Text style={styles.modalButtonText}>TRY AGAIN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.modalButton, styles.exitButton]} onPress={handleExit}>
                    <Ionicons name="exit" size={24} color="#FFF" />
                    <Text style={styles.modalButtonText}>EXIT</Text>
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#BF360C",
    flex: 1,
    textAlign: "center",
    paddingRight: 40, // Balance back button
  },
  scoreBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#BF360C",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 18,
    color: "#5D4037",
    marginBottom: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
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
    shadowRadius: 4
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3E2723",
    marginBottom: 20
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 20
  },
  scoreLabel: {
    fontSize: 16,
    color: "#757575",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#3E2723"
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    marginBottom: 32,
    gap: 10
  },
  resultPass: {
    backgroundColor: "#4CAF50"
  },
  resultFail: {
    backgroundColor: "#F44336"
  },
  resultText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
    width: "100%"
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8
  },
  tryAgainButton: {
    backgroundColor: "#2196F3"
  },
  exitButton: {
    backgroundColor: "#FF5722"
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800"
  }
});
