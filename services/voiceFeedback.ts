import { audioService } from "./audio/audioService";
import * as Haptics from "expo-haptics";

export function speakNow(text: string) {
  audioService.speak(text);
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
