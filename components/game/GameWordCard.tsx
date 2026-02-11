import { Recognition } from "@/services/audio/recognition";
import { TTS } from "@/services/audio/tts";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GameWordCardProps {
  word: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  onSuccess?: () => void;
  onFailure?: () => void;
  disabled?: boolean;
  style?: any;
}

export default function GameWordCard({
  word,
  icon = "text",
  color = "#FFF",
  onSuccess,
  onFailure,
  disabled = false,
  style,
}: GameWordCardProps) {
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "listening" | "correct" | "incorrect">("idle");

  useEffect(() => {
    return () => {
      if (isListening) Recognition.stop();
    };
  }, [isListening]);

  const handleSpeak = () => {
    if (!isListening) {
        TTS.speak(word);
    }
  };

  const toggleListening = async () => {
    if (disabled || feedback === "correct") return;

    if (isListening) {
      await Recognition.stop();
      setIsListening(false);
      setFeedback("idle");
      return;
    }

    const hasPermission = await Recognition.requestPermission();
    if (!hasPermission) return;

    setFeedback("listening");
    setIsListening(true);
    Haptics.selectionAsync();

    try {
        await Recognition.start(
            (text) => {
                console.log(`Recognized: ${text} vs Target: ${word}`);
                // Simple fuzzy match
                if (text.toLowerCase().includes(word.toLowerCase())) {
                    setFeedback("correct");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    TTS.speak("Good job!");
                    if (onSuccess) onSuccess();
                } else {
                    setFeedback("incorrect");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    TTS.speak("Try again");
                    if (onFailure) onFailure();
                    // Reset after a delay
                    setTimeout(() => {
                        setFeedback("idle");
                    }, 1500);
                }
                setIsListening(false);
            },
            (error) => {
                console.log("Recognition error:", error);
                setFeedback("incorrect");
                if (onFailure) onFailure();
                setIsListening(false);
                setTimeout(() => setFeedback("idle"), 1500);
            }
        );
    } catch (e) {
        setIsListening(false);
        setFeedback("idle");
    }
  };

  return (
    <View style={[
        styles.card, 
        { backgroundColor: color },
        style,
        feedback === "correct" && styles.cardCorrect,
        feedback === "incorrect" && styles.cardIncorrect,
        disabled && styles.cardDisabled
    ]}>
      {/* Tap Card to Hear */}
      <TouchableOpacity 
        style={styles.contentContainer} 
        onPress={handleSpeak}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
            <Ionicons name={feedback === "correct" ? "checkmark-circle" : icon} size={48} color={feedback === "correct" ? "#4CAF50" : "#5D4037"} />
        </View>
        <Text style={styles.word}>{word}</Text>
      </TouchableOpacity>

      {/* Mic Button */}
      <TouchableOpacity
        style={[
          styles.micButton,
          isListening && styles.micListening,
          feedback === "correct" && styles.micCorrectButton,
          disabled && styles.micDisabled
        ]}
        onPress={toggleListening}
        disabled={disabled || feedback === "correct"}
      >
        {isListening ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Ionicons
            name={feedback === "correct" ? "star" : "mic"}
            size={24}
            color="#FFF"
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    minHeight: 160,
  },
  cardCorrect: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  cardIncorrect: {
    borderColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  cardDisabled: {
    opacity: 0.6,
  },
  contentContainer: {
    alignItems: "center",
    width: "100%",
    flex: 1,
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 8,
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 32,
  },
  word: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3E2723",
    textAlign: "center",
    marginBottom: 8,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  micListening: {
    backgroundColor: "#F44336",
    transform: [{ scale: 1.1 }],
  },
  micCorrectButton: {
    backgroundColor: "#4CAF50",
  },
  micDisabled: {
    backgroundColor: "#BDBDBD",
  },
  feedbackText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  }
});
