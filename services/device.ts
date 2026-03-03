import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from "expo-file-system/legacy";

const DEVICE_FILE = `${documentDirectory}device_id.json`;

function generateId(): string {
  const rand = () => Math.random().toString(16).slice(2, 10);
  return `${Date.now().toString(16)}-${rand()}-${rand()}`;
}

export async function getDeviceId(): Promise<string> {
  const info = await getInfoAsync(DEVICE_FILE);
  if (!info.exists) {
    const id = generateId();
    await writeAsStringAsync(DEVICE_FILE, JSON.stringify({ id }));
    return id;
  }
  try {
    const content = await readAsStringAsync(DEVICE_FILE);
    const data = JSON.parse(content || "{}");
    if (typeof data.id === "string" && data.id.length > 0) {
      return data.id;
    }
  } catch {}
  const id = generateId();
  await writeAsStringAsync(DEVICE_FILE, JSON.stringify({ id }));
  return id;
}
