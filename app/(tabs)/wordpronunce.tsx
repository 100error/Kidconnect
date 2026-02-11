import { ensureMicPermission } from "@/services/mic";
import { addResult } from "@/services/progress";
import { addAttempt } from "@/services/speechlog";
import { speakCorrection, speakPraise } from "@/services/voiceFeedback";
import { Ionicons } from "@expo/vector-icons";
import Voice, { SpeechErrorEvent, SpeechResultsEvent } from "@react-native-voice/voice";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const words: string[] = ["apple", "banana", "grape", "orange", "peach"];

export default function WordPronounce() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);

  const currentWord = words[currentIndex];

  const speak = useCallback((text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.95, pitch: 1.05 });
    Haptics.selectionAsync();
  }, []);

  const requestMicPermission = useCallback(async () => {
    await ensureMicPermission();
  }, []);

  const onSpeechResults = useCallback(
    async (event: SpeechResultsEvent) => {
      const spoken = event.value?.[0]?.toLowerCase() || "";
      if (spoken.includes(currentWord.toLowerCase())) {
        setFeedback("✅ Correct! Great job!");
        setScore((s) => s + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        speakPraise(`Great job! You said ${currentWord}.`);
        await addAttempt({ activityId: "wordpronounce", text: spoken, success: true });
        await addResult({
          activityId: "wordpronounce",
          category: "practice",
          score: 100,
          maxScore: 100,
          completed: true,
        });
        nextWord();
      } else {
        setFeedback(`❌ Try again. Say: ${currentWord}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        speakCorrection(`Try again. Say ${currentWord}.`);
        await addAttempt({ activityId: "wordpronounce", text: spoken, success: false });
      }
      setIsListening(false);
    },
    [currentWord]
  );

  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    setFeedback("❌ Couldn't understand. Try again.");
    setIsListening(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const startListening = async () => {
    if (isListening) return;

    try {
      const allowed = await ensureMicPermission();
      if (!allowed) return;
      setFeedback("🎤 Listening...");
      setIsListening(true);
      await Voice.start("en-US");
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch {
    }
  };

  const nextWord = () => {
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  useEffect(() => {
    requestMicPermission();
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechEnd = () => setIsListening(false);
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [requestMicPermission, onSpeechResults, onSpeechError]);

  return (
    <LinearGradient colors={["#E1F5FE", "#FFF3E0"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Speech.stop();
            router.push("/pract");
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#2D2D2D" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Word Pronounce</Text>
      </View>

      <Text style={styles.instructions}>Tap to hear the word, then hold the button and say it.</Text>

      <TouchableOpacity style={styles.listenButton} onPress={() => speak(currentWord)}>
        <Text style={styles.listenText}>Hear “{currentWord}” 🔊</Text>
      </TouchableOpacity>

      <Text style={styles.highlight}>{currentWord.toUpperCase()}</Text>

      <TouchableOpacity style={[styles.button, isListening && styles.buttonActive]} onPressIn={startListening} onPressOut={stopListening}>
        <Text style={styles.buttonText}>{isListening ? "🎤 Listening..." : "🎙 Hold to Speak"}</Text>
      </TouchableOpacity>

      <View style={styles.chips}>
        {words.map((w) => (
          <TouchableOpacity key={w} style={styles.chip} onPress={() => speak(w)}>
            <Text style={styles.chipText}>{w}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.feedbackBox}>
        <Text style={styles.feedback}>{feedback}</Text>
        <Text style={styles.score}>⭐ Score: {score}</Text>
      </View>
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
    paddingBottom: 8
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
    fontSize: 22,
    fontWeight: "800",
    color: "#3E2723",
    paddingLeft: 12
  },
  instructions: {
    fontSize: 16,
    color: "#4E342E",
    marginBottom: 14,
    paddingHorizontal: 16,
    textAlign: "center"
  },
  listenButton: {
    backgroundColor: "#90CAF9",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12
  },
  listenText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F1F1F"
  },
  word: {
    fontSize: 22,
    color: "#333",
  },
  highlight: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FF6F00",
    marginBottom: 12,
    textAlign: "center"
  },
  button: {
    backgroundColor: "#FF6F00",
    padding: 16,
    borderRadius: 50,
    width: 220,
    alignItems: "center",
    alignSelf: "center"
  },
  buttonActive: {
    backgroundColor: "#FB8C00"
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginTop: 12
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 6,
    borderRadius: 16
  },
  chipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#37474F"
  },
  feedbackBox: {
    marginTop: 12,
    alignItems: "center",
    paddingHorizontal: 16
  },
  feedback: {
    fontSize: 18,
    textAlign: "center",
    color: "#6D4C41"
  },
  score: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "bold",
    color: "#3E2723"
  },
});
