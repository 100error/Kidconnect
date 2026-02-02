import React, { useRef, useCallback } from "react";
import {View,Text,TouchableOpacity,StyleSheet,FlatList,Dimensions,} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Audio } from "expo-av";
/* ================= TYPES ================= */

type Example = {
  word: string;
  example: string;
};

type VowelSection = {
  title: string;
  description: string;
  examples: Example[];
  color: string;
};

/* ================= DATA ================= */

const vowelSections: VowelSection[] = [
  {
    title: "🟡 ai – Long A Sound (ā)",
    description: 'Words like "rain", "mail", "train"',
    examples: [
      { word: "Rain", example: "It started to rain outside." },
      { word: "Train", example: "We rode the train to the city." },
      { word: "Paint", example: "Let’s paint the wall blue." },
      { word: "Snail", example: "The snail moved slowly." },
    ],
    color: "#FFF9C4",
  },
  {
    title: "🔵 ea – Long E (ē) or Short E (ĕ)",
    description: 'Words like "eat" or "bread"',
    examples: [
      { word: "Eat", example: "We eat lunch at noon." },
      { word: "Seat", example: "Please take a seat." },
      { word: "Bread", example: "I like butter on my bread." },
      { word: "Head", example: "Put a hat on your head." },
    ],
    color: "#BBDEFB",
  },
  {
    title: "🟠 oa – Long O Sound (ō)",
    description: 'Words like "boat", "goat", "road"',
    examples: [
      { word: "Boat", example: "We sailed the boat." },
      { word: "Goat", example: "The goat jumped over the fence." },
      { word: "Road", example: "The road is long." },
    ],
    color: "#FFE0B2",
  },
  {
    title: "🟢 ee – Long E Sound (ē)",
    description: 'Words like "tree", "feet", "sleep"',
    examples: [
      { word: "Tree", example: "The tree is tall." },
      { word: "Feet", example: "My feet are tired." },
      { word: "Sleep", example: "I sleep early." },
    ],
    color: "#C8E6C9",
  },
  {
    title: "🔴 ou – Many Sounds",
    description: 'Words like "house", "cloud", "shout"',
    examples: [
      { word: "House", example: "We live in a big house." },
      { word: "Cloud", example: "The cloud is gray." },
      { word: "Shout", example: "Don’t shout indoors." },
    ],
    color: "#F8BBD0",
  },
];

/* ================= SCREEN ================= */

export default function Common(): JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>BACK</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Vowel Digraphs</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          A vowel digraph is when two vowels come together and make one sound.
        </Text>

        {vowelSections.map((section, index) => (
          <View
            key={index}
            style={[styles.section, { backgroundColor: section.color }]}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDesc}>
              👉 {section.description}
            </Text>

            {section.examples.map((item, idx) => (
              <Text key={idx} style={styles.example}>
                <Text style={styles.word}>{item.word}:</Text>{" "}
                {item.example}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    marginLeft: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  scroll: {
    padding: 16,
    paddingBottom: 30,
  },

  intro: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },

  section: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  sectionDesc: {
    fontSize: 14,
    marginBottom: 8,
  },

  example: {
    fontSize: 14,
    marginBottom: 4,
  },

  word: {
    fontWeight: "bold",
  },
});
