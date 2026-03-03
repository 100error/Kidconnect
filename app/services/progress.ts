import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from "expo-file-system/legacy";
import { getDeviceId } from "../../services/device";

type Category = "practice" | "game";

type ActivityResult = {
  deviceId: string;
  activityId: string;
  category: Category;
  score: number;
  maxScore: number;
  completed: boolean;
  timestamp: number;
  synced?: boolean;
};

type ProgressDB = {
  results: ActivityResult[];
};

const PROGRESS_FILE = `${documentDirectory}progress.json`;

let listeners = new Set<(deviceId: string) => void>();

async function ensureFile(): Promise<void> {
  const info = await getInfoAsync(PROGRESS_FILE);
  if (!info.exists) {
    const empty: ProgressDB = { results: [] };
    await writeAsStringAsync(PROGRESS_FILE, JSON.stringify(empty));
  }
}

async function loadDB(): Promise<ProgressDB> {
  await ensureFile();
  const content = await readAsStringAsync(PROGRESS_FILE);
  try {
    const data = JSON.parse(content || "{}");
    if (!data || !Array.isArray(data.results)) return { results: [] };
    return data as ProgressDB;
  } catch {
    return { results: [] };
  }
}

async function saveDB(db: ProgressDB): Promise<void> {
  await writeAsStringAsync(PROGRESS_FILE, JSON.stringify(db));
}

export async function addResult(input: Omit<ActivityResult, "deviceId" | "timestamp" | "synced">): Promise<void> {
  const db = await loadDB();
  const deviceId = await getDeviceId();
  const result: ActivityResult = { ...input, deviceId, completed: !!input.completed, timestamp: Date.now(), synced: false };
  db.results.push(result);
  await saveDB(db);
  emit(deviceId);
}

export async function getOverallPercent(deviceIdParam?: string): Promise<number> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  const items = db.results.filter((r) => r.deviceId === deviceId && r.completed);
  if (items.length === 0) return 0;
  const normalized = items.map((r) => (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0));
  const avg = normalized.reduce((a, b) => a + b, 0) / normalized.length;
  return Math.round(avg);
}

function emit(deviceId: string) {
  listeners.forEach((fn) => {
    try {
      fn(deviceId);
    } catch {}
  });
}

export function subscribeProgress(listener: (deviceId: string) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getUnsynced(deviceIdParam?: string): Promise<ActivityResult[]> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  return db.results.filter((r) => r.deviceId === deviceId && !r.synced);
}

export async function markSynced(predicate: (r: ActivityResult) => boolean): Promise<void> {
  const db = await loadDB();
  db.results = db.results.map((r) => (predicate(r) ? { ...r, synced: true } : r));
  await saveDB(db);
}
