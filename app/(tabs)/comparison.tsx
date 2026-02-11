import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ComparisonItem = {
  id: string;
  base: string;
  comparative: string;
  superlative: string;
  baseSentence: string;
  compSentence: string;
  supSentence: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type ComparisonSection = {
  title: string;
  color: string;
  darkColor: string;
  description: string;
  items: ComparisonItem[];
};

export default function Comparison() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const sections: ComparisonSection[] = useMemo(
    () => [
      {
        title: "Standard (-er / -est)",
        color: "#E1F5FE", // Light Blue
        darkColor: "#0288D1",
        description: "For most short words, just add -er or -est.",
        items: [
          {
            id: "c1",
            base: "Fast", comparative: "Faster", superlative: "Fastest",
            baseSentence: "The car is fast.",
            compSentence: "The plane is faster than the car.",
            supSentence: "The rocket is the fastest.",
            icon: "speedometer"
          },
          {
            id: "c2",
            base: "Tall", comparative: "Taller", superlative: "Tallest",
            baseSentence: "The tree is tall.",
            compSentence: "The tower is taller than the tree.",
            supSentence: "The mountain is the tallest.",
            icon: "arrow-up"
          },
          {
            id: "c3",
            base: "Cold", comparative: "Colder", superlative: "Coldest",
            baseSentence: "The water is cold.",
            compSentence: "The ice is colder than water.",
            supSentence: "The South Pole is the coldest.",
            icon: "snow"
          },
          {
            id: "c4",
            base: "Old", comparative: "Older", superlative: "Oldest",
            baseSentence: "My bike is old.",
            compSentence: "Grandpa is older than me.",
            supSentence: "The dinosaur bones are the oldest.",
            icon: "time"
          },
           {
            id: "c5",
            base: "Strong", comparative: "Stronger", superlative: "Strongest",
            baseSentence: "The boy is strong.",
            compSentence: "The athlete is stronger.",
            supSentence: "The elephant is the strongest.",
            icon: "barbell"
          }
        ]
      },
      {
        title: "Double the Letter",
        color: "#FFF3E0", // Light Orange
        darkColor: "#F57C00",
        description: "If a short word ends in one vowel + one consonant, double the last letter!",
        items: [
          {
            id: "d1",
            base: "Big", comparative: "Bigger", superlative: "Biggest",
            baseSentence: "The apple is big.",
            compSentence: "The melon is bigger.",
            supSentence: "The pumpkin is the biggest.",
            icon: "expand"
          },
          {
            id: "d2",
            base: "Hot", comparative: "Hotter", superlative: "Hottest",
            baseSentence: "The tea is hot.",
            compSentence: "The fire is hotter.",
            supSentence: "The sun is the hottest.",
            icon: "flame"
          },
          {
            id: "d3",
            base: "Sad", comparative: "Sadder", superlative: "Saddest",
            baseSentence: "The movie was sad.",
            compSentence: "Losing a toy is sadder.",
            supSentence: "Whatever makes you cry is the saddest.",
            icon: "sad"
          },
          {
            id: "d4",
            base: "Thin", comparative: "Thinner", superlative: "Thinnest",
            baseSentence: "The paper is thin.",
            compSentence: "The thread is thinner.",
            supSentence: "The hair is the thinnest.",
            icon: "resize"
          }
        ]
      },
      {
        title: "Change 'y' to 'i'",
        color: "#F3E5F5", // Light Purple
        darkColor: "#8E24AA",
        description: "If a word ends in 'y', change it to 'i' before adding -er or -est.",
        items: [
          {
            id: "y1",
            base: "Happy", comparative: "Happier", superlative: "Happiest",
            baseSentence: "I am happy today.",
            compSentence: "I was happier yesterday.",
            supSentence: "My birthday is the happiest day.",
            icon: "happy"
          },
          {
            id: "y2",
            base: "Heavy", comparative: "Heavier", superlative: "Heaviest",
            baseSentence: "The rock is heavy.",
            compSentence: "The car is heavier.",
            supSentence: "The truck is the heaviest.",
            icon: "fitness"
          },
          {
            id: "y3",
            base: "Easy", comparative: "Easier", superlative: "Easiest",
            baseSentence: "Walking is easy.",
            compSentence: "Sitting is easier.",
            supSentence: "Sleeping is the easiest.",
            icon: "thumbs-up"
          },
           {
            id: "y4",
            base: "Funny", comparative: "Funnier", superlative: "Funniest",
            baseSentence: "The joke was funny.",
            compSentence: "The clown was funnier.",
            supSentence: "The movie was the funniest.",
            icon: "happy-outline"
          }
        ]
      },
      {
        title: "Long Words (More / Most)",
        color: "#E8F5E9", // Light Green
        darkColor: "#43A047",
        description: "For long words, use 'more' and 'most' instead of changing the ending.",
        items: [
          {
            id: "l1",
            base: "Beautiful", comparative: "More Beautiful", superlative: "Most Beautiful",
            baseSentence: "The flower is beautiful.",
            compSentence: "The sunset is more beautiful.",
            supSentence: "The rainbow is the most beautiful.",
            icon: "flower"
          },
          {
            id: "l2",
            base: "Exciting", comparative: "More Exciting", superlative: "Most Exciting",
            baseSentence: "The game is exciting.",
            compSentence: "The ride is more exciting.",
            supSentence: "The trip was the most exciting.",
            icon: "rocket"
          },
          {
            id: "l3",
            base: "Dangerous", comparative: "More Dangerous", superlative: "Most Dangerous",
            baseSentence: "The snake is dangerous.",
            compSentence: "The shark is more dangerous.",
            supSentence: "The volcano is the most dangerous.",
            icon: "warning"
          },
           {
            id: "l4",
            base: "Comfortable", comparative: "More Comfortable", superlative: "Most Comfortable",
            baseSentence: "The chair is comfortable.",
            compSentence: "The sofa is more comfortable.",
            supSentence: "My bed is the most comfortable.",
            icon: "bed"
          }
        ]
      },
      {
        title: "Irregular Words",
        color: "#FFFDE7", // Light Yellow
        darkColor: "#FBC02D",
        description: "These words change completely! You have to remember them.",
        items: [
          {
            id: "i1",
            base: "Good", comparative: "Better", superlative: "Best",
            baseSentence: "The cookie is good.",
            compSentence: "The cake is better.",
            supSentence: "The ice cream is the best.",
            icon: "star"
          },
          {
            id: "i2",
            base: "Bad", comparative: "Worse", superlative: "Worst",
            baseSentence: "The rain is bad for the picnic.",
            compSentence: "The storm is worse.",
            supSentence: "The hurricane is the worst.",
            icon: "thunderstorm"
          },
          {
            id: "i3",
            base: "Little", comparative: "Less", superlative: "Least",
            baseSentence: "I have a little water.",
            compSentence: "You have less water.",
            supSentence: "He has the least water.",
            icon: "water"
          },
           {
            id: "i4",
            base: "Far", comparative: "Farther", superlative: "Farthest",
            baseSentence: "The park is far.",
            compSentence: "The zoo is farther.",
            supSentence: "The moon is the farthest.",
            icon: "planet"
          }
        ]
      },
      {
        title: "Equality (As ... As)",
        color: "#FCE4EC", // Light Pink
        darkColor: "#C2185B",
        description: "When two things are the same.",
        items: [
          {
            id: "eq1",
            base: "Big", comparative: "As Big As", superlative: "Same Size",
            baseSentence: "The red ball is big.",
            compSentence: "The blue ball is as big as the red one.",
            supSentence: "They are the same size.",
            icon: "ellipse"
          },
          {
            id: "eq2",
            base: "Fast", comparative: "As Fast As", superlative: "Same Speed",
            baseSentence: "The horse is fast.",
            compSentence: "The deer is as fast as the horse.",
            supSentence: "They run at the same speed.",
            icon: "speedometer"
          }
        ]
      }
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
    <LinearGradient colors={["#E3F2FD", "#FFFFFF"]} style={styles.container}>
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
        <Text style={styles.headerTitle}>Comparison Words</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          We use comparison words to talk about how things are different. Tap any card to hear examples!
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
                  onPress={() => speak(`${item.base}. ${item.baseSentence} ... ${item.comparative}. ${item.compSentence} ... ${item.superlative}. ${item.supSentence}`, item.id)}
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
                        <View style={styles.row}>
                            <Text style={styles.label}>Base:</Text>
                            <Text style={styles.word}>{item.base}</Text>
                        </View>
                         <View style={styles.row}>
                            <Text style={styles.label}>Compare:</Text>
                            <Text style={[styles.word, { color: section.darkColor }]}>{item.comparative}</Text>
                        </View>
                         <View style={styles.row}>
                            <Text style={styles.label}>Super:</Text>
                            <Text style={[styles.word, { color: section.darkColor, fontWeight: "900" }]}>{item.superlative}</Text>
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
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "#90A4AE",
    width: 60,
    fontWeight: "600",
  },
  word: {
    fontSize: 16,
    color: "#37474F",
    fontWeight: "700",
  },
  playingIndicator: {
    marginLeft: 10,
  },
});
