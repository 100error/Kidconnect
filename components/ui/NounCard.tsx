import ExplanationView from "@/components/ui/ExplanationView";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type NounLesson = {
  id: string;
  title: string;
  definition: string;
  what?: string;
  where?: string;
  how?: string;
  when?: string;
  examples: string[];
  color: string;
  borderColor: string;
  image?: any; // For future image support
};

interface NounCardProps {
  lesson: NounLesson;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export default function NounCard({ lesson, isPlaying, onPlay, onStop }: NounCardProps) {
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setHighlightedText(null);
    }
  }, [isPlaying]);

  const handlePress = () => {
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  return (
    <View style={[styles.card, { borderColor: lesson.borderColor, backgroundColor: lesson.color }]}>
      {/* Header */}
      <View style={[styles.cardHeader, { backgroundColor: lesson.borderColor }]}>
        <Text style={styles.cardTitle}>{lesson.title}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Definition */}
        <Text style={[
          styles.definition, 
          isPlaying && styles.highlightText
        ]}>
          {lesson.definition}
        </Text>

        {/* 4 Ws Explanation */}
        {lesson.what && lesson.where && lesson.how && lesson.when && (
          <ExplanationView
            what={lesson.what}
            where={lesson.where}
            how={lesson.how}
            when={lesson.when}
            darkColor={lesson.borderColor}
          />
        )}

        <View style={styles.examplesContainer}>
          <Text style={[styles.examplesLabel, { color: lesson.borderColor }]}>
            Examples:
          </Text>
          <View style={styles.examplesList}>
            {lesson.examples.map((ex, index) => (
              <Text key={index} style={[styles.exampleText, { color: lesson.borderColor }]}>
                {ex}
              </Text>
            ))}
          </View>
        </View>

        {/* TTS Button */}
        <TouchableOpacity 
          style={[styles.speakButton, { backgroundColor: lesson.borderColor }]} 
          onPress={handlePress}
        >
          <Ionicons 
            name={isPlaying ? "stop" : "volume-high"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  content: {
    padding: 16,
    position: "relative",
  },
  definition: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "500",
  },
  highlightText: {
    backgroundColor: "rgba(255, 255, 0, 0.3)",
    borderRadius: 4,
  },
  examplesContainer: {
    alignItems: "center",
    marginBottom: 40, // Space for the button
  },
  examplesLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  examplesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  exampleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  speakButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
});
