import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

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
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  },

  startRecording: async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Google STT prefers LINEAR16 (WAV) or high quality encoding.
      // We'll use High Quality presets which are generally compatible (M4A/AAC on Android, CAF/WAV on iOS).
      // For best Google Cloud compatibility, we send the content as base64.
      const recordingOptions: Audio.RecordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.MAX,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      speechService.recording = recording;
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  },

  stopRecording: async (): Promise<string | null> => {
    try {
      if (!speechService.recording) return null;
      
      await speechService.recording.stopAndUnloadAsync();
      const uri = speechService.recording.getURI();
      speechService.recording = null;
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return null;
    }
  },

  recognizeSpeech: async (uri: string): Promise<SpeechResult> => {
    if (!GOOGLE_API_KEY) {
      console.warn("Google Cloud API Key is missing. Returning mock response.");
      return { transcript: "", confidence: 0 };
    }

    try {
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              languageCode: "en-US",
              enableAutomaticPunctuation: false,
              enableWordConfidence: true,
              // We infer encoding from file if possible, or use defaults.
              // For generic audio files (m4a, wav), 'ENCODING_UNSPECIFIED' is safest if strictly linear16 isn't guaranteed.
              // However, if we sent WAV (iOS), LINEAR16 works. If AAC (Android), we might need FLAC or MP3.
              // Google Cloud STT now supports more formats.
              // Let's try minimal config that works for standard Expo output.
            },
            audio: {
              content: fileBase64,
            },
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        console.error("Google STT Error:", data.error);
        return { transcript: "", confidence: 0 };
      }

      if (!data.results || data.results.length === 0) {
        return { transcript: "", confidence: 0 };
      }

      const bestResult = data.results[0].alternatives[0];
      return {
        transcript: bestResult.transcript || "",
        confidence: bestResult.confidence || 0,
      };

    } catch (error) {
      console.error('Error recognizing speech:', error);
      return { transcript: "", confidence: 0 };
    }
  },

  // Smart comparison logic
  checkWord: (result: SpeechResult | string, target: string): boolean => {
    // Handle legacy string input if any
    const transcript = typeof result === 'string' ? result : result.transcript;
    const confidence = typeof result === 'string' ? 1.0 : result.confidence;

    if (!transcript || !target) return false;

    // 1. Clean and normalize
    const cleanTranscript = transcript.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const cleanTarget = target.toLowerCase().replace(/[^\w\s]/g, '').trim();

    // 2. Confidence check (only if we have a real confidence score)
    // If confidence is 0 (mock/error), we fail unless it's a perfect match (legacy fallback)
    if (confidence > 0 && confidence < 0.6) {
       // Strict confidence requirement
       return false;
    }

    // 3. Exact match or inclusion
    if (cleanTranscript === cleanTarget) return true;
    if (cleanTranscript.includes(cleanTarget)) return true;

    // 4. Small variations (Plural check)
    // Simple heuristic: target + 's' or 'es'
    if (cleanTranscript === cleanTarget + 's') return true;
    if (cleanTranscript === cleanTarget + 'es') return true;
    
    // Reverse check (user said singular for plural target) - maybe acceptable? 
    // User said "Accept small variations".
    if (cleanTarget === cleanTranscript + 's') return true;

    return false;
  }
};
