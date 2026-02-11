import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type QuestionItem = {
  id: string;
  word: string;
  usage: string;
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type QuestionSection = {
  title: string;
  color: string;
  darkColor: string;
  description: string;
  items: QuestionItem[];
};

type PracticeItem = {
  text: string;
  kind: "question" | "statement";
};

export default function Questions() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const sections: QuestionSection[] = useMemo(
    () => [
      {
        title: "The Big 5 (W-Words)",
        color: "#E1F5FE", // Light Blue
        darkColor: "#0288D1",
        description: "These are the most common question words.",
        items: [
          {
            id: "q1",
            word: "Who",
            usage: "Ask about a person.",
            question: "Who is your teacher?",
            answer: "My teacher is Ms. Smith.",
            icon: "person"
          },
          {
            id: "q2",
            word: "What",
            usage: "Ask about a thing or action.",
            question: "What are you eating?",
            answer: "I am eating an apple.",
            icon: "help"
          },
          {
            id: "q3",
            word: "Where",
            usage: "Ask about a place.",
            question: "Where is the cat?",
            answer: "The cat is under the bed.",
            icon: "map"
          },
          {
            id: "q4",
            word: "When",
            usage: "Ask about time.",
            question: "When is lunch?",
            answer: "Lunch is at 12 o'clock.",
            icon: "time"
          },
          {
            id: "q5",
            word: "Why",
            usage: "Ask for a reason.",
            question: "Why are you running?",
            answer: "Because I am late!",
            icon: "help-circle"
          }
        ]
      },
      {
        title: "How & Which",
        color: "#FFF3E0", // Light Orange
        darkColor: "#F57C00",
        description: "Asking about methods and choices.",
        items: [
          {
            id: "q6",
            word: "How",
            usage: "Ask about the way something happens.",
            question: "How do you go to school?",
            answer: "I go by bus.",
            icon: "bus"
          },
          {
            id: "q7",
            word: "Which",
            usage: "Ask to choose between things.",
            question: "Which color do you like?",
            answer: "I like the blue one.",
            icon: "color-palette"
          }
        ]
      },
      {
        title: "Asking About Amounts",
        color: "#F3E5F5", // Light Purple
        darkColor: "#8E24AA",
        description: "How many or how much?",
        items: [
          {
            id: "q8",
            word: "How Many",
            usage: "For things you can count.",
            question: "How many cookies are left?",
            answer: "There are three cookies.",
            icon: "grid"
          },
          {
            id: "q9",
            word: "How Much",
            usage: "For things you cannot count.",
            question: "How much water do you want?",
            answer: "Just a little, please.",
            icon: "water"
          }
        ]
      },
      {
        title: "Asking Details",
        color: "#E8F5E9", // Light Green
        darkColor: "#43A047",
        description: "Asking about age, distance, and ownership.",
        items: [
          {
            id: "q10",
            word: "How Old",
            usage: "Ask about age.",
            question: "How old are you?",
            answer: "I am seven years old.",
            icon: "calendar"
          },
          {
            id: "q11",
            word: "How Far",
            usage: "Ask about distance.",
            question: "How far is the park?",
            answer: "It is two miles away.",
            icon: "navigate"
          },
          {
            id: "q12",
            word: "Whose",
            usage: "Ask about who owns something.",
            question: "Whose toy is this?",
            answer: "It is my brother's toy.",
            icon: "gift"
          }
        ]
      },
      {
        title: "Yes / No Questions",
        color: "#E0F7FA", // Light Cyan
        darkColor: "#0097A7",
        description: "These questions can be answered with Yes or No.",
        items: [
          {
            id: "yn1",
            word: "Do / Does",
            usage: "Ask about facts or habits.",
            question: "Do you like ice cream?",
            answer: "Yes, I do!",
            icon: "help"
          },
          {
            id: "yn2",
            word: "Is / Are",
            usage: "Ask about descriptions.",
            question: "Is the sky blue?",
            answer: "Yes, it is.",
            icon: "cloud"
          },
          {
            id: "yn3",
            word: "Did",
            usage: "Ask about the past.",
            question: "Did you finish your homework?",
            answer: "No, not yet.",
            icon: "book"
          },
          {
            id: "yn4",
            word: "Can",
            usage: "Ask about ability.",
            question: "Can you swim?",
            answer: "Yes, I can swim fast.",
            icon: "water"
          }
        ]
      },
      {
        title: "Polite Questions",
        color: "#F1F8E9", // Light Green
        darkColor: "#558B2F",
        description: "Use these words to be polite.",
        items: [
          {
            id: "p1",
            word: "May",
            usage: "Ask for permission politely.",
            question: "May I have a cookie?",
            answer: "Yes, you may.",
            icon: "restaurant"
          },
          {
            id: "p2",
            word: "Could",
            usage: "Polite request.",
            question: "Could you help me please?",
            answer: "Sure, I can help.",
            icon: "hand-left"
          },
          {
            id: "p3",
            word: "Would",
            usage: "Polite offer or invitation.",
            question: "Would you like to play?",
            answer: "Yes, I would love to!",
            icon: "happy"
          }
        ]
      }
    ],
    []
  );

  const practiceItems: PracticeItem[] = useMemo(
    () => [
      { text: "Where are you going?", kind: "question" },
      { text: "I am going home.", kind: "statement" },
      { text: "Do you like pizza?", kind: "question" },
      { text: "I like pizza.", kind: "statement" },
      { text: "Who is that?", kind: "question" },
      { text: "That is my friend.", kind: "statement" }
    ],
    []
  );

  const speak = (text: string, id: string) => {
    Speech.stop();
    setPlayingId(id);
    Speech.speak(text, {
      rate: 0.9,
      pitch: 1.1,
      onDone: () => setPlayingId(null),
      onStopped: () => setPlayingId(null),
      onError: () => setPlayingId(null)
    });
    Haptics.selectionAsync();
  };

  return (
    <LinearGradient colors={["#E1F5FE", "#FFFFFF"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Speech.stop();
            router.push("/vocab");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#37474F" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question Words</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Question words help us learn new things! Tap a card to hear the question and answer.
        </Text>

        {sections.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
             <View style={[styles.sectionHeader, { borderLeftColor: section.darkColor }]}>
              <Text style={[styles.sectionTitle, { color: section.darkColor }]}>{section.title}</Text>
            </View>
            <Text style={styles.sectionDescription}>{section.description}</Text>

            <View style={styles.cardsContainer}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => speak(`${item.word}. ${item.usage} ... Question: ${item.question} ... Answer: ${item.answer}`, item.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={playingId === item.id ? [section.color, "#FFFFFF"] : ["#FFFFFF", "#FAFAFA"]}
                    style={styles.cardGradient}
                  >
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={28} color={section.darkColor} />
                    </View>
                    
                    <View style={styles.cardContent}>
                        <View style={styles.headerRow}>
                            <Text style={styles.word}>{item.word}</Text>
                            <Text style={styles.usage}>{item.usage}</Text>
                        </View>
                        
                        <View style={styles.qaContainer}>
                            <View style={styles.qaRow}>
                                <Text style={[styles.qaLabel, { color: section.darkColor }]}>Q:</Text>
                                <Text style={styles.qaText}>{item.question}</Text>
                            </View>
                            <View style={styles.qaRow}>
                                <Text style={[styles.qaLabel, { color: "#4CAF50" }]}>A:</Text>
                                <Text style={styles.qaText}>{item.answer}</Text>
                            </View>
                        </View>
                    </View>

                    {playingId === item.id && (
                        <View style={styles.playingIndicator}>
                             <Ionicons name="volume-high" size={20} color={section.darkColor} />
                        </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Practice Section */}
        <View style={styles.practiceSection}>
             <View style={[styles.sectionHeader, { borderLeftColor: "#607D8B" }]}>
              <Text style={[styles.sectionTitle, { color: "#455A64" }]}>Question vs Statement</Text>
            </View>
            <Text style={styles.sectionDescription}>Can you tell the difference? Tap to listen!</Text>
            
            <View style={styles.practiceChips}>
                {practiceItems.map((item, idx) => (
                    <TouchableOpacity 
                        key={idx} 
                        style={styles.practiceChip}
                        onPress={() => speak(`${item.text} ... This is a ${item.kind}.`, `p-${idx}`)}
                    >
                         <Text style={styles.practiceText}>{item.text}</Text>
                         <View style={[
                             styles.kindTag, 
                             item.kind === "question" ? { backgroundColor: "#E1F5FE" } : { backgroundColor: "#FFF3E0" }
                         ]}>
                             <Text style={[
                                 styles.kindText,
                                 item.kind === "question" ? { color: "#0288D1" } : { color: "#F57C00" }
                             ]}>
                                 {item.kind === "question" ? "?" : "."}
                             </Text>
                         </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View style={{ height: 40 }} />
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 15,
  },
  backText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: "600",
    color: "#37474F",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#263238",
  },
  scrollContent: {
    padding: 20,
  },
  introText: {
    fontSize: 16,
    color: "#546E7A",
    marginBottom: 20,
    lineHeight: 24,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1F5FE",
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    paddingLeft: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  sectionDescription: {
    fontSize: 15,
    color: "#607D8B",
    marginBottom: 15,
    fontStyle: "italic",
    paddingLeft: 5,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    marginBottom: 4,
  },
  word: {
    fontSize: 18,
    fontWeight: "800",
    color: "#37474F",
  },
  usage: {
    fontSize: 13,
    color: "#78909C",
    fontStyle: "italic",
  },
  qaContainer: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  qaRow: {
    flexDirection: "row",
    gap: 8,
  },
  qaLabel: {
    fontSize: 14,
    fontWeight: "900",
    width: 15,
  },
  qaText: {
    fontSize: 14,
    color: "#455A64",
    flex: 1,
  },
  playingIndicator: {
    marginLeft: 10,
  },
  practiceSection: {
      marginTop: 10,
      marginBottom: 30,
  },
  practiceChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
  },
  practiceChip: {
      backgroundColor: "#FFFFFF",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#ECEFF1",
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
  },
  practiceText: {
      fontSize: 15,
      color: "#37474F",
      marginRight: 10,
  },
  kindTag: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
  },
  kindText: {
      fontSize: 14,
      fontWeight: "900",
  }
});
