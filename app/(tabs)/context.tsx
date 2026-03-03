import InstructionButton from "@/components/InstructionButton";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from '@/hooks/useInstruction';
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from "expo-speech";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

  type ContextSection = {
    title: string;
    color: string;
    darkColor: string;
    items: ContextItem[];
  };

  type ContextItem = {
    id: string;
    word: string; // The focus word or title
    icon: string;
    description: string; // Meaning 1 or Strategy desc
    description2?: string; // Meaning 2 (optional)
    example: string; // Example 1
    example2?: string; // Example 2 (optional)
  };

export default function Context() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const numColumns = isTablet ? 2 : 1;
  const gap = 12;
  const padding = 16;
  const cardWidth = (width - (padding * 2) - (gap * (numColumns - 1))) / numColumns;

  // Instructions
  const { play: playInstruction } = useInstruction(
    'context',
    "Learn how to find meaning! Tap the cards to hear clues and examples."
  );

  const sections: ContextSection[] = useMemo(
    () => [
      {
        title: "How to Find Meaning",
        color: "#E1BEE7", // Light Purple
        darkColor: "#8E24AA",
        items: [
          {
            id: "s1",
            word: "Definition Clues",
            icon: "📘",
            description: "The sentence tells you the meaning directly.",
            example: '"A mammal is an animal that has fur and gives milk."'
          },
          {
            id: "s2",
            word: "Synonym Clues",
            icon: "🟰",
            description: "A word nearby has the same meaning.",
            example: '"She was joyful, or very happy, to see her puppy."'
          },
          {
            id: "s3",
            word: "Antonym Clues",
            icon: "↔️",
            description: "A word nearby has the opposite meaning.",
            example: '"Unlike his rude brother, Sam is always polite."'
          },
          {
            id: "s4",
            word: "Example Clues",
            icon: "📋",
            description: "Examples help explain the difficult word.",
            example: '"Citrus fruits, such as lemons and oranges, are sour."'
          },
          {
            id: "s5",
            word: "Inference Clues",
            icon: "🕵️",
            description: "Use the whole sentence to guess.",
            example: '"She shivered and put on a coat because it was frigid."'
          }
        ]
      },
      {
        title: "Words with Two Meanings",
        color: "#C5CAE9", // Light Indigo
        darkColor: "#3949AB",
        items: [
          {
            id: "mm1",
            word: "Bark",
            icon: "🐕/🌳",
            description: "1. The sound a dog makes.",
            example: '"The dog gave a loud bark."',
            description2: "2. The skin of a tree.",
            example2: '"The tree has rough brown bark."'
          },
          {
            id: "mm2",
            word: "Bat",
            icon: "🦇/⚾",
            description: "1. A flying animal.",
            example: '"The bat flew out of the cave."',
            description2: "2. A stick to hit a ball.",
            example2: '"He hit the baseball with a wooden bat."'
          },
          {
            id: "mm3",
            word: "Bank",
            icon: "🏦/🌊",
            description: "1. A place for money.",
            example: '"I save my coins in the bank."',
            description2: "2. The land beside a river.",
            example2: '"We fished from the river bank."'
          },
          {
            id: "mm4",
            word: "Ring",
            icon: "💍/🔔",
            description: "1. Jewelry for a finger.",
            example: '"She wore a shiny gold ring."',
            description2: "2. The sound of a bell.",
            example2: '"Did you hear the school bell ring?"'
          },
          {
            id: "mm5",
            word: "Wave",
            icon: "👋/🌊",
            description: "1. Moving your hand hello.",
            example: '"Please wave to your friends."',
            description2: "2. Moving water in the sea.",
            example2: '"A big wave splashed the boat."'
          },
          {
            id: "mm6",
            word: "Park",
            icon: "🛝/🚗",
            description: "1. A place to play.",
            example: '"We played on the swings at the park."',
            description2: "2. Stopping a car.",
            example2: '"Dad will park the car in the garage."'
          },
          {
            id: "mm7",
            word: "Fly",
            icon: "🪰/✈️",
            description: "1. A small insect.",
            example: '"A fly buzzed around my food."',
            description2: "2. To move through the air.",
            example2: '"Birds fly high in the sky."'
          },
          {
            id: "mm8",
            word: "Watch",
            icon: "⌚/👀",
            description: "1. A clock on your wrist.",
            example: '"I looked at my watch for the time."',
            description2: "2. To look at something.",
            example2: '"We will watch a movie tonight."'
          }
        ]
      }
    ],
    []
  );

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.75, pitch: 1.1 });
    Haptics.selectionAsync();
  };

  return (
    <LinearGradient colors={["#E8EAF6", "#E3F2FD"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/vocab" color="#1A237E" />
        <Text style={styles.title}>Context Clues</Text>
        <InstructionButton onPress={playInstruction} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Context clues help you understand words! Learn strategies and words with multiple meanings.
        </Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <View style={[styles.sectionHeader, { backgroundColor: section.color, borderLeftColor: section.darkColor }]}>
              <Text style={[styles.sectionTitle, { color: section.darkColor }]}>{section.title}</Text>
            </View>

            <View style={[styles.cards, { flexDirection: "row", flexWrap: "wrap", gap }]}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { width: cardWidth }]}
                  onPress={() => {
                    let textToSpeak = `${item.word}. ${item.description} Example: ${item.example}`;
                    if (item.description2 && item.example2) {
                      textToSpeak += ` Also means: ${item.description2} Example: ${item.example2}`;
                    }
                    speak(textToSpeak);
                  }}
                >
                  <LinearGradient colors={["#FFFFFF", "#FAFAFA"]} style={styles.cardInner}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardIcon}>{item.icon}</Text>
                      <Text style={styles.cardTitle}>{item.word}</Text>
                    </View>
                    
                    <View style={styles.meaningBlock}>
                      <Text style={styles.cardDesc}>{item.description}</Text>
                      <Text style={[styles.cardExample, { color: section.darkColor }]}>{item.example}</Text>
                    </View>

                    {item.description2 && item.example2 && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.meaningBlock}>
                          <Text style={styles.cardDesc}>{item.description2}</Text>
                          <Text style={[styles.cardExample, { color: section.darkColor }]}>{item.example2}</Text>
                        </View>
                      </>
                    )}
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
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
    color: "#1A237E",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 16,
    marginBottom: 20,
    color: "#37474F",
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
    width: "100%", // Full width for context cards to show more text
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#263238",
  },
  meaningBlock: {
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 15,
    color: "#455A64",
    marginBottom: 4,
    fontWeight: "500",
  },
  cardExample: {
    fontSize: 15,
    fontStyle: "italic",
    fontWeight: "600",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#ECEFF1",
    marginVertical: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});


