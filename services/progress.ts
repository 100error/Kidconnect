import { getDeviceId } from "@/services/device";
import {
    documentDirectory,
    getInfoAsync,
    readAsStringAsync,
    writeAsStringAsync,
} from "expo-file-system/legacy";

type Category = "practice" | "game";

export type ActivityResult = {
  deviceId: string;
  activityId: string;
  sessionId?: string; // ✅ Unique session ID
  category: Category;
  score: number;
  maxScore: number;
  completed: boolean;
  timestamp: string; // ISO format
  synced?: boolean;
};

type ProgressDB = {
  results: ActivityResult[];
};

const PROGRESS_FILE = `${documentDirectory}progress.json`;
const TOTAL_ACTIVITIES = 9; // Total activities to track progress against

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

    // ✅ CLEAN EXISTING DUPLICATES
    const uniqueMap = new Map<string, ActivityResult>();
    data.results.forEach((r: ActivityResult) => {
      // Priority 1: sessionId
      // Priority 2: activityId + dateKey + score
      const dateKey = new Date(r.timestamp).toISOString().split("T")[0];
      const key = r.sessionId || `${r.activityId}-${dateKey}-${r.score}`;

      const existing = uniqueMap.get(key);
      if (
        !existing ||
        new Date(r.timestamp).getTime() > new Date(existing.timestamp).getTime()
      ) {
        uniqueMap.set(key, r);
      }
    });

    data.results = Array.from(uniqueMap.values());
    return data as ProgressDB;
  } catch {
    return { results: [] };
  }
}

async function saveDB(db: ProgressDB): Promise<void> {
  // ✅ FINAL CLEANUP BEFORE SAVING
  const uniqueMap = new Map<string, ActivityResult>();
  db.results.forEach((r) => {
    const dateKey = new Date(r.timestamp).toISOString().split("T")[0];
    const key = r.sessionId || `${r.activityId}-${dateKey}-${r.score}`;

    const existing = uniqueMap.get(key);
    if (
      !existing ||
      new Date(r.timestamp).getTime() > new Date(existing.timestamp).getTime()
    ) {
      uniqueMap.set(key, r);
    }
  });
  db.results = Array.from(uniqueMap.values());

  await writeAsStringAsync(PROGRESS_FILE, JSON.stringify(db));
}

export async function addResult(
  input: Omit<ActivityResult, "deviceId" | "synced" | "timestamp"> & {
    timestamp?: string;
  },
): Promise<void> {
  const db = await loadDB();
  const deviceId = await getDeviceId();
  const timestamp = input.timestamp || new Date().toISOString();
  const dateKey = new Date(timestamp).toISOString().split("T")[0];

  console.log("Saving result:", input.activityId, "Session:", input.sessionId);

  // ✅ DUPLICATE PREVENTION (CRITICAL)
  // 1. Check by Session ID
  if (input.sessionId) {
    const exists = db.results.some((r) => r.sessionId === input.sessionId);
    if (exists) {
      console.log("Session ID already exists, skipping:", input.sessionId);
      return;
    }
  }

  // 2. Check by Activity + Date + Score (User Requirement)
  const isDuplicate = db.results.some(
    (r) =>
      r.activityId === input.activityId &&
      new Date(r.timestamp).toISOString().split("T")[0] === dateKey &&
      r.score === input.score,
  );

  if (isDuplicate) {
    console.log("Duplicate activity/score found for today, skipping.");
    return;
  }

  const result: ActivityResult = {
    ...input,
    deviceId,
    completed: !!input.completed,
    timestamp,
    synced: false,
  };

  db.results.push(result);
  await saveDB(db);
  emit(deviceId);
}

// ----------------------------------------------------------------------
// NEW PROGRESS LOGIC (Sum of Scores / Sum of Max)
// ----------------------------------------------------------------------

export async function getOverallPercent(
  deviceIdParam?: string,
): Promise<number> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());

  // ✅ 1. FILTER FOR ALL COMPLETED RESULTS
  const rawItems = db.results.filter(
    (r) => r.deviceId === deviceId && r.completed,
  );

  if (rawItems.length === 0) return 0;

  // ✅ 2. COUNT UNIQUE COMPLETED ACTIVITIES (Overall completion)
  const completedEver = new Set(rawItems.map((r) => r.activityId));
  const completedCount = completedEver.size;

  // ✅ 3. CALCULATE PROGRESS (Number of completed activities / Total)
  return Math.min(100, Math.round((completedCount / TOTAL_ACTIVITIES) * 100));
}

