import InstructionButton from "@/components/InstructionButton";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from "@/hooks/useInstruction";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { musicService } from "@/services/audio/music";
import { TTS } from "@/services/audio/tts";
import { speechService } from "@/services/speechService";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
    BackHandler,
    StyleSheet as RNStyleSheet,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

type DialogueSection = {
  title: string;
  color: string;
  darkColor: string;
  items: DialogueItem[];
};

type DialogueItem = {
  id: string;
  text: string;
  icon: string;
  description: string;
  example: string;
};

export default function Dialogue() {
  const router = useRouter();
  const { isMountedRef, safeRun } = useSafeAsync();
  const isRunningRef = useRef(false); // ✅ MULTIPLE EXECUTION GUARD
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const numColumns = isTablet ? 2 : 1;
  const gap = 12;
  const padding = 16;
  const cardWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  // Instructions
  const { play: playInstruction } = useInstruction(
    "dialogue",
    "Learn how to speak in sentences! Tap any card to hear the phrase and an example.",
  );

  const sections: DialogueSection[] = useMemo(
    () => [
      {
        title: "Dialogue Tags",
        color: "#FFF9C4", // Light Yellow
        darkColor: "#FBC02D",
        items: [
          {
            id: "dt_1",
            text: "Said",
            icon: "🗣️",
            description: "To speak words.",
            example: '"I am hungry," she said.',
          },
          {
            id: "dt_2",
            text: "Asked",
            icon: "❓",
            description: "To make a question.",
            example: '"Are you okay?" he asked.',
          },
          {
            id: "dt_3",
            text: "Shouted",
            icon: "🔊",
            description: "To speak very loudly.",
            example: '"Watch out!" she shouted.',
          },
          {
            id: "dt_4",
            text: "Whispered",
            icon: "🤫",
            description: "To speak very softly.",
            example: '"It is a secret," he whispered.',
          },
          {
            id: "dt_5",
            text: "Replied",
            icon: "↩️",
            description: "To answer back.",
            example: '"Yes, I will," she replied.',
          },
          {
            id: "dt_6",
            text: "Exclaimed",
            icon: "❗",
            description: "To say with excitement.",
            example: '"Wow!" he exclaimed.',
          },
          {
            id: "dt_7",
            text: "Muttered",
            icon: "😶",
            description: "To speak low and unclear.",
            example: '"I do not know," she muttered.',
          },
          {
            id: "dt_8",
            text: "Called",
            icon: "📣",
            description: "To speak loud to someone far.",
            example: '"Come here!" he called.',
          },
        ],
      },
      {
        title: "Greetings & Farewells",
        color: "#C8E6C9", // Light Green
        darkColor: "#388E3C",
        items: [
          {
            id: "gf_1",
            text: "Hello",
            icon: "👋",
            description: "A friendly greeting.",
            example: '"Hello! How are you?"',
          },
          {
            id: "gf_2",
            text: "Good Morning",
            icon: "☀️",
            description: "Greeting in the morning.",
            example: '"Good morning, teacher!"',
          },
          {
            id: "gf_3",
            text: "Good Night",
            icon: "🌙",
            description: "Saying bye at night.",
            example: '"Good night, sleep well."',
          },
          {
            id: "gf_4",
            text: "Goodbye",
            icon: "🚪",
            description: "Saying bye when leaving.",
            example: '"Goodbye! See you tomorrow."',
          },
          {
            id: "gf_5",
            text: "See you later",
            icon: "🕒",
            description: "Bye for a short time.",
            example: '"I have to go. See you later!"',
          },
        ],
      },
      {
        title: "Polite Expressions",
        color: "#B3E5FC", // Light Blue
        darkColor: "#0288D1",
        items: [
          {
            id: "pe_1",
            text: "Please",
            icon: "🙏",
            description: "Asking nicely.",
            example: '"Can I have water, please?"',
          },
          {
            id: "pe_2",
            text: "Thank You",
            icon: "🎁",
            description: "When getting something.",
            example: '"Thank you for the gift!"',
          },
          {
            id: "pe_3",
            text: "You're Welcome",
            icon: "🤝",
            description: "After someone says thanks.",
            example: '"You are welcome."',
          },
          {
            id: "pe_4",
            text: "Excuse Me",
            icon: "🚶",
            description: "Asking to pass or speak.",
            example: '"Excuse me, may I pass?"',
          },
          {
            id: "pe_5",
            text: "I'm Sorry",
            icon: "😔",
            description: "Apologizing for a mistake.",
            example: '"I am sorry I broke it."',
          },
        ],
      },
      {
        title: "Conversation Starters",
        color: "#FFCCBC", // Light Orange
        darkColor: "#D84315",
        items: [
          {
            id: "cs_1",
            text: "How are you?",
            icon: "😊",
            description: "Asking about feelings.",
            example: '"How are you today?"',
          },
          {
            id: "cs_2",
            text: "What is your name?",
            icon: "📛",
            description: "Asking for a name.",
            example: '"Hi! What is your name?"',
          },
          {
            id: "cs_3",
            text: "Nice to meet you",
            icon: "🤝",
            description: "Meeting someone new.",
            example: '"It is nice to meet you."',
          },
          {
            id: "cs_4",
            text: "Where are you from?",
            icon: "🌍",
            description: "Asking about home.",
            example: '"Where are you from?"',
          },
          {
            id: "cs_5",
            text: "How old are you?",
            icon: "🎂",
            description: "Asking about age.",
            example: '"How old are you?"',
          },
        ],
      },
    ],
    [],
  );

  const speak = (text: string) => {
    if (!isMountedRef.current) return;
    Speech.stop();
    TTS.speak(text, { rate: 0.85, pitch: 1.1 });
    Haptics.selectionAsync();
  };

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

  // ✅ STOP BACKGROUND MUSIC ON LESSON SCREENS
  useFocusEffect(
    useCallback(() => {
      void musicService.stopAsync();
      return () => {
        Speech.stop();
      };
    }, []),
  );

  return (
    <LinearGradient colors={["#E0F7FA", "#E1F5FE"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/vocab" color="#2D2D2D" />
        <Text style={styles.title}>Dialogue Words</Text>
        <InstructionButton onPress={playInstruction} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Learn how to speak in sentences! Tap any card to hear the phrase and
          an example.
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
                  onPress={() =>
                    speak(
                      `${item.text}. ${item.description}. Example: ${item.example}`,
                    )
                  }
                >
                  <LinearGradient
                    colors={["#FFFFFF", "#F9F9F9"]}
                    style={styles.cardInner}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.cardIcon}>{item.icon}</Text>
                      <Text style={styles.cardWord}>{item.text}</Text>
                    </View>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                    <View style={styles.divider} />
                    <Text
                      style={[styles.cardExample, { color: section.darkColor }]}
                    >
                      {item.example}
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

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2D2D2D",
    flex: 1,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: "700",
    color: "#546E7A",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    padding: 12,
    borderRadius: 16,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderLeftWidth: 6,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cards: {
    paddingHorizontal: 4,
  },
  card: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardInner: {
    padding: 16,
    minHeight: 140,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardWord: {
    fontSize: 20,
    fontWeight: "900",
    color: "#263238",
  },
  cardDesc: {
    fontSize: 15,
    fontWeight: "700",
    color: "#546E7A",
    marginBottom: 12,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 10,
  },
  cardExample: {
    fontSize: 15,
    fontWeight: "800",
    fontStyle: "italic",
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
