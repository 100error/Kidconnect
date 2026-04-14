import InstructionButton from "@/components/InstructionButton";
import OfflineGuard from "@/components/OfflineGuard";
import BackButton from "@/components/ui/BackButton";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { audioService } from "@/services/audio/audioService";
import { musicService } from "@/services/audio/music";
import { playbackService } from "@/services/audio/playback";
import { ensureMicPermission } from "@/services/mic";
import { addResult } from "@/services/progress";
import { speechService } from "@/services/speechService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { MotiView } from "moti";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet as RNStyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import * as Progress from "react-native-progress";

const KICO_HAPPY = require("@/assets/avatarfull/happy.png");
const KICO_YAY = require("@/assets/avatarfull/yay.png");

type Item = {
  cause: string;
  effect: string;
  image: ImageSourcePropType;
};

export default function CauseEffect() {
  const router = useRouter();
  const { isMountedRef, safeRun } = useSafeAsync(); // ✅ GLOBAL CRASH-PROOF HOOK
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const CARD_MAX = 600;

  // Palette: match Games button (teal family) and pastel cards
  const bgColors = ["#B2DFDB", "#E0F2F1"]; // More vibrant light teal -> light blue
  const pastelCardColors = [
    "#E3F2FD",
    "#FFF3E0",
    "#FCE4EC",
    "#E8F5E9",
    "#EDE7F6",
    "#FFE0B2",
  ];
  const accentColors = [
    "#64B5F6",
    "#FFB74D",
    "#F06292",
    "#81C784",
    "#9575CD",
    "#FF8A65",
  ];

  // Dataset (20 items)
  const DATA: Item[] = useMemo(
    () => [
      {
        cause: "It rained heavily all night.",
        effect: "The ground is wet.",
        image: require("@/assets/causeeffect/gotwet.jpg"),
      },
      {
        cause: "I forgot my umbrella.",
        effect: "I got wet.",
        image: require("@/assets/causeeffect/heavyrain.jpg"),
      },
      {
        cause: "We watered the plants.",
        effect: "The plants grew.",
        image: require("@/assets/causeeffect/waterplants.jpg"),
      },
      {
        cause: "She practiced every day.",
        effect: "She became better.",
        image: require("@/assets/causeeffect/better.jpg"),
      },
      {
        cause: "The power went out.",
        effect: "The lights turned off.",
        image: require("@/assets/causeeffect/turnedoff.jpg"),
      },
      {
        cause: "The sun came out.",
        effect: "It became warm.",
        image: require("@/assets/causeeffect/warm.jpg"),
      },
      {
        cause: "He ate too quickly.",
        effect: "He got a stomachache.",
        image: require("@/assets/causeeffect/stomachache.jpg"),
      },
      {
        cause: "The alarm rang.",
        effect: "I woke up.",
        image: require("@/assets/causeeffect/alarm.jpg"),
      },
      {
        cause: "I studied hard.",
        effect: "I passed the test.",
        image: require("@/assets/causeeffect/pasttest.jpg"),
      },
      {
        cause: "The road was icy.",
        effect: "The car slipped.",
        image: require("@/assets/causeeffect/carslipped.jpg"),
      },
      {
        cause: "We opened the window.",
        effect: "Fresh air came in.",
        image: require("@/assets/causeeffect/freshair.jpg"),
      },
      {
        cause: "The dog barked loudly.",
        effect: "The baby woke up.",
        image: require("@/assets/causeeffect/babywokeup.jpg"),
      },
      {
        cause: "I watered the floor.",
        effect: "The floor is wet.",
        image: require("@/assets/causeeffect/waterfloor.jpg"),
      },
      {
        cause: "She forgot to charge her phone.",
        effect: "Her phone died.",
        image: require("@/assets/causeeffect/phonedied.jpg"),
      },
      {
        cause: "He stayed up late.",
        effect: "He felt tired.",
        image: require("@/assets/causeeffect/tired.jpg"),
      },
      {
        cause: "The wind was strong.",
        effect: "The kite flew high.",
        image: require("@/assets/causeeffect/kitehigh.jpg"),
      },
      {
        cause: "We planted seeds.",
        effect: "Flowers grew.",
        image: require("@/assets/causeeffect/flowersgrew.jpg"),
      },
      {
        cause: "It was very hot.",
        effect: "The ice melted.",
        image: require("@/assets/causeeffect/icemelt.jpg"),
      },
      {
        cause: "She shared her toys.",
        effect: "She made friends.",
        image: require("@/assets/causeeffect/madefriends.jpg"),
      },
      {
        cause: "We cleaned the room.",
        effect: "The room looked neat.",
        image: require("@/assets/causeeffect/cleanroom.jpg"),
      },
    ],
    [],
  );

  // Session: pick 10 random
  const [sessionSeed, setSessionSeed] = useState(0);
  const items = useMemo(() => {
    const shuffled = [...DATA].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, [DATA, sessionSeed]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "listening" | "correct" | "incorrect"
  >("idle");
  const [recognized, setRecognized] = useState("");
  const [showResult, setShowResult] = useState(false);

  const isRunningRef = useRef(false); // ✅ MULTIPLE EXECUTION GUARD
  const hasSavedRef = useRef(false); // ✅ SAVE LOCK
  const sessionIdRef = useRef(`causeeffect-${Date.now()}`); // ✅ UNIQUE SESSION ID

  const totalQuestions = items.length;
  const current = items[currentIndex];

  useEffect(() => {
    hasSavedRef.current = false;
    sessionIdRef.current = `causeeffect-${Date.now()}`;
  }, [sessionSeed]);

  const cardBg = pastelCardColors[currentIndex % pastelCardColors.length];
  const accent = accentColors[currentIndex % accentColors.length];

  // ✅ SAFE EXIT FUNCTION
  const safeExit = useCallback(async () => {
    try {
      await speechService.stopRecording();
      await audioService.stop();
      if (!isMountedRef.current) return;
      router.replace("/games");
    } catch (e) {
      console.log("Safe Exit Error:", e);
    }
  }, [router, isMountedRef]);

  useEffect(() => {
    if (items.length > 0 && !showResult) {
      const guidance = `${current.cause} ${current.effect}`;
      audioService.speak(guidance);
    }
  }, [currentIndex, items, showResult]);

  // ✅ GLOBAL AUDIO CLEANUP & HARDWARE BACK
  useEffect(() => {
    const onBackPress = () => {
      void safeExit();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => {
      subscription.remove();
      void speechService.stopRecording();
      void audioService.stop();
    };
  }, [safeExit]);

  // ✅ STOP BACKGROUND MUSIC ON LESSON SCREENS
  useFocusEffect(
    useCallback(() => {
      void musicService.stopAsync();
      return () => {};
    }, []),
  );

  const speakInstruction = useCallback(() => {
    audioService.speak("Repeat the sentence.");
  }, []);

  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isExactMatch = (heard: string, target: string) => {
    if (!heard || !target) return false;
    return normalize(heard) === normalize(target);
  };

  const toggleListening = async () => {
    if (isRunningRef.current) return; // ✅ BLOCK MULTIPLE EXECUTION
    isRunningRef.current = true;

    if (isListening) {
      if (!isMountedRef.current) return;
      setIsListening(false);
      try {
        const uri = await safeRun(() => speechService.stopRecording());
        if (!isMountedRef.current) return;

        if (uri) {
          const result = await safeRun(() =>
            speechService.recognizeSpeech(uri),
          );
          if (!isMountedRef.current || !result) {
            isRunningRef.current = false;
            return;
          }

          const heardText = result.transcript || "";
          setRecognized(heardText);

          const ok = isExactMatch(heardText, current.effect);
          if (ok) {
            setStatus("correct");
            playbackService.playSound("correct");
            audioService.speak("Correct!");
            const nextCorrect = correctAnswers + 1;
            const isLast = currentIndex === totalQuestions - 1;
            if (isLast) {
              if (hasSavedRef.current) {
                isRunningRef.current = false;
                return;
              }
              hasSavedRef.current = true;

              const score = nextCorrect;
              await safeRun(() =>
                addResult({
                  activityId: "causeeffect",
                  sessionId: sessionIdRef.current,
                  category: "game",
                  score,
                  maxScore: 10,
                  completed: true,
                  timestamp: new Date().toISOString(),
                }),
              );

              if (!isMountedRef.current) return;

              setTimeout(() => {
                if (isMountedRef.current) {
                  setShowResult(true);
                  isRunningRef.current = false;
                }
              }, 600);
            } else {
              setTimeout(() => {
                if (isMountedRef.current) {
                  setCurrentIndex((i) => i + 1);
                  setCorrectAnswers(nextCorrect);
                  setStatus("idle");
                  setRecognized("");
                  isRunningRef.current = false;
                }
              }, 1500);
            }
          } else {
            setStatus("incorrect");
            playbackService.playSound("incorrect");
            audioService.speak("Try again!... Say it exactly.");
            setTimeout(() => {
              if (isMountedRef.current) {
                setStatus("idle");
                isRunningRef.current = false;
              }
            }, 1200);
          }
        } else {
          setStatus("idle");
          isRunningRef.current = false;
        }
      } catch {
        if (isMountedRef.current) setStatus("idle");
        isRunningRef.current = false;
      }
      return;
    }

    try {
      const ok = await safeRun(() => ensureMicPermission());
      if (!isMountedRef.current || !ok) {
        isRunningRef.current = false;
        return;
      }

      playbackService.playSound("correct");
      setStatus("listening");
      setIsListening(true);
      await safeRun(() => speechService.startRecording());
    } catch {
      if (isMountedRef.current) {
        setIsListening(false);
        setStatus("idle");
      }
    } finally {
      isRunningRef.current = false;
    }
  };

  const handlePlayAgain = async () => {
    if (!isMountedRef.current) return;
    await safeExit();
    playbackService.playSound("correct");
    setSessionSeed((s) => s + 1);
    setCurrentIndex(0);
    setCorrectAnswers(0);
    setRecognized("");
    setStatus("idle");
    setShowResult(false);
  };

  const handleExit = async () => {
    if (!isMountedRef.current) return;
    await safeExit();
    playbackService.playSound("correct");
    router.replace("/games");
  };

  const encouragement =
    correctAnswers >= 8
      ? "Excellent! You're great at understanding cause and effect!"
      : correctAnswers >= 5
        ? "Good job! Keep practicing!"
        : "Nice try! Let's keep learning!";

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

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Question {currentIndex + 1} of {totalQuestions}
            </Text>
            <Progress.Bar
              progress={(currentIndex + 1) / totalQuestions}
              width={null}
              height={10}
              borderRadius={5}
              color={accent}
              unfilledColor="#FFFFFF"
              borderWidth={0}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.contentContainer}>
            <View
              style={[
                styles.cardContainer,
                { maxWidth: isTablet ? CARD_MAX : "100%" },
              ]}
            >
              <View
                style={[
                  styles.card,
                  { backgroundColor: cardBg },
                  status === "correct" && styles.cardCorrect,
                  status === "incorrect" && styles.cardIncorrect,
                ]}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.3)", "transparent"]}
                  style={styles.cardGradient}
                />

                <View
                  style={[
                    styles.imageContainer,
                    { backgroundColor: accent + "20" },
                  ]}
                >
                  <Image
                    source={current.image}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>

                <View
                  style={[
                    styles.causeBubble,
                    { backgroundColor: accent + "15" },
                  ]}
                >
                  <Text style={styles.label}>Cause:</Text>
                  <Text style={styles.causeText}>{current.cause}</Text>
                </View>

                <View
                  style={[
                    styles.targetBubble,
                    { backgroundColor: accent + "10" },
                  ]}
                >
                  <Text style={styles.label}>Your sentence:</Text>
                  <Text style={styles.targetText}>{current.effect}</Text>
                </View>

                {status === "correct" && (
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "timing", duration: 250 }}
                    style={styles.feedbackIcon}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={80}
                      color="#4CAF50"
                    />
                  </MotiView>
                )}

                {status === "incorrect" && (
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "timing", duration: 250 }}
                    style={styles.feedbackIcon}
                  >
                    <Ionicons name="close-circle" size={80} color="#F44336" />
                  </MotiView>
                )}

                <TouchableOpacity
                  onPress={toggleListening}
                  activeOpacity={0.8}
                  style={[
                    styles.micButton,
                    { backgroundColor: accent },
                    status === "listening" && styles.micListening,
                  ]}
                >
                  {status === "listening" && (
                    <MotiView
                      from={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        type: "timing",
                        duration: 1000,
                        loop: true,
                        repeatReverse: false,
                      }}
                      style={[styles.micPulse, { backgroundColor: accent }]}
                    />
                  )}
                  <Ionicons
                    name={isListening ? "stop" : "mic"}
                    size={32}
                    color="#fff"
                  />
                </TouchableOpacity>

                <Text style={styles.micLabel}>
                  {status === "listening" ? "Listening..." : "Tap to Speak"}
                </Text>

                {status === "listening" && (
                  <View style={styles.waveContainer}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <MotiView
                        key={i}
                        from={{ height: 10 }}
                        animate={{ height: Math.random() * 30 + 10 }}
                        transition={{
                          type: "timing",
                          duration: 300,
                          loop: true,
                          repeatReverse: true,
                          delay: i * 100,
                        }}
                        style={[styles.waveBar, { backgroundColor: accent }]}
                      />
                    ))}
                  </View>
                )}

                <Text style={styles.instruction}>Repeat the sentence.</Text>
                {!!recognized && (
                  <View style={styles.recognizedContainer}>
                    <Text style={styles.recognizedLabel}>Heard:</Text>
                    <Text style={styles.recognized}>{recognized}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.mascotContainer}>
              <Image
                source={status === "correct" ? KICO_YAY : KICO_HAPPY}
                style={{
                  width: isTablet ? 120 : 100,
                  height: isTablet ? 120 : 100,
                }}
                resizeMode="contain"
              />
            </View>
          </View>
        </OfflineGuard>
      </SafeAreaView>

      <Modal
        visible={showResult}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 250 }}
            style={styles.modalCard}
          >
            <Text style={styles.modalTitle}>Great Speaking!</Text>
            <Image
              source={KICO_YAY}
              style={{ width: 150, height: 150, marginBottom: 10 }}
              resizeMode="contain"
            />
            <Text style={styles.modalScore}>
              You got {correctAnswers} out of {totalQuestions} correct!
            </Text>
            <Text style={styles.modalMessage}>{encouragement}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.playAgain]}
                onPress={handlePlayAgain}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.exit]}
                onPress={handleExit}
              >
                <Ionicons name="exit" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = RNStyleSheet.create({
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
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2D2D2D",
    flex: 1,
    textAlign: "center",
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#455A64",
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    width: "100%",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
  },
  cardCorrect: {
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.3,
  },
  cardIncorrect: {
    borderColor: "#F44336",
    shadowColor: "#F44336",
    shadowOpacity: 0.3,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  image: {
    width: "90%",
    height: "90%",
  },
  causeBubble: {
    width: "100%",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  targetBubble: {
    width: "100%",
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#546E7A",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  causeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#263238",
    textAlign: "center",
    lineHeight: 28,
  },
  targetText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1d99b5",
    textAlign: "center",
    lineHeight: 32,
  },
  micButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  micPulse: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  micListening: {
    transform: [{ scale: 1.1 }],
  },
  micLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#455A64",
    marginBottom: 16,
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 40,
    marginBottom: 16,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  instruction: {
    fontSize: 18,
    fontWeight: "700",
    color: "#78909C",
    fontStyle: "italic",
  },
  feedbackIcon: {
    position: "absolute",
    top: "40%",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  recognizedContainer: {
    marginTop: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  recognizedLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#78909C",
  },
  recognized: {
    fontSize: 16,
    fontWeight: "800",
    color: "#263238",
  },
  mascotContainer: {
    position: "absolute",
    bottom: -10,
    right: 0,
    zIndex: -1,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFF",
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2E7D32",
    marginBottom: 16,
  },
  modalScore: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4E342E",
    marginVertical: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5D4037",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
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
    paddingVertical: 16,
    borderRadius: 20,
  },
  playAgain: { backgroundColor: "#2196F3" },
  exit: { backgroundColor: "#FF7043" },
  modalButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },
});
