import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SpellingSection = {
  title: string;
  color: string;
  darkColor: string;
  items: SpellingRule[];
};

type SpellingRule = {
  id: string;
  ruleName: string;
  description: string;
  exampleWords: string[];
  exampleSentence: string;
  icon: string;
};

export default function Spelled() {
  const sections: SpellingSection[] = useMemo(
    () => [
      {
        title: "Vowel Power",
        color: "#FFF9C4", // Light Yellow
        darkColor: "#FBC02D",
        items: [
          {
            id: "v1",
            ruleName: "Silent E",
            description: "The silent E at the end makes the vowel say its name.",
            exampleWords: ["hop → hope", "cap → cape"],
            exampleSentence: "I hope you wear your cape!",
            icon: "🤫"
          },
          {
            id: "v2",
            ruleName: "Vowel Teams",
            description: "When two vowels go walking, the first one does the talking.",
            exampleWords: ["rain", "boat", "eat"],
            exampleSentence: "The boat sails in the rain.",
            icon: "🛶"
          }
        ]
      },
      {
        title: "Consonant Tricks",
        color: "#E1F5FE", // Light Blue
        darkColor: "#0288D1",
        items: [
          {
            id: "c1",
            ruleName: "Soft C",
            description: "The letter C sounds like 'S' when it comes before e, i, or y.",
            exampleWords: ["city", "ice", "cycle"],
            exampleSentence: "We cycle in the city.",
            icon: "🏙️"
          },
          {
            id: "c2",
            ruleName: "Soft G",
            description: "The letter G sounds like 'J' when it comes before e, i, or y.",
            exampleWords: ["giraffe", "gym", "cage"],
            exampleSentence: "The giraffe is in a cage.",
            icon: "🦒"
          },
          {
            id: "c3",
            ruleName: "Q and U",
            description: "Q and U stick like glue. They are always together.",
            exampleWords: ["queen", "quick", "quiet"],
            exampleSentence: "The queen is very quick.",
            icon: "👑"
          }
        ]
      },
      {
        title: "Adding Endings",
        color: "#F8BBD0", // Light Pink
        darkColor: "#C2185B",
        items: [
          {
            id: "e1",
            ruleName: "Doubling Rule",
            description: "For 1-syllable words with 1 short vowel and 1 consonant: Double the last letter before adding -ing or -ed.",
            exampleWords: ["run → running", "stop → stopped"],
            exampleSentence: "He stopped running.",
            icon: "🏃"
          },
          {
            id: "e2",
            ruleName: "Drop the E",
            description: "Drop the silent E before adding an ending that starts with a vowel.",
            exampleWords: ["make → making", "like → liked"],
            exampleSentence: "I liked making a cake.",
            icon: "🍰"
          },
          {
            id: "e3",
            ruleName: "Change Y to I",
            description: "If a word ends in a consonant + y, change y to i before adding -es or -ed.",
            exampleWords: ["baby → babies", "cry → cried"],
            exampleSentence: "The babies cried loudly.",
            icon: "👶"
          }
        ]
      },
      {
        title: "Tricky Pairs",
        color: "#DCEDC8", // Light Green
        darkColor: "#689F38",
        items: [
          {
            id: "t1",
            ruleName: "I Before E",
            description: "I before E, except after C, or when sounding like 'A'.",
            exampleWords: ["piece", "receive", "neighbor"],
            exampleSentence: "My neighbor received a piece of pie.",
            icon: "🥧"
          },
          {
            id: "t2",
            ruleName: "Plurals with -es",
            description: "Add -es to words ending in s, x, z, ch, or sh.",
            exampleWords: ["bus → buses", "box → boxes", "wish → wishes"],
            exampleSentence: "He wishes for two boxes.",
            icon: "🎁"
          }
        ]
      }
    ],
    []
  );

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.9, pitch: 1.1 });
    Haptics.selectionAsync();
  };

  return (
    <LinearGradient colors={["#FFF3E0", "#E1F5FE"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Speech.stop();
            router.push("/vocab");
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#2D2D2D" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Spelling Rules</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Learn the secrets of spelling! Tap any card to hear the rule and examples.
        </Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <View style={[styles.sectionHeader, { borderLeftColor: section.darkColor }]}>
              <Text style={[styles.sectionTitle, { color: section.darkColor }]}>{section.title}</Text>
            </View>

            <View style={styles.cards}>
              {section.items.map((item) => (
                <View key={item.id} style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.9}
                    onPress={() => speak(`${item.ruleName}. ${item.description}. Example: ${item.exampleSentence}`)}
                  >
                    <LinearGradient
                      colors={["#FFFFFF", section.color]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.icon}>{item.icon}</Text>
                        <Text style={[styles.ruleName, { color: section.darkColor }]}>{item.ruleName}</Text>
                      </View>
                      
                      <Text style={styles.ruleDesc}>{item.description}</Text>
                      
                      <View style={styles.exampleBox}>
                        <Text style={styles.exampleLabel}>Words:</Text>
                        <Text style={styles.exampleText}>{item.exampleWords.join(", ")}</Text>
                      </View>

                      <View style={[styles.exampleBox, { marginTop: 8 }]}>
                        <Text style={styles.exampleLabel}>Sentence:</Text>
                        <Text style={[styles.exampleText, { fontStyle: 'italic' }]}>"{item.exampleSentence}"</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
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
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 16
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFFCC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14
  },
  backText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#2D2D2D"
  },
  title: {
    flex: 1,
    textAlign: "right",
    fontSize: 24,
    fontWeight: "800",
    color: "#3E2723",
    paddingLeft: 12
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  description: {
    fontSize: 16,
    color: "#5D4037",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
    backgroundColor: "#FFFFFF80",
    padding: 12,
    borderRadius: 12
  },
  sectionContainer: {
    marginBottom: 24
  },
  sectionHeader: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 4,
    justifyContent: "center"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  cards: {
    gap: 16
  },
  cardWrapper: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: "#fff" // fallback
  },
  card: {
    borderRadius: 16,
    overflow: "hidden"
  },
  cardGradient: {
    padding: 16
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#00000010",
    paddingBottom: 8
  },
  icon: {
    fontSize: 28
  },
  ruleName: {
    fontSize: 19,
    fontWeight: "800",
    flex: 1
  },
  ruleDesc: {
    fontSize: 16,
    color: "#37474F",
    lineHeight: 22,
    marginBottom: 16
  },
  exampleBox: {
    backgroundColor: "#FFFFFF80",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8
  },
  exampleLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#455A64"
  },
  exampleText: {
    fontSize: 15,
    color: "#263238",
    flex: 1,
    lineHeight: 20
  },
  bottomSpacer: {
    height: 40
  }
});
