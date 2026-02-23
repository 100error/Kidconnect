import InstructionButton from "@/components/InstructionButton";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from '@/hooks/useInstruction';
import { addResult } from "@/services/progress";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native";

// 1. Data Setup (Tenses: Present, Past, Future)
const staticRawData = [
  { id: "1", sentence: "I ___ with my friends.", answer: "play" },
  { id: "2", sentence: "She ___ to school yesterday.", answer: "walked" },
  { id: "3", sentence: "We will ___ to the zoo.", answer: "go" },
  { id: "4", sentence: "The frog ___ in the pond.", answer: "jumps" },
  { id: "5", sentence: "He ___ a big bird.", answer: "saw" },
  { id: "6", sentence: "Dogs ___ very fast.", answer: "run" },
  { id: "7", sentence: "We ___ pizza last night.", answer: "ate" },
  { id: "8", sentence: "I will ___ you tomorrow.", answer: "see" },
  { id: "9", sentence: "The duck ___ in the water.", answer: "swims" },
  { id: "10", sentence: "\"Hello,\" ___ the teacher.", answer: "said" },
];

export default function SentenceBuild() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [questions, setQuestions] = useState<typeof staticRawData>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [completedSentences, setCompletedSentences] = useState<{ [key: string]: string }>({}); // id -> word
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [restartCount, setRestartCount] = useState(0);

  // Randomize questions on mount/restart
  useEffect(() => {
    const shuffled = [...staticRawData].sort(() => 0.5 - Math.random());
    setQuestions(shuffled);
  }, [restartCount]);

  // Instructions
  const { play: playInstruction } = useInstruction(
    'sentencebuild',
    "Fill in the blanks! Choose the correct word to complete the sentence."
  );

  // Stop audio on unmount/blur
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        Speech.stop();
      };
    }, [])
  );

  // Derived state
  const wordBank = React.useMemo(() => {
    if (questions.length === 0) return [];
    // Get all answers from the CURRENT shuffled questions
    const answers = questions.map(d => d.answer);
    // Shuffle them again for the bank
    return [...answers].sort(() => 0.5 - Math.random());
  }, [questions]);

  // Check if a word is already used in a completed sentence
  const isWordUsed = (word: string) => {
    return Object.values(completedSentences).includes(word);
  };

  const handleWordSelect = (word: string) => {
    if (isWordUsed(word)) return;
    Speech.speak(word, { rate: 0.85 });
    setSelectedWord(word === selectedWord ? null : word);
  };

  const handleSentencePress = (item: typeof staticRawData[0]) => {
    // If already completed, ignore
    if (completedSentences[item.id]) return;

    if (!selectedWord) {
      // READ ALOUD Requirement: Read the sentence if tapped without selection
      // Replace ___ with "blank" for audio
      const textToRead = item.sentence.replace("___", "blank");
      Speech.stop();
      Speech.speak(textToRead, { rate: 0.85, pitch: 1.1 });
      return;
    }

    if (selectedWord === item.answer) {
      // Correct
      const newCompleted = { ...completedSentences, [item.id]: selectedWord };
      setCompletedSentences(newCompleted);
      setSelectedWord(null);
      Speech.stop();
      Speech.speak("Good job!", { rate: 0.95 });
      
      // Check completion
      if (Object.keys(newCompleted).length === questions.length) {
        setTimeout(finishGame, 1000);
      }
    } else {
      // Incorrect
      Speech.stop();
      Speech.speak("Try again.", { rate: 0.95 });
      setMistakes(prev => new Set(prev).add(item.id));
    }
  };

  const finishGame = async () => {
    const score = Math.max(0, 10 - mistakes.size);
    const passed = score >= 6;
    
    await addResult({
      activityId: "sentence-build-worksheet",
      category: "practice",
      score: score * 10,
      maxScore: 100,
      completed: true,
    });

    setShowResult(true);
    Speech.speak(passed ? "Great work! You finished the worksheet." : "Keep practicing!", { rate: 0.95 });
  };

  const handleRestart = () => {
    setCompletedSentences({});
    setMistakes(new Set());
    setSelectedWord(null);
    setShowResult(false);
    setRestartCount(prev => prev + 1);
  };

  const handleExit = () => {
    router.replace('/pract');
  };

  return (
    <LinearGradient colors={["#FFF3E0", "#FFE0B2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {/* 1. Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton targetRoute="/pract" color="#E65100" />
            <InstructionButton onPress={playInstruction} style={{ marginLeft: 10 }} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Sentence Building</Text>
            <Ionicons name="pencil" size={24} color="#E65100" style={styles.headerIcon} />
          </View>
          <View style={styles.headerRight} /> 
        </View>

        {/* 2. Instruction Section */}
        <Text style={styles.instructionText}>
          Can you complete the sentences with the correct word?
        </Text>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 3. Word Bank Section */}
          <View style={styles.wordBankContainer}>
            <Text style={styles.wordBankLabel}>Word Bank</Text>
            <View style={styles.wordBankGrid}>
              {wordBank.map((word, index) => (
                <TouchableOpacity
                  key={`${word}-${index}`}
                  style={[
                    styles.wordPill,
                    selectedWord === word && styles.wordPillSelected,
                    isWordUsed(word) && styles.wordPillUsed
                  ]}
                  onPress={() => handleWordSelect(word)}
                  disabled={isWordUsed(word)}
                >
                  <Text style={[
                    styles.wordText,
                    selectedWord === word && styles.wordTextSelected,
                    isWordUsed(word) && styles.wordTextUsed
                  ]}>
                    {word}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 4. Sentence List Section */}
          <View style={[styles.worksheetContainer, isTablet && styles.worksheetContainerTablet]}>
            {questions.map((item, index) => {
              const isCompleted = !!completedSentences[item.id];
              const parts = item.sentence.split("___");
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.sentenceRow,
                    isCompleted && styles.sentenceRowCorrect
                  ]}
                  onPress={() => handleSentencePress(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sentenceNumber}>{index + 1}.</Text>
                  <View style={styles.sentenceTextContainer}>
                    <Text style={styles.sentenceText}>
                      {parts[0]}
                      <Text style={[
                        styles.blankSpace,
                        isCompleted && styles.filledBlank
                      ]}>
                        {isCompleted ? ` ${completedSentences[item.id]} ` : " ______ "}
                      </Text>
                      {parts[1]}
                    </Text>
                  </View>
                  {isCompleted && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={{marginLeft: 8}} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Result Modal */}
        <Modal
          visible={showResult}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowResult(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {(10 - mistakes.size) >= 6 ? "Worksheet Complete! 📝" : "Good Try! 📚"}
              </Text>
              
              <View style={styles.resultScoreContainer}>
                <Text style={styles.resultScoreLabel}>Your Score</Text>
                <Text style={[
                  styles.resultScoreValue, 
                  { color: (10 - mistakes.size) >= 6 ? "#4CAF50" : "#FF9800" }
                ]}>
                  {10 - mistakes.size} / 10
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.tryAgainButton} onPress={handleRestart}>
                  <Text style={styles.buttonText}>Try Again</Text>
                  <Ionicons name="refresh" size={20} color="#FFF" style={{marginLeft: 8}} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                  <Text style={styles.buttonText}>Exit</Text>
                  <Ionicons name="exit-outline" size={20} color="#FFF" style={{marginLeft: 8}} />
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    width: 40,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E65100",
    fontFamily: "System",
  },
  headerIcon: {
    marginLeft: 8,
  },
  instructionText: {
    textAlign: "center",
    fontSize: 18,
    color: "#BF360C",
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "600",
    paddingHorizontal: 20,
  },
  scrollContent: {
    padding: 16,
  },
  wordBankContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FFCC80",
    shadowColor: "#E65100",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wordBankLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F57C00",
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  wordBankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  wordPill: {
    backgroundColor: "#FFF3E0",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  wordPillSelected: {
    backgroundColor: "#FF9800",
    borderColor: "#E65100",
    transform: [{ scale: 1.05 }],
  },
  wordPillUsed: {
    backgroundColor: "#EEEEEE",
    borderColor: "#E0E0E0",
    opacity: 0.5,
  },
  wordText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E65100",
  },
  wordTextSelected: {
    color: "white",
  },
  wordTextUsed: {
    color: "#9E9E9E",
    textDecorationLine: "line-through",
  },
  worksheetContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFE0B2",
    minHeight: 400,
    width: "100%",
  },
  worksheetContainerTablet: {
    maxWidth: 800,
    alignSelf: "center",
  },
  sentenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF3E0",
  },
  sentenceRowCorrect: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  sentenceNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F57C00",
    marginRight: 12,
    minWidth: 25,
  },
  sentenceTextContainer: {
    flex: 1,
  },
  sentenceText: {
    fontSize: 20,
    color: "#3E2723",
    lineHeight: 32,
  },
  blankSpace: {
    color: "#BDBDBD",
    fontWeight: "bold",
  },
  filledBlank: {
    color: "#2E7D32", // Green for correct answer
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 20,
    textAlign: "center",
  },
  resultScoreContainer: {
    alignItems: "center",
    marginBottom: 25,
    backgroundColor: "#FFF3E0",
    padding: 20,
    borderRadius: 20,
    width: "100%",
  },
  resultScoreLabel: {
    fontSize: 18,
    color: "#EF6C00",
    marginBottom: 5,
    fontWeight: "600",
  },
  resultScoreValue: {
    fontSize: 48,
    fontWeight: "900",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 15,
  },
  tryAgainButton: {
    flex: 1,
    backgroundColor: "#29B6F6",
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  exitButton: {
    flex: 1,
    backgroundColor: "#FF7043",
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
