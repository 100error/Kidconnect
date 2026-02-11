import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

export function speakNow(text: string) {
  Speech.stop();
  Speech.speak(text, { rate: 0.95, pitch: 1.05 });
  Haptics.selectionAsync();
}

export function speakPraise(text?: string) {
  speakNow(text || "Great job!");
}

export function speakCorrection(text: string) {
  speakNow(text);
}

export function speakGuidance(text: string) {
  speakNow(text);
}
