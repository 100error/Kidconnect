import BackButton from "@/components/ui/BackButton";
import ExplanationView from "@/components/ui/ExplanationView";
import SentenceCard from "@/components/ui/SentenceCard";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useState } from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

type TenseItem = {
  id: string;
  sentence: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type TenseGroup = {
  title: string;
  items: TenseItem[];
  color: string;
  darkColor: string;
  what: string;
  where: string;
  how: string;
  when: string;
};

const tenseGroups: TenseGroup[] = [
  {
    title: "Present Tense (Now)",
    color: "#E8F5E9", // Light Green
    darkColor: "#4CAF50",
    what: "Actions happening right now or every day.",
    where: "In sentences about today or habits.",
    how: "Use the base verb (or add -s for he/she/it).",
    when: "For things that are true now.",
    items: [
      { id: "p1", sentence: "I wake up.", icon: "sunny" },
      { id: "p2", sentence: "I eat breakfast.", icon: "restaurant" },
      { id: "p3", sentence: "I walk to school.", icon: "walk" },
      { id: "p4", sentence: "She plays soccer.", icon: "football" },
      { id: "p5", sentence: "They study hard.", icon: "book" },
      { id: "p6", sentence: "The sun shines.", icon: "sunny-outline" },
    ],
  },
  {
    title: "Past Tense (Before)",
    color: "#E3F2FD", // Light Blue
    darkColor: "#2196F3",
    what: "Actions that already finished.",
    where: "In sentences about yesterday or before.",
    how: "Usually add -ed to the verb (or change the word).",
    when: "When telling a story about the past.",
    items: [
      { id: "pa1", sentence: "I woke up.", icon: "bed" },
      { id: "pa2", sentence: "I ate breakfast.", icon: "nutrition" },
      { id: "pa3", sentence: "I walked to school.", icon: "footsteps" },
      { id: "pa4", sentence: "We played a game.", icon: "game-controller" },
      { id: "pa5", sentence: "He finished his work.", icon: "checkmark-circle" },
      { id: "pa6", sentence: "It rained yesterday.", icon: "rainy" },
    ],
  },
  {
    title: "Future Tense (Later)",
    color: "#FFF3E0", // Light Orange
    darkColor: "#FF9800",
    what: "Actions that will happen later.",
    where: "In sentences about tomorrow or later.",
    how: "Use 'will' + the verb.",
    when: "When making plans or predictions.",
    items: [
      { id: "f1", sentence: "I will wake up.", icon: "alarm" },
      { id: "f2", sentence: "I will eat breakfast.", icon: "fast-food" },
      { id: "f3", sentence: "I will walk to school.", icon: "school" },
      { id: "f4", sentence: "She will sing.", icon: "musical-notes" },
      { id: "f5", sentence: "We will go home.", icon: "home" },
      { id: "f6", sentence: "It will be sunny.", icon: "sunny" },
    ],
  },
  // New Categories
  {
    title: "Helping Verbs (Auxiliary)",
    color: "#F3E5F5", // Light Purple
    darkColor: "#9C27B0",
    what: "Words that help the main verb.",
    where: "Before the main action word.",
    how: "Changes based on who and when (is, was, have).",
    when: "Showing state (I am) or complex time (have eaten).",
    items: [
      { id: "h1", sentence: "I am happy.", icon: "happy" },
      { id: "h2", sentence: "She is running.", icon: "walk" },
      { id: "h3", sentence: "They are playing.", icon: "people" },
      { id: "h4", sentence: "He was tired.", icon: "bed" },
      { id: "h5", sentence: "We were late.", icon: "time" },
      { id: "h6", sentence: "I have a dog.", icon: "paw" },
    ],
  },
  {
    title: "Time Words",
    color: "#E0F2F1", // Light Teal
    darkColor: "#009688",
    what: "Words that tell us WHEN something happens.",
    where: "At the start or end of a sentence.",
    how: "Use words like today, yesterday, soon.",
    when: "To be clear about the time.",
    items: [
      { id: "t1", sentence: "I play now.", icon: "play-circle" },
      { id: "t2", sentence: "I played yesterday.", icon: "calendar" },
      { id: "t3", sentence: "I will play tomorrow.", icon: "arrow-forward-circle" },
      { id: "t4", sentence: "See you later.", icon: "hand-left" },
      { id: "t5", sentence: "It is already done.", icon: "checkmark-done" },
      { id: "t6", sentence: "We start soon.", icon: "timer" },
    ],
  },
  {
    title: "Regular Verbs",
    color: "#FFEBEE", // Light Red
    darkColor: "#E53935",
    what: "Verbs that follow a simple rule.",
    where: "In past tense sentences.",
    how: "Just add -ed to the end.",
    when: "Describing most past actions.",
    items: [
      { id: "rv1", sentence: "Walk -> Walked", icon: "walk" },
      { id: "rv2", sentence: "Play -> Played", icon: "game-controller" },
      { id: "rv3", sentence: "Jump -> Jumped", icon: "arrow-up" },
      { id: "rv4", sentence: "Clean -> Cleaned", icon: "sparkles" },
      { id: "rv5", sentence: "Cook -> Cooked", icon: "restaurant" },
      { id: "rv6", sentence: "Look -> Looked", icon: "eye" },
    ],
  },
  {
    title: "Irregular Verbs",
    color: "#FFF8E1", // Light Amber
    darkColor: "#FFB300",
    what: "Verbs that change completely in the past.",
    where: "In past tense sentences.",
    how: "Change the whole word (Go -> Went).",
    when: "Using common verbs like go, eat, see.",
    items: [
      { id: "iv1", sentence: "Go -> Went", icon: "exit" },
      { id: "iv2", sentence: "Eat -> Ate", icon: "pizza" },
      { id: "iv3", sentence: "See -> Saw", icon: "eye" },
      { id: "iv4", sentence: "Run -> Ran", icon: "speedometer" },
      { id: "iv5", sentence: "Have -> Had", icon: "briefcase" },
      { id: "iv6", sentence: "Do -> Did", icon: "checkmark" },
    ],
  },
  {
    title: "Verb Suffixes",
    color: "#ECEFF1", // Light Blue Grey
    darkColor: "#607D8B",
    what: "Endings we add to verbs.",
    where: "At the end of the action word.",
    how: "Add -s, -ing, or -ed.",
    when: "Changing who (he runs) or when (running).",
    items: [
      { id: "s1", sentence: "Run -> Runs (He/She)", icon: "person" },
      { id: "s2", sentence: "Run -> Running (Now)", icon: "pulse" },
      { id: "s3", sentence: "Walk -> Walked (Past)", icon: "time" },
      { id: "s4", sentence: "Play -> Plays", icon: "game-controller" },
      { id: "s5", sentence: "Go -> Going", icon: "arrow-forward" },
    ],
  },
];

export default function Tenses() {
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

  const handlePlay = (id: string, text: string) => {
    Speech.stop();
    setPlayingId(id);

    Speech.speak(text, {
      rate: 0.75, // Slow rate for kids
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

  const handleGroupPlay = (group: TenseGroup) => {
    Speech.stop();
    setPlayingId(group.title); // Use title as ID for group speech

    const textToSpeak = `${group.title}. What: ${group.what}. Where: ${group.where}. How: ${group.how}. When: ${group.when}.`;
    Speech.speak(textToSpeak, {
        rate: 0.75,
        pitch: 1.1,
        onDone: () => setPlayingId(null),
        onStopped: () => setPlayingId(null),
        onError: () => setPlayingId(null),
    });
  };

  return (
    <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/vocab" color="#333" />
        <Text style={styles.headerTitle}>Learning Tenses</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Tap a section to learn, then tap cards to hear sentences!
        </Text>

        {tenseGroups.map((group) => (
          <View key={group.title} style={styles.groupContainer}>
            <View style={[styles.groupHeader, { backgroundColor: group.darkColor }]}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <Ionicons 
                name={playingId === group.title ? "stop-circle" : "volume-medium"} 
                size={24} 
                color="white" 
                style={{ marginLeft: 10 }}
                onPress={() => playingId === group.title ? handleStop() : handleGroupPlay(group)}
              />
            </View>

            <View style={styles.explanationContainer}>
                <ExplanationView 
                    what={group.what}
                    where={group.where}
                    how={group.how}
                    when={group.when}
                    darkColor={group.darkColor}
                />
            </View>
            
            <View style={styles.grid}>
              {group.items.map((item) => (
                <SentenceCard
                  key={item.id}
                  sentence={item.sentence}
                  iconName={item.icon}
                  color={group.color}
                  darkColor={group.darkColor}
                  isPlaying={playingId === item.id}
                  onPlay={() => handlePlay(item.id, item.sentence)}
                  onStop={handleStop}
                />
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
  introText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  groupContainer: {
    marginBottom: 32,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  explanationContainer: {
    marginBottom: 16,
  },
  grid: {
    width: "100%",
  },
});
