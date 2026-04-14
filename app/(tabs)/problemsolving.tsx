import InstructionButton from "@/components/InstructionButton";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from "@/hooks/useInstruction";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { musicService } from "@/services/audio/music";
import { TTS } from "@/services/audio/tts";
import { speechService } from "@/services/speechService";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

type ProblemSection = {
  title: string;
  color: string;
  darkColor: string;
  items: ProblemItem[];
};

type ProblemItem = {
  id: string;
  question: string;
  answer: string;
  icon: string;
  type: "riddle" | "analogy" | "logic" | "fact";
};

export default function ProblemSolving() {
  const router = useRouter();
  const { isMountedRef, safeRun } = useSafeAsync();
  const isRunningRef = useRef(false); // ✅ MULTIPLE EXECUTION GUARD
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const numColumns = isTablet ? 2 : 1;
  const gap = 12;
  const padding = 16;
  const cardWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  const { play: playInstruction } = useInstruction(
    "problemsolving",
    "Solve language puzzles! Tap a card to hear the question, then the answer.",
  );

  // ✅ CENTRALIZED SAFE EXIT
  const safeExit = useCallback(async () => {
    await speechService.stopRecording();
    Speech.stop();
    if (!isMountedRef.current) return;
    router.replace("/vocab");
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

  const sections: ProblemSection[] = useMemo(
    () => [
      {
        title: "Riddles",
        color: "#FFF59D", // Light Yellow
        darkColor: "#FBC02D",
        items: [
          {
            id: "r1",
            question: "I have a face and hands but no body. What am I?",
            answer: "A Clock",
            icon: "⏰",
            type: "riddle",
          },
          {
            id: "r2",
            question: "I have keys but no locks. What am I?",
            answer: "A Piano",
            icon: "🎹",
            type: "riddle",
          },
          {
            id: "r3",
            question: "I am full of holes but hold water. What am I?",
            answer: "A Sponge",
            icon: "🧽",
            type: "riddle",
          },
          {
            id: "r4",
            question: "I go up but never come down. What am I?",
            answer: "Your Age",
            icon: "🎂",
            type: "riddle",
          },
          {
            id: "r5",
            question: "I have a neck but no head. What am I?",
            answer: "A Bottle",
            icon: "🍾",
            type: "riddle",
          },
        ],
      },
      {
        title: "Analogies",
        color: "#B3E5FC", // Light Blue
        darkColor: "#0288D1",
        items: [
          {
            id: "a1",
            question: "Hot is to Cold as Up is to ___",
            answer: "Down",
            icon: "⬇️",
            type: "analogy",
          },
          {
            id: "a2",
            question: "Finger is to Hand as Toe is to ___",
            answer: "Foot",
            icon: "🦶",
            type: "analogy",
          },
          {
            id: "a3",
            question: "Bird is to Fly as Fish is to ___",
            answer: "Swim",
            icon: "🐟",
            type: "analogy",
          },
          {
            id: "a4",
            question: "Doctor is to Hospital as Teacher is to ___",
            answer: "School",
            icon: "🏫",
            type: "analogy",
          },
          {
            id: "a5",
            question: "Night is to Moon as Day is to ___",
            answer: "Sun",
            icon: "☀️",
            type: "analogy",
          },
        ],
      },
      {
        title: "Cause & Effect",
        color: "#FFCCBC", // Light Orange
        darkColor: "#D84315",
        items: [
          {
            id: "c1",
            question: "Cause: It was raining.",
            answer: "Effect: I used an umbrella.",
            icon: "☂️",
            type: "logic",
          },
          {
            id: "c2",
            question: "Cause: I missed the bus.",
            answer: "Effect: I was late for school.",
            icon: "🚌",
            type: "logic",
          },
          {
            id: "c3",
            question: "Cause: The baby was hungry.",
            answer: "Effect: The baby cried.",
            icon: "👶",
            type: "logic",
          },
          {
            id: "c4",
            question: "Cause: I studied hard.",
            answer: "Effect: I got a good grade.",
            icon: "💯",
            type: "logic",
          },
          {
            id: "c5",
            question: "Cause: I dropped the glass.",
            answer: "Effect: It broke.",
            icon: "🥛",
            type: "logic",
          },
        ],
      },
      {
        title: "Fact vs Opinion",
        color: "#C8E6C9", // Light Green
        darkColor: "#388E3C",
        items: [
          {
            id: "f1",
            question: "The sun is hot.",
            answer: "This is a Fact.",
            icon: "☀️",
            type: "fact",
          },
          {
            id: "f2",
            question: "Blue is the best color.",
            answer: "This is an Opinion.",
            icon: "🎨",
            type: "fact",
          },
          {
            id: "f3",
            question: "Dogs are animals.",
            answer: "This is a Fact.",
            icon: "🐕",
            type: "fact",
          },
          {
            id: "f4",
            question: "Pizza is yummy.",
            answer: "This is an Opinion.",
            icon: "🍕",
            type: "fact",
          },
          {
            id: "f5",
            question: "Fish live in water.",
            answer: "This is a Fact.",
            icon: "🐟",
            type: "fact",
          },
        ],
      },
    ],
    [],
  );

  const speak = (text: string) => {
    if (!isMountedRef.current) return;
    try {
      if (!text) return;
      Speech.stop();
      TTS.speak(text, { rate: 0.85, pitch: 1.1 });
      Haptics.selectionAsync().catch(() => {});
    } catch (error) {
      console.warn("speak error in ProblemSolving:", error);
    }
  };

  // ✅ STOP BACKGROUND MUSIC ON LESSON SCREENS
  useFocusEffect(
    useCallback(() => {
      try {
        void musicService.stopAsync().catch(() => {});
      } catch (error) {
        console.warn("Error stopping music in ProblemSolving:", error);
      }
      return () => {
        try {
          speechService.stopRecording();
          Speech.stop();
        } catch (error) {
          console.warn("Error stopping speech in ProblemSolving:", error);
        }
      };
    }, []),
  );

  return (
    <LinearGradient colors={["#FFFDE7", "#E0F7FA"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/vocab" color="#2D2D2D" />
        <Text style={styles.title}>Problem Solving</Text>
        <InstructionButton onPress={playInstruction} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Solve language puzzles! Tap a card to hear the question, then the
          answer.
        </Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <View
              style={[
                styles.sectionHeader,
                {
                  backgroundColor: section.color,
                  borderLeftColor: section.darkColor,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: section.darkColor }]}>
                {section.title}
              </Text>
            </View>

            <View
              style={[
                styles.cards,
                { flexDirection: "row", flexWrap: "wrap", gap },
              ]}
            >
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { width: cardWidth }]}
                  onPress={() => speak(`${item.question} ... ${item.answer}`)}
                >
                  <LinearGradient
                    colors={["#FFFFFF", "#FAFAFA"]}
                    style={styles.cardInner}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.cardIcon}>{item.icon}</Text>
                      <Text style={styles.cardQuestion}>{item.question}</Text>
                    </View>
                    <View style={styles.divider} />
                    <Text
                      style={[styles.cardAnswer, { color: section.darkColor }]}
                    >
                      {item.answer}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFFCC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  backText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#2D2D2D",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F57F17",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  description: {
    fontSize: 16,
    color: "#5D4037",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 5,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardInner: {
    padding: 16,
    borderRadius: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  cardQuestion: {
    fontSize: 16,
    fontWeight: "700",
    color: "#37474F",
    flex: 1,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "#ECEFF1",
    marginBottom: 8,
  },
  cardAnswer: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  bottomSpacer: {
    height: 40,
  },
});
