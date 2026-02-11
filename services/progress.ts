import { getDeviceId } from "@/services/device";
import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from "expo-file-system/legacy";

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

type CurrentSession = {
  sumPercent: number;
  count: number;
  lastUpdatedAt: number;
};

type ProgressDB = {
  results: ActivityResult[];
  currentSession?: CurrentSession;
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
  const timestamp = Date.now();
  const result: ActivityResult = { ...input, deviceId, completed: !!input.completed, timestamp, synced: false };
  db.results.push(result);

  // 24-Hour Rolling Session Logic
  const normalized = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
  
  if (!db.currentSession || (timestamp - db.currentSession.lastUpdatedAt >= 24 * 60 * 60 * 1000)) {
    // Start new session
    db.currentSession = {
      sumPercent: normalized,
      count: 1,
      lastUpdatedAt: timestamp
    };
  } else {
    // Update existing session
    db.currentSession.sumPercent += normalized;
    db.currentSession.count += 1;
    db.currentSession.lastUpdatedAt = timestamp;
  }

  await saveDB(db);
  emit(deviceId);
}

export async function getCurrent24hProgress(deviceIdParam?: string): Promise<number> {
  const db = await loadDB();
  // We don't strictly need deviceId for the local session if we assume single user per device for this feature,
  // but to be consistent with existing patterns (though DB seems local file based):
  // The currentSession in DB is shared? 
  // Wait, ActivityResult has deviceId. currentSession is global in the file?
  // The DB structure I defined `currentSession` is at the root of ProgressDB.
  // If `addResult` is called with different deviceIds, they would overwrite the same session.
  // The existing code uses `getDeviceId` and filters results.
  // Ideally `currentSession` should be per deviceId or just assume single user for this local-first app.
  // The existing `loadDB` returns a single object.
  // Given the "Kid" app context and local storage, I'll assume single user or shared session is acceptable,
  // OR I should make `currentSession` a map or part of the root.
  // Simplicity: The prompt implies a single child ("the child’s score").
  // I will use the root `currentSession`.
  
  if (!db.currentSession) return 0;
  
  const now = Date.now();
  if (now - db.currentSession.lastUpdatedAt >= 24 * 60 * 60 * 1000) {
    return 0;
  }
  
  return db.currentSession.count > 0 
    ? Math.round(db.currentSession.sumPercent / db.currentSession.count) 
    : 0;
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

/* ================= DAILY PROGRESS ================= */

export type DailyProgress = {
  date: string; // YYYY-MM-DD
  percent: number;
};

// Helper to get YYYY-MM-DD from timestamp (local time)
function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
}

export async function getDailyHistory(deviceIdParam?: string): Promise<DailyProgress[]> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  const userResults = db.results.filter((r) => r.deviceId === deviceId && r.completed);

  const grouped: Record<string, number[]> = {};

  userResults.forEach((r) => {
    const key = getDateKey(r.timestamp);
    if (!grouped[key]) grouped[key] = [];
    const normalized = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0;
    grouped[key].push(normalized);
  });

  const history: DailyProgress[] = Object.keys(grouped).map((date) => {
    const scores = grouped[date];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return { date, percent: Math.round(avg) };
  });

  // Sort by date descending (newest first)
  return history.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getTodayPercent(deviceIdParam?: string): Promise<number> {
  const history = await getDailyHistory(deviceIdParam);
  const today = getDateKey(Date.now());
  const todayEntry = history.find((h) => h.date === today);
  return todayEntry ? todayEntry.percent : 0;
}
