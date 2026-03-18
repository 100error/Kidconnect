import InstructionButton from "@/components/InstructionButton";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from "@/hooks/useInstruction";
import { playbackService } from "@/services/audio/playback";
import { TTS } from "@/services/audio/tts";
import { addResult } from "@/services/progress";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
    

type Riddle = {
  id: string;
  question: string;
  image: any;
  correctAnswer: string;
  answerChoices: string[];
};

export default function RiddlesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const columns = isTablet ? 2 : 1;
  const gap = 16;
  const padding = 20;
  const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;

  // Background color derived from the Practice button (lighter orange variant)
  const screenBg = "#FFE7DE";

  // Rotating pastel card colors and matching accent colors
  const pastelCardColors = ["#E3F2FD", "#FFF3E0", "#FCE4EC", "#E8F5E9", "#EDE7F6", "#FFE0B2"];
  const accentColors =     ["#64B5F6", "#FFB74D", "#F06292", "#81C784", "#9575CD", "#FF8A65"];

  const rawRiddles: Riddle[] = useMemo(() => [
    { id: "1", question: "I’m a citrus that’s round and bright,Full of flavor, a healthy bite! What am I?", 
      image: require("@/assets/riddles/orange.png"), correctAnswer: "Orange", answerChoices: ["Orange", "Mango", "Cherry"] },
    { id: "2", question: "I rise in the morning, set at night, I shine so bright with golden light. I give you warmth and help things grow, Look up high, I’m always on show. What am I?", 
      image: require("@/assets/riddles/sun.png"), correctAnswer: "Sun", answerChoices: ["Moon", "Star", "Sun"] },
    { id: "3", question: "I wag my tail when I’m happy and bright, I bark at strangers both day and night. I fetch your ball and love to play, I’m a loyal friend in every way. What am I?",
      image: require("@/assets/riddles/dog.png"), correctAnswer: "Dog", answerChoices: ["Cat", "Dog", "Sheep"] },
    { id: "4", question: "I meow for food and sleep all day,I rub on your legs when I want to play. What am I?", 
      image: require("@/assets/riddles/cat.png"), correctAnswer: "Cat", answerChoices: ["Cow", "Cat", "Pig"] },
    { id: "5", question: "I swim in water, big or small,I have no legs, no arms at all.I breathe with gills and glide with ease,In oceans, rivers, or even seas. What am I?", 
      image: require("@/assets/riddles/fish.png"), correctAnswer: "Fish", answerChoices: ["Bird", "Fish", "Snake"] },
    { id: "6", question: "I flap my wings and soar in the sky,I tweet and chirp as I fly by. What am I?", 
      image: require("@/assets/riddles/bird.png"), correctAnswer: "Bird", answerChoices: ["Whale", "Bird", "Cow"] },
    { id: "7", question: "I’m small and round and fit on a hand, I shine and sparkle, just as planned. Sometimes I promise love so true, I’m worn by many, old and new. What am I?", 
      image: require("@/assets/riddles/ring.png"), correctAnswer: "Ring", answerChoices: ["Ring", "Clock", "Car"] },
    { id: "8", question: "I have buttons or a screen to press,I help you talk and stay in touch, no less.I can be loud, or sometimes quiet, Call your friends, I’m your chat pilot. What am I?", 
      image: require("@/assets/riddles/telephone.png"), correctAnswer: "Telephone", answerChoices: ["TV", "Telephone", "Clock"] },
    { id: "9", question: "I have hands but cannot clap, I tick and tock right on the map.I tell you when to sleep or play,I keep track of night and day. What am I?", 
      image: require("@/assets/riddles/clock.png"), correctAnswer: "Clock", answerChoices: ["Clock", "Car", "House"] },
    { id: "10", question: "I have a roof and walls so tight,I keep you safe both day and night.Inside me, you eat, sleep, and play,I’m where you live most every day. What am I?",   
      image: require("@/assets/riddles/house.png"), correctAnswer: "House", answerChoices: ["Tree", "House", "Box"] },
    { id: "11", question: "I stand tall and touch the sky,Leaves and branches waving high.I give you shade and fruits to eat,Homes for birds, and roots so deep. What am I?", 
      image: require("@/assets/riddles/tree.png"), correctAnswer: "Tree", answerChoices: ["Tree", "Carrot", "Cloud"] },
    { id: "12", question: "I live on a farm and chew my cud,I give you milk that’s fresh and good.With a moo, I call my friends around,On green pastures, I’m often found.What am I?", 
      image: require("@/assets/riddles/cow.png"), correctAnswer: "Cow", answerChoices: ["Whale", "Cow", "Pig"] },
    { id: "13", question: "I’m small and round, red and sweet,A perfect little summer treat.You’ll often find me in pairs, not one,Eat me quick before the fun is done. What am I?", 
      image: require("@/assets/riddles/cherries.png"), correctAnswer: "Cherry", answerChoices: ["Cherry", "Orange", "Mango"] },
    { id: "14", question: "I’m orange and crunchy, long and thin,I grow in the ground, not on a bin.Rabbits love me, that’s no lie,Pull me up and give me a try.What am I?", 
      image: require("@/assets/riddles/carrot.png"), correctAnswer: "Carrot", answerChoices: ["Carrot", "Mango", "Milk"] },
    { id: "15", question: "I twinkle in the sky at night, But I’m not a lamp, nor a kite.I’m far away, yet light I send,Guiding travelers ‘til the end. What am I?", 
      image: require("@/assets/riddles/star.png"), correctAnswer: "Star", answerChoices: ["Star", "Sun", "Moon"] },
    { id: "16", question: "I’m the largest in the ocean blue, Yet I swim with grace, not a clue.I sing my songs both loud and deep,In watery worlds, I dive and leap. What am I?", 
      image: require("@/assets/riddles/whale.png"), correctAnswer: "Whale", answerChoices: ["Whale", "Dolphin", "Shark"] },
    { id: "17", question: "I show you stories, big and small,I can make you laugh, or sometimes bawl.I sit in your room, but I travel far,Bringing shows and movies right where you are.What am I?.", 
      image: require("@/assets/riddles/tv.png"), correctAnswer: "TV", answerChoices: ["TV", "Phone", "Clock"] },
    { id: "18", question: "Smooth on the outside, juicy within,Peel me open, let the fun begin!What am I?", 
      image: require("@/assets/riddles/mango.png"), correctAnswer: "Mango", answerChoices: ["Mango", "Orange", "Cherry"] },
    { id: "19", question: "Green on the outside, red within,Black dots like seeds are sprinkled in.Juicy and sweet, I’m summer’s delight,Cool me in slices, and take a bite. What am I?.", 
      image: require("@/assets/riddles/watermelon.png"), correctAnswer: "Watermelon", answerChoices: ["Watermelon", "Cherry", "Orange"] },
    { id: "20", question: "I have wheels but I’m not a bike,I take you places day or night.I run on roads, not on a track,And sometimes I honk when you’re at my back. What am I?", 
      image: require("@/assets/riddles/car.png"), correctAnswer: "Car", answerChoices: ["Car", "Rocket", "Ring"] }, 
  ], []);

  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [results, setResults] = useState<Record<string, "idle" | "correct" | "incorrect">>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    const shuffled = [...rawRiddles].sort(() => 0.5 - Math.random());
    const session = shuffled.slice(0, 10);
    setRiddles(session);
    const initA: Record<string, string | null> = {};
    const initR: Record<string, "idle" | "correct" | "incorrect"> = {};
    session.forEach(r => { initA[r.id] = null; initR[r.id] = "idle"; });
    setAnswers(initA);
    setResults(initR);
  }, [rawRiddles]);

  const { play: playInstruction } = useInstruction(
    "riddles",
    "Listen to the riddle and tap the correct answer."
  );

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const scalesRef = useRef<Record<string, Animated.Value>>({});
  const ensureScale = (key: string) => {
    if (!scalesRef.current[key]) {
      scalesRef.current[key] = new Animated.Value(1);
    }
    return scalesRef.current[key];
  };

  const onSpeakQuestion = (q: string) => {
    TTS.speak(q, { rate: 0.9, pitch: 1.1 });
  };

  const onSelect = async (riddle: Riddle, option: string) => {
    if (results[riddle.id] === "correct") return;
    setAnswers(prev => ({ ...prev, [riddle.id]: option }));

    const s = ensureScale(`${riddle.id}-${option}`);
    Animated.sequence([
      Animated.spring(s, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(s, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();

    if (option === riddle.correctAnswer) {
      setResults(prev => ({ ...prev, [riddle.id]: "correct" }));
      setCorrectCount(c => c + 1);
      playbackService.playSound("correct");
      TTS.speak("Correct!", { rate: 0.95, pitch: 1.1 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setResults(prev => ({ ...prev, [riddle.id]: "incorrect" }));
      playbackService.playSound("incorrect");
      TTS.speak("Try again", { rate: 0.95, pitch: 1.0 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const total = riddles.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const answeredCount = useMemo(() => Object.keys(answers).filter(k => answers[k] != null).length, [answers]);

  useEffect(() => {
    if (total === 0) return;
    if (answeredCount === total && !showResult) {
      const score = correctCount;
      const encouragement =
        score >= 8 ? "Excellent work! You're a riddle master!" :
        score >= 5 ? "Good job! Keep practicing!" :
        "Nice try! Let’s practice more!";

      (async () => {
        try {
          await addResult({
            activityId: "riddles",
            category: "practice",
            score,
            maxScore: total,
            completed: true,
          });
        } catch {}
        playbackService.playSound("correct");
        TTS.speak(encouragement, { rate: 0.95, pitch: 1.1 });
        setFinalScore(score);
        setShowResult(true);
      })();
    }
  }, [answeredCount, correctCount, total, showResult]);

  const handlePlayAgain = () => {
    const shuffled = [...rawRiddles].sort(() => 0.5 - Math.random());
    const session = shuffled.slice(0, 10);
    setRiddles(session);
    const initA: Record<string, string | null> = {};
    const initR: Record<string, "idle" | "correct" | "incorrect"> = {};
    session.forEach(r => { initA[r.id] = null; initR[r.id] = "idle"; });
    setAnswers(initA);
    setResults(initR);
    setCorrectCount(0);
    setFinalScore(0);
    setShowResult(false);
    Speech.stop();
  };

  const handleExit = () => {
    setShowResult(false);
    Speech.stop();
    router.replace("/pract");
  };

  return (
    <View style={[styles.bg, { backgroundColor: screenBg }]}>
      <View style={styles.safe}>
        <View style={styles.header}>
          <BackButton targetRoute="/pract" />
          <Text style={styles.title}>RIDDLES</Text>
          <InstructionButton onPress={playInstruction} />
        </View>

        <View style={styles.scoreBar}>
          <Text style={styles.scoreText}>Correct: {correctCount}/{total}</Text>
          <Text style={styles.scoreText}>Score: {percent}%</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.list, { paddingHorizontal: padding }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.grid, { gap, paddingBottom: 24 }]}>
            {riddles.map((riddle, index) => {
              const cardBg = pastelCardColors[index % pastelCardColors.length];
              const accent = accentColors[index % accentColors.length];
              return (
              <View key={riddle.id} style={[styles.card, { width: cardWidth, backgroundColor: cardBg }]}>
                <View style={[styles.cardHeader, { backgroundColor: accent }]}>
                  <Text style={styles.cardTitle}>What Am I?</Text>
                  <TouchableOpacity onPress={() => onSpeakQuestion(riddle.question)} activeOpacity={0.8} style={styles.speakBtn}>
                    <Text style={styles.speakText}>▶</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.question}>{riddle.question}</Text>
                <View style={styles.imageWrap}>
                  <Image source={riddle.image} style={{ width: 96, height: 96 }} resizeMode="contain" />
                </View>
                <View style={styles.choices}>
                  {riddle.answerChoices.map((opt, idx) => {
                    const state = results[riddle.id];
                    const chosen = answers[riddle.id] === opt;
                    const isCorrect = opt === riddle.correctAnswer && state === "correct";
                    const isWrong = chosen && state === "incorrect";
                    const s = ensureScale(`${riddle.id}-${opt}`);
                    return (
                      <Animated.View key={idx} style={{ transform: [{ scale: s }] }}>
                        <TouchableOpacity
                          onPress={() => onSelect(riddle, opt)}
                          activeOpacity={0.9}
                          style={[
                            styles.choice,
                            isCorrect && styles.choiceCorrect,
                            isWrong && styles.choiceWrong,
                          ]}
                        >
                          <Text style={[styles.choiceText, (isCorrect || isWrong) ? styles.choiceTextStrong : null]}>{opt}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            )})}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showResult}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{finalScore >= 8 ? "Great Job!" : finalScore >= 5 ? "Nice Work!" : "Good Try!"}</Text>
            <Text style={styles.modalScore}>Score: {finalScore} / {total}</Text>
            <Text style={styles.modalMessage}>
              {finalScore >= 8 ? "Excellent work! You're a riddle master!" :
               finalScore >= 5 ? "Good job! Keep practicing!" :
               "Nice try! Let’s practice more!"}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.playAgain]} onPress={handlePlayAgain} activeOpacity={0.85}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.exit]} onPress={handleExit} activeOpacity={0.85}>
                <Ionicons name="exit" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  safe: { flex: 1, paddingTop: 12 },
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#3E2723",
    letterSpacing: 1,
  },
  scoreBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5D4037",
  },
  list: { paddingVertical: 8 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#FFF8E1",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFCC80",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4E342E",
  },
  speakBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFB74D",
    alignItems: "center",
    justifyContent: "center",
  },
  speakText: {
    color: "#fff",
    fontWeight: "900",
  },
  question: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5D4037",
    marginBottom: 10,
  },
  imageWrap: { alignItems: "center", marginVertical: 10 },
  choices: { marginTop: 8, gap: 8 },
  choice: {
    backgroundColor: "#E1F5FE",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceCorrect: {
    backgroundColor: "#C8E6C9",
    borderWidth: 2,
    borderColor: "#66BB6A",
  },
  choiceWrong: {
    backgroundColor: "#FFCDD2",
    borderWidth: 2,
    borderColor: "#EF5350",
  },
  choiceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#37474F",
  },
  choiceTextStrong: {
    color: "#1B5E20",
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
    fontSize: 28,
    fontWeight: "900",
    color: "#3E2723",
    marginBottom: 8,
  },
  modalScore: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4E342E",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5D4037",
    textAlign: "center",
    marginBottom: 24,
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
  playAgain: {
    backgroundColor: "#2196F3",
  },
  exit: {
    backgroundColor: "#FF7043",
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});

