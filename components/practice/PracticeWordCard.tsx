import { TTS } from "@/services/audio/tts";
import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

interface PracticeWordCardProps {
  word: string;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  type?: 'full' | 'image' | 'word';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export default function PracticeWordCard({
  word,
  color = "#E1F5FE",
  icon = "volume-high",
  type = 'full',
  style,
  onPress,
}: PracticeWordCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      TTS.speak(word);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }, style]}
      onPress={handlePress}
    >
      {/* Image/Icon Section */}
      {(type === 'full' || type === 'image') && (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={40} color="#0288D1" />
        </View>
      )}

      {/* Word Section */}
      {(type === 'full' || type === 'word') && (
        <Text style={styles.word}>{word}</Text>
      )}

      {/* Instruction Section (Only for full or word?) 
          Let's keep it for 'full' and maybe 'word' if space permits, 
          but usually 'image' only cards don't have text.
          User said "Layout matches reference". Reference has plain cards.
          I will hide instruction for split cards to keep it clean like the image.
      */}
      {type === 'full' && (
        <View style={styles.instruction}>
          <Ionicons name="volume-medium" size={20} color="#555" />
          <Text style={styles.instructionText}>Tap to hear</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 150,
  },
  iconContainer: {
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
    padding: 10,
    borderRadius: 50,
  },
  word: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textTransform: "capitalize",
  },
  instruction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    opacity: 0.7,
  },
  instructionText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 5,
  },
});
