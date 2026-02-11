import BackButton from "@/components/ui/BackButton";
import ExplanationView from "@/components/ui/ExplanationView";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useState } from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/* ================= TYPES ================= */

export type Example = {
  word: string;
  example: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export type VowelSection = {
  title: string;
  description: string;
  examples: Example[];
  color: string;
  darkColor: string;
};

/* ================= DATA ================= */

export const vowelSections: VowelSection[] = [
  // New Categories (Articles, Pronouns, Prepositions, Conjunctions, Question Words, Verbs, Adjectives, Social)
  {
    title: "📝 Articles",
    description: "Small words that introduce a noun.",
    examples: [
      { word: "The", example: "The dog is barking.", icon: "text" },
      { word: "A", example: "I saw a cat.", icon: "text" },
      { word: "An", example: "She ate an apple.", icon: "text" },
    ],
    color: "#E1F5FE", // Light Blue
    darkColor: "#0288D1",
  },
  {
    title: "👤 Pronouns",
    description: "Words that replace names.",
    examples: [
      { word: "I", example: "I am happy.", icon: "person" },
      { word: "You", example: "You are my friend.", icon: "people" },
      { word: "He", example: "He runs fast.", icon: "man" },
      { word: "She", example: "She sings well.", icon: "woman" },
      { word: "It", example: "It is a ball.", icon: "cube" },
      { word: "We", example: "We are playing.", icon: "people-circle" },
      { word: "They", example: "They are dancing.", icon: "people-outline" },
    ],
    color: "#F3E5F5", // Light Purple
    darkColor: "#8E24AA",
  },
  {
    title: "📍 Prepositions",
    description: "Words that show where or when.",
    examples: [
      { word: "In", example: "The cat is in the box.", icon: "cube-outline" },
      { word: "On", example: "The book is on the table.", icon: "book" },
      { word: "At", example: "We are at school.", icon: "school" },
      { word: "To", example: "I walk to the park.", icon: "walk" },
      { word: "From", example: "This gift is from mom.", icon: "gift" },
      { word: "With", example: "I play with my toys.", icon: "game-controller" },
    ],
    color: "#E0F2F1", // Light Teal
    darkColor: "#00897B",
  },
  {
    title: "🔗 Conjunctions",
    description: "Words that connect ideas.",
    examples: [
      { word: "And", example: "I like apples and bananas.", icon: "add-circle" },
      { word: "But", example: "I am tired but happy.", icon: "swap-horizontal" },
      { word: "Or", example: "Do you want tea or milk?", icon: "help-circle" },
      { word: "So", example: "It was raining so I stayed inside.", icon: "umbrella" },
      { word: "Because", example: "I smile because I am happy.", icon: "happy" },
    ],
    color: "#FFF3E0", // Light Orange
    darkColor: "#FB8C00",
  },
  {
    title: "❓ Question Words",
    description: "Words used to ask questions.",
    examples: [
      { word: "Who", example: "Who is that?", icon: "person-add" },
      { word: "What", example: "What is your name?", icon: "help" },
      { word: "Where", example: "Where is my shoe?", icon: "map" },
      { word: "When", example: "When is lunch?", icon: "time" },
      { word: "Why", example: "Why is the sky blue?", icon: "cloud" },
      { word: "How", example: "How are you?", icon: "hand-left" },
    ],
    color: "#FFEBEE", // Light Red
    darkColor: "#E53935",
  },
  {
    title: "🏃 Basic Verbs",
    description: "Action words we use every day.",
    examples: [
      { word: "Be", example: "Be nice to others.", icon: "heart" },
      { word: "Have", example: "I have a toy.", icon: "briefcase" },
      { word: "Do", example: "Do your homework.", icon: "create" },
      { word: "Go", example: "Let's go outside.", icon: "exit" },
      { word: "Get", example: "Can I get a cookie?", icon: "hand-right" },
      { word: "Make", example: "I make a drawing.", icon: "color-palette" },
      { word: "Know", example: "I know the answer.", icon: "bulb" },
      { word: "Think", example: "I think it is good.", icon: "chatbubble" },
      { word: "Take", example: "Please take one.", icon: "download" },
      { word: "See", example: "I see a bird.", icon: "eye" },
    ],
    color: "#F1F8E9", // Light Lime
    darkColor: "#7CB342",
  },
  {
    title: "🌈 Descriptive Words",
    description: "Words that describe things (Adjectives).",
    examples: [
      { word: "Big", example: "The elephant is big.", icon: "expand" },
      { word: "Small", example: "The ant is small.", icon: "contract" },
      { word: "Good", example: "You did a good job.", icon: "thumbs-up" },
      { word: "Bad", example: "That was a bad dream.", icon: "thumbs-down" },
      { word: "Happy", example: "I feel happy.", icon: "happy" },
      { word: "Sad", example: "Don't be sad.", icon: "sad" },
      { word: "Hot", example: "The sun is hot.", icon: "sunny" },
      { word: "Cold", example: "Ice is cold.", icon: "snow" },
    ],
    color: "#FFF8E1", // Light Amber
    darkColor: "#FFB300",
  },
  {
    title: "� Social Words",
    description: "Polite words we say to others.",
    examples: [
      { word: "Hello", example: "Hello! Nice to meet you.", icon: "hand-right" },
      { word: "Goodbye", example: "Goodbye! See you later.", icon: "exit" },
      { word: "Please", example: "Please help me.", icon: "heart-circle" },
      { word: "Thank You", example: "Thank you for the gift.", icon: "gift" },
      { word: "Yes", example: "Yes, I want some.", icon: "checkmark-circle" },
      { word: "No", example: "No, thank you.", icon: "close-circle" },
      { word: "Sorry", example: "I am sorry.", icon: "alert-circle" },
    ],
    color: "#ECEFF1", // Light Blue Grey
    darkColor: "#546E7A",
  },
  // Existing Phonics Categories
  {
    title: "�🟡 ai (Phonics)",
    description: "Long A (ā) like in Rain",
    examples: [
      { word: "Rain", example: "It started to rain outside.", icon: "rainy" },
      { word: "Train", example: "We rode the train to the city.", icon: "train" },
      { word: "Paint", example: "Let’s paint the wall blue.", icon: "color-palette" },
      { word: "Snail", example: "The snail moved slowly.", icon: "bug" },
    ],
    color: "#FFF9C4",
    darkColor: "#FBC02D",
  },
  {
    title: "🔵 ea (Phonics)",
    description: "Long E (ē) like in Eat",
    examples: [
      { word: "Eat", example: "We eat lunch at noon.", icon: "restaurant" },
      { word: "Seat", example: "Please take a seat.", icon: "caret-down-circle" },
      { word: "Bread", example: "I like butter on my bread.", icon: "nutrition" },
      { word: "Head", example: "Put a hat on your head.", icon: "happy" },
    ],
    color: "#BBDEFB",
    darkColor: "#1976D2",
  },
  {
    title: "🟠 oa (Phonics)",
    description: "Long O (ō) like in Boat",
    examples: [
      { word: "Boat", example: "We sailed the boat.", icon: "boat" },
      { word: "Goat", example: "The goat jumped over the fence.", icon: "paw" },
      { word: "Road", example: "The road is long.", icon: "car" },
    ],
    color: "#FFE0B2",
    darkColor: "#F57C00",
  },
  {
    title: "🟢 ee (Phonics)",
    description: "Long E (ē) like in Tree",
    examples: [
      { word: "Tree", example: "The tree is tall.", icon: "leaf" },
      { word: "Feet", example: "My feet are tired.", icon: "walk" },
      { word: "Sleep", example: "I sleep early.", icon: "bed" },
    ],
    color: "#C8E6C9",
    darkColor: "#388E3C",
  },
  {
    title: "🔴 ou (Phonics)",
    description: "Like in House",
    examples: [
      { word: "House", example: "We live in a big house.", icon: "home" },
      { word: "Cloud", example: "The cloud is gray.", icon: "cloud" },
      { word: "Shout", example: "Don’t shout indoors.", icon: "megaphone" },
    ],
    color: "#F8BBD0",
    darkColor: "#C2185B",
  },
];

/* ================= SCREEN ================= */

export default function Common() {
  const router = useRouter();
  const [playingId, setPlayingId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        Speech.stop();
        setPlayingId(null);
      };
    }, [])
  );

  const handlePlay = (id: string, text: string) => {
    Speech.stop();
    setPlayingId(id);
    Speech.speak(text, {
      rate: 0.75,
      pitch: 1.1,
      onDone: () => setPlayingId(null),
      onStopped: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  };

  const handleStop = () => {
    Speech.stop();
    setPlayingId(null);
  };

  const commonWordsExplanation = {
    what: "Words we see, hear, and say every day.",
    where: "In books, signs, movies, and conversations.",
    how: "We put them together to build sentences.",
    when: "All the time! They are the most important words.",
  };

  const handleMainExplanationPlay = () => {
      if (playingId === "main_explanation") {
          handleStop();
          return;
      }
      handlePlay("main_explanation", 
        `Common Words. What: ${commonWordsExplanation.what}. Where: ${commonWordsExplanation.where}. How: ${commonWordsExplanation.how}. When: ${commonWordsExplanation.when}.`
      );
  };

  return (
    <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/vocab" color="#333" />
        <Text style={styles.headerTitle}>Common Words</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Explanation Section */}
        <View style={styles.mainExplanationCard}>
             <View style={styles.mainHeader}>
                <Text style={styles.mainTitle}>About Common Words</Text>
                <TouchableOpacity onPress={handleMainExplanationPlay}>
                    <Ionicons name={playingId === "main_explanation" ? "stop-circle" : "volume-high"} size={32} color="#E91E63" />
                </TouchableOpacity>
             </View>
             <ExplanationView 
                what={commonWordsExplanation.what}
                where={commonWordsExplanation.where}
                how={commonWordsExplanation.how}
                when={commonWordsExplanation.when}
                darkColor="#E91E63"
             />
        </View>

        <Text style={styles.sectionHeader}>Common Word Patterns</Text>

        {vowelSections.map((section, index) => (
          <View key={index} style={[styles.card, { backgroundColor: section.color, borderColor: section.darkColor }]}>
            <View style={[styles.cardHeader, { backgroundColor: section.darkColor }]}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardDescription}>{section.description}</Text>
              <TouchableOpacity
                 onPress={() => {
                    if (playingId === section.title) {
                        handleStop();
                    } else {
                        const words = section.examples.map(e => e.word).join(", ");
                        handlePlay(section.title, `${section.title}. ${section.description}. Words like: ${words}.`);
                    }
                 }}
              >
                  <Ionicons name={playingId === section.title ? "stop-circle" : "volume-medium"} size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.examplesGrid}>
              {section.examples.map((item, idx) => (
                <TouchableOpacity 
                    key={idx} 
                    style={styles.exampleItem}
                    onPress={() => {
                        if (playingId === item.word) {
                            handleStop();
                        } else {
                            handlePlay(item.word, `${item.word}. ${item.example}`);
                        }
                    }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: section.darkColor }]}>
                     <Ionicons name={item.icon || "star"} size={20} color="white" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.wordText, playingId === item.word && styles.highlight]}>{item.word}</Text>
                    <Text style={styles.exampleText}>{item.example}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainExplanationCard: {
      backgroundColor: "white",
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
  },
  mainHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
  },
  mainTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#E91E63",
  },
  sectionHeader: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#555",
      marginBottom: 12,
      marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginRight: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    flex: 1,
  },
  examplesGrid: {
    padding: 12,
    gap: 12,
  },
  exampleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 8,
    borderRadius: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  wordText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  exampleText: {
    fontSize: 12,
    color: "#555",
    fontStyle: "italic",
  },
  highlight: {
    color: "#E91E63", // Highlight color
    textDecorationLine: "underline",
  },
});
