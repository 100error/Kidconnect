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
              alternativeLanguageCodes: ["en-PH", "en-US"],
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

  // Smart, accent-tolerant pronunciation check
  checkWord: (result: SpeechResult | string, target: string): boolean => {
    const transcript = typeof result === 'string' ? result : result.transcript;
    const confidence = typeof result === 'string' ? 1.0 : result.confidence;
    if (!transcript || !target) return false;

    const clean = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const tgt = clean(target);
    const spokenAll = clean(transcript);
    const tokens = spokenAll.split(/\s+/).filter(Boolean);

    // Fast paths
    if (spokenAll === tgt) return true;
    if (spokenAll.includes(tgt)) return true;
    if (spokenAll === tgt + 's' || spokenAll === tgt + 'es' || tgt === spokenAll + 's') return true;

    const bestSpoken =
      tokens.length > 0
        ? tokens.reduce((best, w) => {
            const d = graphemeDistance(w, tgt);
            return d < best.d ? { w, d } : best;
          }, { w: tokens[0], d: graphemeDistance(tokens[0], tgt) }).w
        : spokenAll;

    const phonScore = phonemeSimilarity(bestSpoken, tgt); // 0..1
    const graphScore = 1 - normalizedLevenshtein(bestSpoken, tgt); // 0..1
    const sylScore = syllableSimilarity(bestSpoken, tgt); // 0..1

    // Confidence is advisory only; never hard-fail kids for accent
    const confBoost = confidence > 0.75 ? 0.05 : confidence > 0.6 ? 0.02 : 0;

    // Weigh toward phoneme production, then intelligibility, then syllables
    const score = Math.min(
      1,
      0.6 * phonScore + 0.3 * graphScore + 0.1 * sylScore + confBoost
    );

    // Forgiving threshold for children and Filipino-accent tolerance
    return score >= 0.6;
  }
};

// ---- Helpers: Phoneme-level similarity with Filipino-accent tolerance ----

function graphemeDistance(a: string, b: string): number {
  return normalizedLevenshtein(a, b);
}

function normalizedLevenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cb = b.charCodeAt(j - 1);
      const cost = ca === cb ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const dist = dp[m][n];
  return m > n ? dist / m : dist / n;
}

function syllableCount(w: string): number {
  // Simple vowel-group heuristic
  const s = w.toLowerCase();
  const groups = s.replace(/[^a-z]/g, '').match(/[aeiouy]+/g);
  if (!groups) return 1;
  // Heuristic adjustments for silent 'e'
  let count = groups.length;
  if (s.endsWith('e') && count > 1) count -= 1;
  return Math.max(1, count);
}

function syllableSimilarity(a: string, b: string): number {
  const sa = syllableCount(a);
  const sb = syllableCount(b);
  const diff = Math.abs(sa - sb);
  if (diff === 0) return 1;
  if (diff === 1) return 0.8;
  return 0.5;
}

function toPhonemes(word: string): string[] {
  const w = word.toLowerCase();
  const tokens: string[] = [];
  let i = 0;
  const push = (t: string) => tokens.push(t);
  while (i < w.length) {
    const two = w.slice(i, i + 2);
    const three = w.slice(i, i + 3);
    const four = w.slice(i, i + 4);
    if (four === 'tion') {
      push('shun'); i += 4; continue;
    }
    if (three === 'sch') { push('sk'); i += 3; continue; }
    if (two === 'ch') { push('ch'); i += 2; continue; }
    if (two === 'sh') { push('sh'); i += 2; continue; }
    if (two === 'th') { push('th'); i += 2; continue; }
    if (two === 'ph') { push('f'); i += 2; continue; }
    if (two === 'ng') { push('ng'); i += 2; continue; }
    if (two === 'ck') { push('k'); i += 2; continue; }
    if (two === 'qu') { push('kw'); i += 2; continue; }
    // Vowel clusters
    if (two === 'ee' || two === 'ea') { push('I'); i += 2; continue; } // long i/ee
    if (two === 'oo') { push('U'); i += 2; continue; }
    const c = w[i];
    if ('aeiouy'.includes(c)) {
      // Broad vowel categories for accent tolerance
      const vmap: Record<string, string> = { a: 'A', e: 'E', i: 'I', o: 'O', u: 'U', y: 'I' };
      push(vmap[c] || c);
    } else {
      push(c);
    }
    i += 1;
  }
  return tokens;
}

function phonemeSimilarity(a: string, b: string): number {
  const pa = toPhonemes(a);
  const pb = toPhonemes(b);
  const m = pa.length, n = pb.length;
  if (m === 0 || n === 0) return 0;
  // DP with accent-tolerant substitution costs
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i * 0.75;
  for (let j = 0; j <= n; j++) dp[0][j] = j * 0.75;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const aPh = pa[i - 1];
      const bPh = pb[j - 1];
      const subCost = aPh === bPh ? 0 : (areSimilar(aPh, bPh) ? 0.25 : 1.0);
      dp[i][j] = Math.min(
        dp[i - 1][j] + 0.75,       // deletion
        dp[i][j - 1] + 0.75,       // insertion
        dp[i - 1][j - 1] + subCost // substitution
      );
    }
  }
  const raw = dp[m][n];
  const worst = Math.max(m, n) * 1.0; // worst-case substitutions
  const sim = 1 - Math.min(1, raw / worst);
  return Math.max(0, Math.min(1, sim));
}

function areSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  // Vowel tolerance: Filipino shifts (short "i" vs long "ee", "o" vs "u")
  const vowelGroups = [
    new Set(['I', 'i', 'ee']), // treat 'I' category
    new Set(['E', 'e']),
    new Set(['A', 'a']),
    new Set(['O', 'o', 'U', 'u']),
  ];
  for (const g of vowelGroups) {
    if (g.has(a) && g.has(b)) return true;
  }
  // Consonant equivalences common in Filipino-English
  const equiv: [string, string][] = [
    ['f', 'p'],
    ['v', 'b'],
    ['th', 't'], ['th', 'd'],
    ['z', 's'],
    ['sh', 's'],
    ['ch', 'ts'],
    ['r', 'l'] // be tolerant but keep small penalty via subCost 0.25
  ];
  return equiv.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}
