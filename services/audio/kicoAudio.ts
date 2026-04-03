import { speechService } from "../speechService";
import { audioService } from "./audioService";

export interface KicoAudioState {
  isListening: boolean;
  isProcessing: boolean;
  message: string | null;
}

type StateListener = (state: KicoAudioState) => void;

class KicoAudio {
  private state: KicoAudioState = {
    isListening: false,
    isProcessing: false,
    message: null,
  };

  private listeners: StateListener[] = [];
  private getName: (() => string | undefined) | null = null;
  private recordingTimeout: ReturnType<typeof setTimeout> | null = null;
  private clearMessageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {}

  addListener(listener: StateListener) {
    this.listeners.push(listener);
    listener(this.state);
  }

  removeListener(listener: StateListener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private updateState(updates: Partial<KicoAudioState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((l) => l(this.state));
  }

  /**
   * Start listening for user voice input.
   * Triggered by Mic button.
   */
  async startListening(getName: () => string | undefined) {
    if (this.state.isListening || this.state.isProcessing) return;

    // Stop any active speech before starting to listen
    await audioService.stop();

    this.getName = getName;
    this.updateState({ isListening: true, message: null });

    if (this.clearMessageTimeout) {
      clearTimeout(this.clearMessageTimeout);
    }

    const hasPermission = await speechService.requestPermissions();
    if (!hasPermission) {
      this.updateState({ isListening: false });
      return;
    }

    const success = await speechService.startRecording();
    if (success) {
      // Auto-stop after 4 seconds if user doesn't stop manually
      this.recordingTimeout = setTimeout(() => {
        this.stopListening();
      }, 4000);
    } else {
      this.updateState({ isListening: false });
    }
  }

  /**
   * Stop recording and start processing.
   */
  async stopListening() {
    if (!this.state.isListening) return;

    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    this.updateState({ isListening: false, isProcessing: true });
    await this.processSpeech();
  }

  private async processSpeech() {
    try {
      const uri = await speechService.stopRecording();
      if (!uri) {
        await this.handleError("Try again!... I didn't hear you.");
        return;
      }

      const result = await speechService.recognizeSpeech(uri);
      const transcript = result.transcript?.trim();

      if (!transcript) {
        await this.handleError("Try again!... I didn't hear you.");
        return;
      }

      const response = this.generateResponse(transcript);
      await this.speakResponse(response);
    } catch (error) {
      console.error("[KicoAudio] Error processing speech:", error);
      await this.handleError("Something went wrong!... Can we try again?");
    } finally {
      this.updateState({ isProcessing: false });
    }
  }

  private generateResponse(text: string): string {
    const t = text.toLowerCase();

    // Hi / Hello
    if (t.includes("hi") || t.includes("hello")) {
      return "Hi there!... I'm Kico!";
    }

    // Name / Identity
    if (t.includes("your name") || t.includes("who are you")) {
      return "I'm Kico!... your learning buddy!";
    }

    // Age
    if (t.includes("how old are you")) {
      return "I'm 8 years old!";
    }

    // Height
    if (t.includes("how tall are you")) {
      return "I'm just the right size for learning!";
    }

    // Birthday (Kico's)
    if (t.includes("your birthday")) {
      return "My birthday is on a fun learning day!";
    }

    // User's name
    if (t.includes("my name")) {
      const name = this.getName ? this.getName() : null;
      return name
        ? `Your name is ${name}!`
        : "I don't know your name yet!... but you're my friend!";
    }

    // Personal Life Questions (Safe fallback)
    if (
      t.includes("how old am i") ||
      t.includes("where do i live") ||
      t.includes("my birthday") ||
      t.includes("my address") ||
      t.includes("my parents") ||
      t.includes("who are my parents")
    ) {
      return "I don't know... ask your mom!";
    }

    // Today's Date
    if (t.includes("what day is today") || t.includes("today is what day")) {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const today = days[new Date().getDay()];
      return `Today is ${today}!`;
    }

    // Progress
    if (
      t.includes("progress") ||
      t.includes("yesterday") ||
      t.includes("today") ||
      t.includes("the other day")
    ) {
      // In a real app, we'd fetch actual progress here.
      return "You're doing great!... Keep going!";
    }

    // Default fallback
    return "Sorry!... I can't answer that yet. You can try asking Google!... or another AI.";
  }

  private async speakResponse(text: string) {
    this.updateState({ isProcessing: false, message: text });

    await audioService.speak(text, {
      pitch: 1.3,
      rate: 0.9,
    });

    // Clear message bubble after 4 seconds
    this.clearMessageTimeout = setTimeout(() => {
      this.updateState({ message: null });
    }, 4000);
  }

  private async handleError(errorText: string) {
    await this.speakResponse(errorText);
  }

  /**
   * Force stop everything (e.g. on unmount)
   */
  async stopAll() {
    if (this.recordingTimeout) clearTimeout(this.recordingTimeout);
    if (this.clearMessageTimeout) clearTimeout(this.clearMessageTimeout);

    this.updateState({
      isListening: false,
      isProcessing: false,
      message: null,
    });

    await speechService.stopRecording();
    await audioService.stop();
  }
}

export const kicoAudio = new KicoAudio();
