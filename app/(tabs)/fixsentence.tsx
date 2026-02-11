import BackButton from "@/components/ui/BackButton";
import InstructionModal from "@/components/InstructionModal";
import { checkInstructionSeen, markInstructionSeen } from "@/services/instructions";
import { addResult } from "@/services/progress";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SentenceItem = {
  id: string;
  jumbled: string;
  correct: string;
  icon: keyof typeof Ionicons.glyphMap;
};



export default function Fixsentence() {
  const router = useRouter();
  const sentenceData: SentenceItem[] = useMemo(
    () => [
      { id: "1", jumbled: "dog The brown is fast", correct: "The brown dog is fast.", icon: "paw" },
      { id: "2", jumbled: "ate I banana a", correct: "I ate a banana.", icon: "nutrition" },
      { id: "3", jumbled: "blue The sky is", correct: "The sky is blue.", icon: "cloud" },
      { id: "4", jumbled: "runs boy The fast very", correct: "The boy runs very fast.", icon: "walk" },
      { id: "5", jumbled: "cat The sleeping is", correct: "The cat is sleeping.", icon: "bed" },
      { id: "6", jumbled: "book reading I am a", correct: "I am reading a book.", icon: "book" },
      { id: "7", jumbled: "sun The hot is", correct: "The sun is hot.", icon: "sunny" },
      { id: "8", jumbled: "ball playing They are with a", correct: "They are playing with a ball.", icon: "football" },
      { id: "9", jumbled: "school to go I", correct: "I go to school.", icon: "school" },
      { id: "10", jumbled: "happy very am I", correct: "I am very happy.", icon: "happy" }
    ],
    []
  );



  // State to track progress for EACH sentence
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [feedbackState, setFeedbackState] = useState<Record<string, "correct" | "incorrect" | null>>({});
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);

  React.useEffect(() => {
    checkInstructionSeen('fixsentence').then(seen => {
      if (!seen) setShowInstruction(true);
    });
  }, []);

  const handleWordSelect = (id: string, word: string) => {
    if (completedIds.includes(id)) return;

    const currentSelection = selections[id] || [];
    // Prevent selecting the same word instance multiple times (simple check)
    // In a real jumbled game, we might track indices, but here words are unique enough or we just append.
    // The original logic checked `!selectedWords.includes(word)`, implying unique words.
    if (!currentSelection.includes(word)) {
        const newSelection = [...currentSelection, word];
        setSelections({ ...selections, [id]: newSelection });
        
        Speech.stop();
        Speech.speak(word, { rate: 0.95, pitch: 1.1 });
        Haptics.selectionAsync();

        // Clear feedback when typing
        setFeedbackState({ ...feedbackState, [id]: null });
    }
  };

  const handleReset = (id: string) => {
    if (completedIds.includes(id)) return;
    const newSelections = { ...selections };
    delete newSelections[id];
    setSelections(newSelections);
    setFeedbackState({ ...feedbackState, [id]: null });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCheck = async (item: SentenceItem) => {
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
            
            Speech.stop();
            Speech.speak("Correct! " + item.correct, { rate: 0.95, pitch: 1.1 });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            await addResult({
                activityId: `fixsentence-${item.id}`,
                category: "practice",
                score: 100,
                maxScore: 100,
                completed: true,
            });

            if (newCompleted.length === sentenceData.length) {
                setTimeout(() => {
                    setShowResult(true);
                    const score = 10 - mistakes.size;
                    const passed = score >= 6;
                    Speech.speak(passed ? "Congratulations! You passed!" : "Good try! Practice more.", { rate: 0.95 });
                }, 1000);
            }
        }
    } else {
        // Incorrect
        setFeedbackState({ ...feedbackState, [item.id]: "incorrect" });
        setMistakes(prev => new Set(prev).add(item.id));
        Speech.stop();
        Speech.speak("Try again", { rate: 0.95, pitch: 1.1 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRestart = () => {
    setSelections({});
    setCompletedIds([]);
    setFeedbackState({});
    setMistakes(new Set());
    setShowResult(false);
    Speech.stop();
  };

  const handleExit = () => {
    setShowResult(false);
    Speech.stop();
    router.replace('/pract');
  };

  return (
    <LinearGradient colors={["#E1F5FE", "#FFF3E0"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/pract" color="#2D2D2D" />
        <Text style={styles.title}>Finish the Sentence</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sentenceData.map((item) => {
            const currentSelection = selections[item.id] || [];
            const isCompleted = completedIds.includes(item.id);
            const status = feedbackState[item.id];
            const jumbledWords = item.jumbled.split(" ");
            const slots = Array(jumbledWords.length).fill(null);

            return (
                <View key={item.id} style={styles.card}>
                    {/* Top Section: Image + Sentence Slots */}
                    <View style={styles.cardHeader}>
                        <View style={styles.imageContainer}>
                            <Ionicons name={item.icon} size={40} color="#0288D1" />
                        </View>
                        <View style={styles.sentenceContainer}>
                             <View style={styles.slotsRow}>
                                {slots.map((_, idx) => (
                                    <View key={idx} style={[styles.slot, currentSelection[idx] ? styles.filledSlot : null]}>
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
                            <Text style={[styles.feedbackText, { color: "#4CAF50" }]}>Great Job!</Text>
                        </View>
                    )}
                    {status === "incorrect" && (
                         <View style={styles.feedbackContainer}>
                            <Ionicons name="alert-circle" size={24} color="#F44336" />
                            <Text style={[styles.feedbackText, { color: "#F44336" }]}>Oops! Try again.</Text>
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
                                        isCompleted ? styles.chipCompleted : null
                                    ]}
                                    onPress={() => handleWordSelect(item.id, word)}
                                    disabled={isSelected || isCompleted}
                                >
                                    <Text style={[styles.chipText, isSelected ? styles.chipTextDisabled : null]}>
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
                                style={[styles.actionBtn, styles.resetBtn, { opacity: currentSelection.length > 0 ? 1 : 0.5 }]} 
                                onPress={() => handleReset(item.id)}
                                disabled={currentSelection.length === 0}
                            >
                                <Ionicons name="refresh" size={20} color="#757575" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.checkBtn, { opacity: currentSelection.length > 0 ? 1 : 0.5 }]}
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

      <Modal visible={showResult} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Practice Complete!</Text>
            
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
      <InstructionModal
        visible={showInstruction}
        onClose={() => {
          setShowInstruction(false);
          markInstructionSeen('fixsentence');
        }}
        instructionText={`Look at the picture.\nFill in the missing word.\nTry your best!`}
        iconName="build"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48, // Increased for safe area
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFFCC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14
  },
  backText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#2D2D2D"
  },
  title: {
    flex: 1,
    textAlign: "right",
    fontSize: 20,
    fontWeight: "800",
    color: "#3E2723",
    paddingLeft: 12
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
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
    borderColor: "#E0E0E0"
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start"
  },
  imageContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#E1F5FE",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  sentenceContainer: {
    flex: 1,
    justifyContent: "center",
    minHeight: 60
  },
  slotsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center"
  },
  slot: {
    borderBottomWidth: 2,
    borderBottomColor: "#BDBDBD",
    paddingHorizontal: 4,
    minWidth: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  filledSlot: {
    borderBottomColor: "#0288D1"
  },
  slotText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242"
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginVertical: 12
  },
  bankLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#757575",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  wordBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
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
    elevation: 1
  },
  chipDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
    elevation: 0
  },
  chipCompleted: {
    opacity: 0.6
  },
  chipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5D4037"
  },
  chipTextDisabled: {
    color: "#BDBDBD"
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center"
  },
  resetBtn: {
    backgroundColor: "#F5F5F5",
    width: 44,
    height: 44,
    paddingHorizontal: 0
  },
  checkBtn: {
    backgroundColor: "#4FC3F7",
    flex: 1
  },
  checkBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  feedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    backgroundColor: "#F1F8E9",
    padding: 8,
    borderRadius: 8
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: "bold"
  },
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

