import InstructionButton from "@/components/InstructionButton";
import OfflineGuard from "@/components/OfflineGuard";
import BackButton from "@/components/ui/BackButton";
import { playbackService } from "@/services/audio/playback";
import { TTS } from "@/services/audio/tts";
import { ensureMicPermission } from "@/services/mic";
import { addResult } from "@/services/progress";
import { speechService } from "@/services/speechService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

type Item = {
  cause: string;
  effect: string;
  hints?: string[];
};

export default function CauseEffect() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const CARD_MAX = 600;

  // Palette: match Games button (teal family) and pastel cards
  const bgColors = ["#E0F2F1", "#E0F7FA"];
  const pastelCardColors = ["#E3F2FD", "#FFF3E0", "#FCE4EC", "#E8F5E9", "#EDE7F6", "#FFE0B2"];
  const accentColors =     ["#64B5F6", "#FFB74D", "#F06292", "#81C784", "#9575CD", "#FF8A65"];

  // Dataset (20 items)
  const DATA: Item[] = useMemo(() => [
    { cause: "It rained heavily all night.", effect: "The ground is.", hints: ["wet ground", "puddles"] },
    { cause: "I forgot my umbrella.", effect: "I got wet.", hints: ["got wet"] },
    { cause: "We watered the plants.", effect: "The plants grew.", hints: ["plants grew"] }, 
    { cause: "She practiced every day.", effect: "She became better.", hints: ["improved", "better"] },
    { cause: "The power went out.", effect: "The lights turned off.", hints: ["lights off", "dark"] },
    { cause: "The sun came out.", effect: "It became warm.", hints: ["warmer", "warm"] },
    { cause: "He ate too quickly.", effect: "He got a stomachache.", hints: ["stomach ache"] },
    { cause: "The alarm rang.", effect: "I woke up.", hints: ["wake up"] },
    { cause: "I studied hard.", effect: "I passed the test.", hints: ["passed test"] },
    { cause: "The road was icy.", effect: "The car slipped.", hints: ["slip"] },
    { cause: "We opened the window.", effect: "Fresh air came in.", hints: ["fresh air"] },
    { cause: "The dog barked loudly.", effect: "The baby woke up.", hints: ["baby woke"] },
    { cause: "I watered the floor.", effect: "The floor is wet.", hints: ["wet floor"] },
    { cause: "She forgot to charge her phone.", effect: "Her phone died.", hints: ["battery dead"] },
    { cause: "He stayed up late.", effect: "He felt tired.", hints: ["tired"] },
    { cause: "The wind was strong.", effect: "The kite flew high.", hints: ["kite flew"] },
    { cause: "We planted seeds.", effect: "Flowers grew.", hints: ["flowers grew"] },
    { cause: "It was very hot.", effect: "The ice melted.", hints: ["melted"] },
    { cause: "She shared her toys.", effect: "She made friends.", hints: ["made friends"] },
    { cause: "We cleaned the room.", effect: "The room looked neat.", hints: ["clean room"] },
  ], []);

  // Session: pick 10 random
  const [sessionSeed, setSessionSeed] = useState(0);
  const items = useMemo(() => {
    const shuffled = [...DATA].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, [DATA, sessionSeed]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "correct" | "incorrect">("idle");
  const [recognized, setRecognized] = useState("");
  const [showResult, setShowResult] = useState(false);

  const totalQuestions = items.length;
  const current = items[currentIndex];
  const cardBg = pastelCardColors[currentIndex % pastelCardColors.length];
  const accent = accentColors[currentIndex % accentColors.length];

  useEffect(() => {
    return () => {
      speechService.stopRecording();
      Speech.stop();
    };
  }, []);

  const speakInstruction = useCallback(() => {
    TTS.speak("Speak the effect.", { rate: 0.95, pitch: 1.1 });
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      try {
        const uri = await speechService.stopRecording();
        if (uri) {
          const result = await speechService.recognizeSpeech(uri);
          setRecognized(result.transcript || "");
          const ok = speechService.checkWord(result, current.effect);
          if (ok) {
            setStatus("correct");
            playbackService.playSound("correct");
            TTS.speak("Correct!", { rate: 0.95, pitch: 1.1 });
            const nextCorrect = correctAnswers + 1;
            const isLast = currentIndex === totalQuestions - 1;
            if (isLast) {
              const score = nextCorrect;
              await addResult({
                activityId: "causeeffect",
                category: "game",
                score,
                maxScore: totalQuestions,
                completed: true,
              });
              setTimeout(() => setShowResult(true), 600);
            } else {
              setTimeout(() => {
                setCurrentIndex((i) => i + 1);
                setCorrectAnswers(nextCorrect);
                setStatus("idle");
                setRecognized("");
              }, 400);
            }
          } else {
            setStatus("incorrect");
            playbackService.playSound("incorrect");
            TTS.speak("Try again.", { rate: 0.95, pitch: 1.1 });
            setTimeout(() => setStatus("idle"), 1200);
          }
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("idle");
      }
      return;
    }

    try {
      const ok = await ensureMicPermission();
      if (!ok) return;
      setStatus("listening");
      setIsListening(true);
      await speechService.startRecording();
    } catch {
      setIsListening(false);
      setStatus("idle");
    }
  };

  const handlePlayAgain = () => {
    setSessionSeed((s) => s + 1);
    setCurrentIndex(0);
    setCorrectAnswers(0);
    setRecognized("");
    setStatus("idle");
    setShowResult(false);
    Speech.stop();
  };

  const handleExit = () => {
    Speech.stop();
    router.replace("/games");
  };

  const encouragement =
    correctAnswers >= 8 ? "Excellent! You're great at understanding cause and effect!" :
    correctAnswers >= 5 ? "Good job! Keep practicing!" :
    "Nice try! Let's keep learning!";

  return (
    <LinearGradient colors={bgColors as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <OfflineGuard>
          <StatusBar barStyle="dark-content" />
          <View style={styles.header}>
            <BackButton targetRoute="/games" color="#2D2D2D" />
            <Text style={styles.title}>Cause and Effect</Text>
            <InstructionButton onPress={speakInstruction} />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, maxWidth: isTablet ? CARD_MAX : undefined }]}>
            <View style={[styles.cardHeader, { backgroundColor: accent }]}>
              <Text style={styles.cardHeaderText}>Cause and Effect</Text>
            </View>
            <Text style={styles.label}>Cause:</Text>
            <Text style={styles.causeText}>{current.cause}</Text>

            <TouchableOpacity
              onPress={toggleListening}
              activeOpacity={0.9}
              style={[styles.micButton, status === "listening" && styles.micListening]}
            >
              <Ionicons name="mic" size={28} color="#fff" />
              <Text style={styles.micLabel}>{status === "listening" ? "Listening..." : "Tap to Speak"}</Text>
            </TouchableOpacity>

            <Text style={styles.instruction}>Speak the effect.</Text>
            {!!recognized && <Text style={styles.recognized}>Heard: {recognized}</Text>}
          </View>
        </OfflineGuard>
      </SafeAreaView>

      <Modal visible={showResult} animationType="fade" transparent onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Great Speaking!</Text>
            <Text style={styles.modalScore}>You got {correctAnswers} out of {totalQuestions} correct!</Text>
            <Text style={styles.modalMessage}>{encouragement}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.playAgain]} onPress={handlePlayAgain}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.exit]} onPress={handleExit}>
                <Ionicons name="exit" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2D2D2D",
  },
  card: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "center",
    width: "92%",
  },
  cardHeader: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  cardHeaderText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#5D4037",
    marginBottom: 6,
  },
  causeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3E2723",
    marginBottom: 14,
  },
  micButton: {
    backgroundColor: "#26A69A",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  micListening: {
    backgroundColor: "#00897B",
  },
  micLabel: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  instruction: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#5D4037",
  },
  recognized: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#455A64",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2E7D32",
    marginBottom: 8,
  },
  modalScore: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4E342E",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5D4037",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  playAgain: { backgroundColor: "#2196F3" },
  exit: { backgroundColor: "#FF7043" },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
