import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY || "";
// NOTE: Ensure EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY is set in your .env file.

export interface SpeechResult {
  transcript: string;
  confidence: number;
}

export const speechService = {
  recording: null as Audio.Recording | null,

  requestPermissions: async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  },

  startRecording: async () => {
    try {
      if (speechService.recording) {
        await speechService.stopRecording();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Google STT prefers LINEAR16 (WAV) or AMR_WB.
      // AAC (m4a) is often problematic with synchronous recognition.
      // We use AMR_WB for Android (widely supported by Google STT) and WAV for iOS.
      const recordingOptions: Audio.RecordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          extension: ".amr",
          outputFormat: Audio.AndroidOutputFormat.AMR_WB,
          audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 23850,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      speechService.recording = recording;
      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      return false;
    }
  },

  stopRecording: async (): Promise<string | null> => {
    try {
      if (!speechService.recording) return null;

      const recording = speechService.recording;
      speechService.recording = null; // Clear reference immediately

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      return uri;
    } catch (error) {
      console.error("Error stopping recording:", error);
      return null;
    }
  },

  recognizeSpeech: async (uri: string): Promise<SpeechResult> => {
    if (!GOOGLE_API_KEY) {
      console.warn("Google Cloud API Key is missing. Returning mock response.");
      return { transcript: "", confidence: 0 };
    }

    try {
      console.log(`[STT] Processing audio file: ${uri}`);
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      // Determine encoding based on file extension
      const isWav = uri.endsWith(".wav");
      const encoding = isWav ? "LINEAR16" : "AMR_WB";
      const sampleRateHertz = 16000;

      console.log(
        `[STT] Sending request to Google Cloud (Encoding: ${encoding})`,
      );
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            config: {
              languageCode: "en-US",
              encoding: encoding,
              sampleRateHertz: sampleRateHertz,
              enableAutomaticPunctuation: true,
              enableWordConfidence: true,
            },
            audio: {
              content: fileBase64,
            },
          }),
        },
      );

      const data = await response.json();
      console.log("[STT] Full API Response:", JSON.stringify(data));

      if (data.error) {
        console.error("Google STT Error:", data.error);
        return { transcript: "", confidence: 0 };
      }

      if (!data.results || data.results.length === 0) {
        console.log("[STT] No results found in response.");
        return { transcript: "", confidence: 0 };
      }

      const bestResult = data.results[0].alternatives[0];
      console.log(
        `[STT] Transcript: "${bestResult.transcript}" | Confidence: ${bestResult.confidence}`,
      );
      return {
        transcript: bestResult.transcript || "",
        confidence: bestResult.confidence || 0,
      };
    } catch (error) {
      console.error("Error recognizing speech:", error);
      return { transcript: "", confidence: 0 };
    }
  },

  // Smart comparison logic for kids (focuses on pronunciation, not accent)
  // Replaced by checkSpeechAccuracy for better consistency and strictness
  checkWord: (result: SpeechResult | string, target: string): boolean => {
    return speechService.checkSpeechAccuracy(result, target);
  },

  /**
   * Validates spoken text against a target sentence.
   * Focuses on word pronunciation and sentence meaning, allowing for accents.
   * Logic:
   * 1. Normalize both strings (lowercase, remove punctuation)
   * 2. Split into words
   * 3. Fuzzy match each target word against spoken words
   * 4. Score = matched_words / total_target_words
   * 5. Threshold = 0.7 (70%)
   */
  checkSpeechAccuracy: (
    result: SpeechResult | string,
    target: string,
    threshold: number = 0.7,
  ): boolean => {
    const transcript = typeof result === "string" ? result : result.transcript;
    if (!transcript || !target) return false;

    // 1. Normalize function
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^\w\s]/g, "") // Remove punctuation
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();

    const cleanTranscript = normalize(transcript);
    const cleanTarget = normalize(target);

    if (!cleanTranscript || !cleanTarget) return false;

    // 2. Split into words
    const transcriptWords = cleanTranscript.split(" ");
    const targetWords = cleanTarget.split(" ");

    // 3. Fuzzy Match Helper (Levenshtein Distance)
    const getSimilarity = (s1: string, s2: string): number => {
      if (s1 === s2) return 1.0;
      const len1 = s1.length;
      const len2 = s2.length;
      if (len1 === 0) return 0;
      if (len2 === 0) return 0;

      const matrix = Array.from({ length: len1 + 1 }, () =>
        new Array(len2 + 1).fill(0),
      );

      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost,
          );
        }
      }
      const distance = matrix[len1][len2];
      return 1 - distance / Math.max(len1, len2);
    };

    // 4. Count matched words
    // We want to see how many of the 'target' words are present in the 'transcript'
    let matchedCount = 0;
    const usedTranscriptIndices = new Set<number>();

    for (const targetWord of targetWords) {
      let bestMatchScore = 0;
      let bestMatchIndex = -1;

      for (let i = 0; i < transcriptWords.length; i++) {
        if (usedTranscriptIndices.has(i)) continue;

        const score = getSimilarity(targetWord, transcriptWords[i]);
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatchIndex = i;
        }
      }

      // Word-level fuzzy threshold: 0.6 (allows for Filipino accent/spelling differences)
      // e.g. "got" vs "gat" -> similarity 0.66
      // e.g. "wet" vs "weyt" -> similarity 0.75
      if (bestMatchScore >= 0.6) {
        matchedCount++;
        if (bestMatchIndex !== -1) usedTranscriptIndices.add(bestMatchIndex);
      }
    }

    // 5. Final Score
    const finalScore = matchedCount / targetWords.length;
    console.log(
      `[Speech Validation] Target: "${target}" | Heard: "${transcript}" | Score: ${finalScore.toFixed(2)}`,
    );

    return finalScore >= threshold;
  },
};
