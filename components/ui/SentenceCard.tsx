import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type SentenceCardProps = {
  sentence: string;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  darkColor: string;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
};

export default function SentenceCard({
  sentence,
  iconName,
  color,
  darkColor,
  isPlaying,
  onPlay,
  onStop,
}: SentenceCardProps) {
  const handlePress = () => {
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: darkColor, backgroundColor: color }]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <Text style={[styles.sentence, { color: "#333" }, isPlaying && styles.highlight]}>
          {sentence}
        </Text>
        <Ionicons name={iconName} size={48} color={darkColor} style={styles.icon} />
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.speakButton, { backgroundColor: darkColor }]} onPress={handlePress}>
          <Ionicons name={isPlaying ? "stop" : "volume-high"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 3,
    marginBottom: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sentence: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  highlight: {
    backgroundColor: "rgba(255, 255, 0, 0.4)",
    borderRadius: 4,
  },
  icon: {
    opacity: 0.9,
  },
  footer: {
    alignItems: "flex-end",
  },
  speakButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
