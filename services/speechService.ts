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
          extension: '.amr',
          outputFormat: Audio.AndroidOutputFormat.AMR_WB,
          audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 23850,
        },
        ios: {
          extension: '.wav',
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
      console.error('Error starting recording:', error);
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

      // Determine encoding based on file extension
      const isWav = uri.endsWith('.wav');
      const encoding = isWav ? 'LINEAR16' : 'AMR_WB';
      const sampleRateHertz = 16000;

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
              encoding: encoding,
              sampleRateHertz: sampleRateHertz,
              enableAutomaticPunctuation: false,
              enableWordConfidence: true,
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
