import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from "expo-file-system/legacy";
import { getDeviceId } from "@/services/device";

type SpeechAttempt = {
  deviceId: string;
  activityId: string;
  text: string;
  success: boolean;
  timestamp: number;
};

type SpeechDB = {
  attempts: SpeechAttempt[];
};

const SPEECH_FILE = `${documentDirectory}speech_log.json`;

async function ensureFile(): Promise<void> {
  const info = await getInfoAsync(SPEECH_FILE);
  if (!info.exists) {
    const empty: SpeechDB = { attempts: [] };
    await writeAsStringAsync(SPEECH_FILE, JSON.stringify(empty));
  }
}

async function loadDB(): Promise<SpeechDB> {
  await ensureFile();
  const content = await readAsStringAsync(SPEECH_FILE);
  try {
    const data = JSON.parse(content || "{}");
    if (!data || !Array.isArray(data.attempts)) return { attempts: [] };
    return data as SpeechDB;
  } catch {
    return { attempts: [] };
  }
}

async function saveDB(db: SpeechDB): Promise<void> {
  await writeAsStringAsync(SPEECH_FILE, JSON.stringify(db));
}

export async function addAttempt(input: Omit<SpeechAttempt, "deviceId" | "timestamp">): Promise<void> {
  const db = await loadDB();
  const deviceId = await getDeviceId();
  const attempt: SpeechAttempt = { ...input, deviceId, timestamp: Date.now() };
  db.attempts.push(attempt);
  await saveDB(db);
}

export async function getAttempts(deviceIdParam?: string): Promise<SpeechAttempt[]> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  return db.attempts.filter((a) => a.deviceId === deviceId);
}
