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

// ----------------------------------------------------------------------
// NEW PROGRESS LOGIC (Fair Distribution)
// ----------------------------------------------------------------------

const ACTIVITIES = [
  { id: "presentsimpletense", type: "single" as const },
  { id: "sentence-build-worksheet", type: "single" as const },
  { id: "pronunciation-matching", type: "single" as const },
  { id: "oddwordout", type: "single" as const },
  { id: "storyspeak", type: "single" as const },
  { id: "pronunciation-game", type: "single" as const },
  { id: "causeeffect", type: "single" as const },
  { id: "riddles", type: "single" as const },
  { id: "fixsentence", type: "multi" as const, count: 10 },
];
 
function calculateCoverage(results: ActivityResult[]): number {
  if (results.length === 0) return 0;

  let totalProgress = 0;

  for (const activity of ACTIVITIES) {
    if (activity.type === "single") {
      // Check if any completed entry exists for this activity
      const hasCompleted = results.some((r) => r.activityId === activity.id && r.completed);
      if (hasCompleted) {
        totalProgress += 1;
      }
    } else if (activity.type === "multi") {
      // Count unique completed IDs for this activity (e.g., fixsentence-1, fixsentence-2)
      const uniqueCompleted = new Set(
        results
          .filter((r) => r.activityId.startsWith(activity.id + "-") && r.completed)
          .map((r) => r.activityId)
      );
      // Cap at expected count (10)
      const count = Math.min(uniqueCompleted.size, activity.count);
      totalProgress += (count / activity.count);
    }
  }

  // Calculate percentage: (Total Points / Total Activities) * 100
  return Math.round((totalProgress / ACTIVITIES.length) * 100);
}

export async function getOverallPercent(deviceIdParam?: string): Promise<number> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  // Filter all completed results for this device
  const items = db.results.filter((r) => r.deviceId === deviceId && r.completed);
  return calculateCoverage(items);
}

export async function getCurrent24hProgress(deviceIdParam?: string): Promise<number> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  
  // Define "Current Session" as results from the last 24 hours
  // This matches the user's intent of "Daily Progress" resetting daily/session-based
  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

  const items = db.results.filter((r) => 
    r.deviceId === deviceId && 
    r.completed && 
    r.timestamp >= twentyFourHoursAgo
  );

  return calculateCoverage(items);
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

// Legacy helper for history (optional, can reuse logic)
export async function getDailyHistory(deviceIdParam?: string): Promise<DailyProgress[]> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  
  // Group results by date (YYYY-MM-DD)
  const historyMap = new Map<string, ActivityResult[]>();
  
  db.results
    .filter(r => r.deviceId === deviceId && r.completed)
    .forEach(r => {
      const dateKey = new Date(r.timestamp).toISOString().split('T')[0];
      if (!historyMap.has(dateKey)) {
        historyMap.set(dateKey, []);
      }
      historyMap.get(dateKey)!.push(r);
    });

  const history: DailyProgress[] = [];
  historyMap.forEach((results, date) => {
    history.push({
      date,
      percent: calculateCoverage(results)
    });
  });

  // Sort by date descending
  return history.sort((a, b) => b.date.localeCompare(a.date));
}

// Export types if needed elsewhere
export type DailyProgress = {
  date: string;
  percent: number;
};

// Helper to get YYYY-MM-DD from timestamp (local time) - Preserved for getTodayPercent
function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
}

export async function getTodayPercent(deviceIdParam?: string): Promise<number> {
  const history = await getDailyHistory(deviceIdParam);
  const today = getDateKey(Date.now());
  const todayEntry = history.find((h) => h.date === today);
  return todayEntry ? todayEntry.percent : 0;
}