export async function getCurrent24hProgress(
  deviceIdParam?: string,
): Promise<number> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());

  const todayKey = new Date().toISOString().split("T")[0];

  // ✅ 1. FILTER FOR TODAY'S COMPLETED RESULTS
  const rawItems = db.results.filter(
    (r) =>
      r.deviceId === deviceId &&
      r.completed &&
      new Date(r.timestamp).toISOString().split("T")[0] === todayKey,
  );

  if (rawItems.length === 0) return 0;

  // ✅ 2. COUNT UNIQUE COMPLETED ACTIVITIES FOR TODAY (strictly increasing)
  const completedToday = new Set(rawItems.map((r) => r.activityId));
  const completedCount = completedToday.size;

  // ✅ 3. CALCULATE PROGRESS (Number of completed activities / Total)
  // Recommended for kids: This ensures progress never drops within a day
  return Math.min(100, Math.round((completedCount / TOTAL_ACTIVITIES) * 100));
}

function emit(deviceId: string) {
  listeners.forEach((fn) => {
    try {
      fn(deviceId);
    } catch {}
  });
}

export function subscribeProgress(
  listener: (deviceId: string) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getUnsynced(
  deviceIdParam?: string,
): Promise<ActivityResult[]> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  return db.results.filter((r) => r.deviceId === deviceId && !r.synced);
}

export async function markSynced(
  predicate: (r: ActivityResult) => boolean,
): Promise<void> {
  const db = await loadDB();
  db.results = db.results.map((r) =>
    predicate(r) ? { ...r, synced: true } : r,
  );
  await saveDB(db);
}

export async function getResultsByDate(
  date?: string, // Expected ISO format YYYY-MM-DD or will default to today
  deviceIdParam?: string,
): Promise<ActivityResult[]> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());
  const dateKey = date || new Date().toISOString().split("T")[0];

  return db.results.filter(
    (r) =>
      r.deviceId === deviceId &&
      new Date(r.timestamp).toISOString().split("T")[0] === dateKey,
  );
}

export async function getAllResults(
  deviceIdParam?: string,
): Promise<ActivityResult[]> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());

  // Return all results for this device, but cleaned of duplicates
  const cleanedResultsMap = new Map<string, ActivityResult>();

  db.results.forEach((r) => {
    if (r.deviceId !== deviceId) return;

    const dateKey = new Date(r.timestamp).toISOString().split("T")[0];
    const key = r.sessionId || `${r.activityId}-${dateKey}-${r.score}`;

    const existing = cleanedResultsMap.get(key);
    if (
      !existing ||
      new Date(r.timestamp).getTime() > new Date(existing.timestamp).getTime()
    ) {
      cleanedResultsMap.set(key, r);
    }
  });

  return Array.from(cleanedResultsMap.values());
}

export async function getDailyHistory(
  deviceIdParam?: string,
): Promise<DailyProgress[]> {
  const db = await loadDB();
  const deviceId = deviceIdParam || (await getDeviceId());

  const historyMap = new Map<
    string,
    { totalScore: number; totalMax: number }
  >();

  db.results
    .filter((r) => r.deviceId === deviceId && r.completed)
    .forEach((r) => {
      const dateKey = new Date(r.timestamp).toISOString().split("T")[0];
      const stats = historyMap.get(dateKey) || { totalScore: 0, totalMax: 0 };
      stats.totalScore += r.score;
      stats.totalMax += r.maxScore;
      historyMap.set(dateKey, stats);
    });

  const history: DailyProgress[] = [];
  historyMap.forEach((stats, date) => {
    history.push({
      date,
      percent:
        stats.totalMax > 0
          ? Math.round((stats.totalScore / stats.totalMax) * 100)
          : 0,
    });
  });

  return history.sort((a, b) => b.date.localeCompare(a.date));
}

export type DailyProgress = {
  date: string;
  percent: number;
};

export async function getTodayPercent(deviceIdParam?: string): Promise<number> {
  return getCurrent24hProgress(deviceIdParam);
}
