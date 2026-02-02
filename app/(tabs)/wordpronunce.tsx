import React, { useEffect, useState } from "react";
import {View,Text,TouchableOpacity,StyleSheet,PermissionsAndroid,Platform,Alert,} from "react-native";
import Voice, {SpeechResultsEvent,SpeechErrorEvent,} from "@react-native-voice/voice";

const words = ["apple", "banana"];

export default function WordPronounce() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const currentWord = words[currentIndex];

  useEffect(() => {
    requestMicPermission();

    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechEnd = () => setIsListening(false);

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [currentWord]);

  const requestMicPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Microphone permission is needed."
        );
      }
    }
  };

  const onSpeechResults = (event: SpeechResultsEvent) => {
    const spoken = event.value?.[0]?.toLowerCase() || "";
    console.log("Heard:", spoken);

    if (spoken.includes(currentWord.toLowerCase())) {
      setFeedback("✅ Correct! Great job!");
      setScore((s) => s + 1);
      nextWord();
    } else {
      setFeedback(`❌ Try again. Say "${currentWord}"`);
    }

    setIsListening(false);
  };

  const onSpeechError = (event: SpeechErrorEvent) => {
    console.log("Speech error:", event);
    setFeedback("❌ Couldn't understand. Try again.");
    setIsListening(false);
  };

  const startListening = async () => {
    if (isListening) return;

    try {
      setFeedback("🎤 Listening...");
      setIsListening(true);
      await Voice.start("en-US");
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const nextWord = () => {
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.word}>Say the word:</Text>
      <Text style={styles.highlight}>{currentWord}</Text>

      <TouchableOpacity
        style={styles.button}
        onPressIn={startListening}
        onPressOut={stopListening}
      >
        <Text style={styles.buttonText}>
          {isListening ? "🎤 Listening..." : "🎙 Hold to Speak"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.feedback}>{feedback}</Text>
      <Text style={styles.score}>⭐ Score: {score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E6",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  word: {
    fontSize: 22,
    color: "#333",
  },
  highlight: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FF6F00",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF6F00",
    padding: 16,
    borderRadius: 50,
    width: 220,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  feedback: {
    marginTop: 20,
    fontSize: 18,
    textAlign: "center",
  },
  score: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "bold",
  },
});
