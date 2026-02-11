import BackButton from "@/components/ui/BackButton";
import NounCard, { NounLesson } from "@/components/ui/NounCard";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useState } from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

const nounLessons: NounLesson[] = [
  // Existing Categories
  {
    id: "common",
    title: "Common Nouns",
    definition: "Words for general people, places, or things.",
    what: "General names for everyday items.",
    where: "Anywhere in a sentence.",
    how: "Lowercase unless starting a sentence.",
    when: "Talking about general things like 'a dog' or 'the park'.",
    examples: ["boy", "lady", "park", "town", "ice cream"],
    color: "#F3E5F5", 
    borderColor: "#9C27B0", 
  },
  {
    id: "proper",
    title: "Proper Nouns",
    definition: "Special names for specific people, places, or things.",
    what: "Specific names for unique entities.",
    where: "Anywhere in a sentence.",
    how: "Always capitalized.",
    when: "Naming a specific person (Jason) or place (London).",
    examples: ["Jason", "Maria", "January", "London", "Hawaii"],
    color: "#E3F2FD", 
    borderColor: "#2196F3", 
  },
  {
    id: "concrete",
    title: "Concrete Nouns",
    definition: "Things you can experience with your five senses.",
    what: "Physical things you can see, touch, hear, smell, or taste.",
    where: "Describing the physical world.",
    how: "Used like any other noun.",
    when: "Referring to real, physical objects.",
    examples: ["table", "phone", "apple", "rain", "music"],
    color: "#EFEBE9", // Light Brown
    borderColor: "#795548",
  },
  {
    id: "abstract",
    title: "Abstract Nouns",
    definition: "Ideas, feelings, or qualities you cannot touch.",
    what: "Names for feelings, ideas, or concepts.",
    where: "Describing emotions or thoughts.",
    how: "Used as a subject or object.",
    when: "Talking about intangible things like love or time.",
    examples: ["love", "bravery", "happiness", "freedom", "knowledge"],
    color: "#FCE4EC", 
    borderColor: "#E91E63", 
  },
  {
    id: "collective",
    title: "Collective Nouns",
    definition: "Words for a group of people, animals, or things.",
    what: "A single name for a collection.",
    where: "Often the subject of a sentence.",
    how: "Can be singular or plural depending on context.",
    when: "Referring to a group as one unit.",
    examples: ["team", "family", "flock", "herd", "bunch"],
    color: "#E8F5E9", 
    borderColor: "#4CAF50", 
  },
  {
    id: "countable",
    title: "Countable Nouns",
    definition: "Things you can count using numbers.",
    what: "Items that can be singular or plural.",
    where: "With numbers or articles (a, an).",
    how: "Can take 'a' or 'an' and have a plural form.",
    when: "Talking about distinct items.",
    examples: ["one apple", "two dogs", "three chairs", "a bottle"],
    color: "#FFF3E0", // Light Orange
    borderColor: "#FF9800",
  },
  {
    id: "uncountable",
    title: "Uncountable Nouns",
    definition: "Things you cannot count individually.",
    what: "Substances, concepts, or masses.",
    where: "Used with singular verbs.",
    how: "Do not use 'a' or 'an'; no plural form.",
    when: "Talking about liquids, powders, or abstract ideas.",
    examples: ["water", "rice", "music", "furniture", "information"],
    color: "#E0F7FA", // Light Cyan
    borderColor: "#00BCD4",
  },
  {
    id: "singular",
    title: "Singular Nouns",
    definition: "Refers to just one person, place, or thing.",
    what: "One single item.",
    where: "With singular verbs (is, was, has).",
    how: "The base form of the word.",
    when: "There is only one of something.",
    examples: ["cat", "house", "friend", "box", "city"],
    color: "#FFFDE7", // Light Yellow
    borderColor: "#FBC02D",
  },
  {
    id: "plural",
    title: "Plural Nouns",
    definition: "Refers to more than one person, place, or thing.",
    what: "Two or more items.",
    where: "With plural verbs (are, were, have).",
    how: "Usually add -s or -es to the end.",
    when: "There are many of something.",
    examples: ["cats", "houses", "friends", "boxes", "cities"],
    color: "#FFF9C4", // Darker Yellow
    borderColor: "#F57F17",
  },
  {
    id: "compound",
    title: "Compound Nouns",
    definition: "Two or more words joined to make a new noun.",
    what: "A new word made from two others.",
    where: "Anywhere in a sentence.",
    how: "Written as one word, two words, or with a hyphen.",
    when: "Naming specific things like 'toothpaste'.",
    examples: ["toothpaste", "bedroom", "swimming pool", "son-in-law", "ice cream"],
    color: "#E0F2F1", // Light Teal
    borderColor: "#009688",
  },
  {
    id: "possessive",
    title: "Possessive Nouns",
    definition: "Shows ownership or relationship.",
    what: "Nouns that show something belongs to them.",
    where: "Before the thing being owned.",
    how: "Add an apostrophe and s ('s).",
    when: "Saying 'Sarah's book' or 'the dog's bone'.",
    examples: ["mom's car", "John's toy", "cat's tail", "school's door"],
    color: "#FFEBEE", // Light Red
    borderColor: "#F44336",
  },
  {
    id: "gerund",
    title: "Gerund Nouns",
    definition: "Verbs ending in -ing that act as nouns.",
    what: "An action used as a thing.",
    where: "Subject or object of a sentence.",
    how: "Add -ing to a verb.",
    when: "Talking about an activity, like 'Swimming is fun'.",
    examples: ["swimming", "reading", "cooking", "running", "dancing"],
    color: "#F3E5F5", // Light Purple (reused but distinct context)
    borderColor: "#8E24AA",
  },
  {
    id: "material",
    title: "Material Nouns",
    definition: "Names of materials or substances.",
    what: "Substances used to make things.",
    where: "Often used as uncountable nouns.",
    how: "Used to describe what something is made of.",
    when: "Talking about wood, gold, plastic, etc.",
    examples: ["wood", "gold", "plastic", "cotton", "silver"],
    color: "#ECEFF1", // Light Blue Grey
    borderColor: "#607D8B",
  },
];

export default function Nouns() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Stop speech when leaving the screen
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        Speech.stop();
        setPlayingId(null);
      };
    }, [])
  );

  const handlePlay = (lesson: NounLesson) => {
    // Stop any currently playing speech
    Speech.stop();
    setPlayingId(lesson.id);

    const textToSpeak = `${lesson.title}. ${lesson.definition}. What: ${lesson.what}. Where: ${lesson.where}. How: ${lesson.how}. When: ${lesson.when}. Examples include: ${lesson.examples.join(", ")}.`;
    
    Speech.speak(textToSpeak, { 
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

  return (
    <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/vocab" color="#333" />
        <Text style={styles.headerTitle}>Types of Nouns</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Explore the different types of nouns below!
        </Text>

        <View style={styles.grid}>
          {nounLessons.map((lesson) => (
            <View key={lesson.id} style={styles.gridItem}>
              <NounCard 
                lesson={lesson}
                isPlaying={playingId === lesson.id}
                onPlay={() => handlePlay(lesson)}
                onStop={handleStop}
              />
            </View>
          ))}
        </View>
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
  introText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  grid: {
    width: "100%",
  },
  gridItem: {
    marginBottom: 16,
  },
});
