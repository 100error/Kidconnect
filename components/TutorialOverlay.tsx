import { TTS } from "@/services/audio/tts";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Speech from "expo-speech";
import { AnimatePresence, MotiView } from "moti";
import React, { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TutorialOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  lessonLayout?: { x: number; y: number; width: number; height: number };
  progressLayout?: { x: number; y: number; width: number; height: number };
  isHomeTutorial?: boolean;
}

const KICO_IMAGES = {
  happy: require("@/assets/avatarfull/happy.png"),
  ha: require("@/assets/avatarfull/ha.png"),
  wow: require("@/assets/avatarfull/wow.png"),
  yay: require("@/assets/avatarfull/yay.png"),
  sad: require("@/assets/avatarfull/sad.png"),
};

type KicoEmotion = keyof typeof KICO_IMAGES;

interface TutorialStep {
  title: string;
  description: string;
  tts?: string;
  emotion?: KicoEmotion;
  target?: { x: number; y: number; width: number; height: number } | null;
  position?: "center" | "top" | "bottom";
}

const { width, height } = Dimensions.get("window");

export default function TutorialOverlay({
  isVisible,
  onClose,
  lessonLayout,
  progressLayout,
  isHomeTutorial = false,
}: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  const homeSteps: TutorialStep[] = [
    {
      title: "Hi! I'm Kico!",
      description: "Welcome to KidConnect!",
      tts: "Hi! I’m Kico! Welcome to KidConnect!",
      emotion: "happy",
    },
    {
      title: "Your Learning Buddy",
      description: "I’ll help you learn new words and practice speaking!",
      tts: "I’ll help you learn new words and practice speaking!",
      emotion: "happy",
    },
    {
      title: "Explore Sections",
      description: "You can explore Vocabulary, Practice, and Games!",
      tts: "You can explore Vocabulary, Practice, and Games!",
      emotion: "ha",
    },
    {
      title: "Start Learning",
      description: "Tap any section to start learning and have fun!",
      tts: "Tap any section to start learning and have fun!",
      emotion: "wow",
    },
    {
      title: "Ready?",
      description: "Let's begin!",
      tts: "Let’s begin!",
      emotion: "yay",
    },
  ];

  const appSteps: TutorialStep[] = [
    {
      title: "Welcome!",
      description:
        "Welcome to KidConnect! Let's quickly learn what each button does.",
      target: null,
      position: "center",
      emotion: "happy",
    },
    {
      title: "Lessons",
      description:
        "Choose what to do:\n• Vocabulary – learn new words\n• Practices – do exercises\n• Games – play while learning",
      target: lessonLayout,
      position: "top",
      emotion: "ha",
    },
    {
      title: "Progress",
      description: "This shows your overall progress. Aim for 100%!",
      target: progressLayout,
      position: "bottom",
      emotion: "wow",
    },
  ];

  const steps = isHomeTutorial ? homeSteps : appSteps;

  useEffect(() => {
    if (isVisible && isHomeTutorial) {
      const currentStep = steps[step];
      if (currentStep.tts) {
        Speech.stop();
        TTS.speak(currentStep.tts, { rate: 0.85, pitch: 1.1 });
      }
    }
    return () => {
      Speech.stop();
    };
  }, [step, isVisible, isHomeTutorial]);

  const handleNext = useCallback(() => {
    Speech.stop();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  }, [step, steps.length, onClose]);

  const handleSkip = useCallback(() => {
    Speech.stop();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      const onBackPress = () => {
        handleSkip();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }
  }, [isVisible, handleSkip]);

  if (!isVisible) return null;

  const currentStepData = steps[step];

  if (isHomeTutorial) {
    return (
      <Modal transparent visible={isVisible} animationType="fade">
        <View style={styles.homeOverlay}>
          <BlurView
            intensity={30}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            activeOpacity={1}
            onPress={handleNext}
            style={styles.homeContent}
          >
            <View style={styles.dialogueContainer}>
              <AnimatePresence exitBeforeEnter>
                <MotiView
                  key={step}
                  from={{ opacity: 0, scale: 0.9, translateX: 20 }}
                  animate={{ opacity: 1, scale: 1, translateX: 0 }}
                  exit={{ opacity: 0, scale: 0.9, translateX: -20 }}
                  transition={{ type: "timing", duration: 400 }}
                  style={styles.dialogueBubble}
                >
                  <Text style={styles.dialogueTitle}>
                    {currentStepData.title}
                  </Text>
                  <Text style={styles.dialogueText}>
                    {currentStepData.description}
                  </Text>

                  <View style={styles.bubbleArrowLeft} />

                  <View style={styles.stepIndicator}>
                    {steps.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i === step && styles.activeDot,
                          i < step && styles.completedDot,
                        ]}
                      />
                    ))}
                  </View>
                </MotiView>
              </AnimatePresence>

              <View style={styles.kicoContainer}>
                <Image
                  source={KICO_IMAGES[currentStepData.emotion || "happy"]}
                  style={styles.kicoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.homeButtons}>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>
                  {step === steps.length - 1 ? "Let's Go!" : "Next"}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Original Overlay Logic for non-home tutorials
  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

        {currentStepData.target && (
          <View
            style={[
              styles.highlight,
              {
                top: currentStepData.target.y - 10,
                left: currentStepData.target.x - 10,
                width: currentStepData.target.width + 20,
                height: currentStepData.target.height + 20,
              },
            ]}
          />
        )}

        <TouchableOpacity
          style={styles.content}
          activeOpacity={1}
          onPress={handleNext}
        >
          <View
            style={[
              styles.contextualContainer,
              currentStepData.position === "center" && styles.centerStep,
              currentStepData.position === "top" && {
                bottom: height - (currentStepData.target?.y || 0) + 20,
              },
              currentStepData.position === "bottom" && {
                top:
                  (currentStepData.target?.y || 0) +
                  (currentStepData.target?.height || 0) +
                  20,
              },
            ]}
          >
            <View style={styles.dialogueContainerContextual}>
              <View style={styles.dialogueBubbleContextual}>
                <Text style={styles.originalTitle}>
                  {currentStepData.title}
                </Text>
                <Text style={styles.originalDesc}>
                  {currentStepData.description}
                </Text>
                <View style={styles.bubbleArrowRightSmall} />
              </View>

              <View style={styles.kicoContextualWrapper}>
                <Image
                  source={KICO_IMAGES[currentStepData.emotion || "happy"]}
                  style={styles.kicoImageSmall}
                  resizeMode="contain"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.originalNext} onPress={handleNext}>
              <Text style={styles.originalNextText}>
                {step === steps.length - 1 ? "Got it!" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  homeOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  homeContent: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialogueContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    justifyContent: "center",
    gap: 10,
  },
  dialogueBubble: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    flex: 1,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 60,
    position: "relative",
  },
  bubbleArrowLeft: {
    position: "absolute",
    bottom: 20,
    right: -15,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 20,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
  },
  dialogueTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FF6F00",
    marginBottom: 8,
    textAlign: "center",
  },
  dialogueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#455A64",
    textAlign: "center",
    lineHeight: 22,
  },
  kicoContainer: {
    width: 140,
    height: 180,
    justifyContent: "flex-end",
  },
  kicoImage: {
    width: 140,
    height: 140,
  },
  homeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    maxWidth: 400,
    marginTop: 20,
    gap: 20,
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipBtnText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "800",
  },
  nextBtn: {
    backgroundColor: "#FF6F00",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  activeDot: {
    backgroundColor: "#FF6F00",
    width: 20,
  },
  completedDot: {
    backgroundColor: "#FFCC80",
  },
  // Original styles
  overlay: { flex: 1 },
  highlight: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#fff",
    borderStyle: "dashed",
  },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  contextualContainer: {
    position: "absolute",
    width: "90%",
    alignItems: "center",
  },
  dialogueContainerContextual: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  dialogueBubbleContextual: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    position: "relative",
  },
  bubbleArrowRightSmall: {
    position: "absolute",
    bottom: 15,
    right: -10,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
  },
  kicoContextualWrapper: {
    width: 70,
    height: 70,
    justifyContent: "flex-end",
  },
  kicoImageSmall: {
    width: 70,
    height: 70,
  },
  centerStep: { position: "relative" },
  originalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1d99b5",
    marginBottom: 4,
  },
  originalDesc: {
    fontSize: 14,
    color: "#444",
    lineHeight: 18,
  },
  originalNext: {
    backgroundColor: "#1d99b5",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    alignSelf: "flex-end",
    marginRight: 80,
  },
  originalNextText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
