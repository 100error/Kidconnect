import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';

const INSTRUCTIONS_FILE = documentDirectory + 'instructions_seen.json';

export const checkInstructionSeen = async (screenId: string): Promise<boolean> => {
  try {
    const fileInfo = await getInfoAsync(INSTRUCTIONS_FILE);
    if (!fileInfo.exists) {
      return false;
    }
    const content = await readAsStringAsync(INSTRUCTIONS_FILE);
    const data = JSON.parse(content);
    return !!data[screenId];
  } catch (error) {
    console.error('Error checking instruction status:', error);
    return false;
  }
};

export const markInstructionSeen = async (screenId: string): Promise<void> => {
  try {
    let data: Record<string, boolean> = {};
    const fileInfo = await getInfoAsync(INSTRUCTIONS_FILE);
    if (fileInfo.exists) {
      const content = await readAsStringAsync(INSTRUCTIONS_FILE);
      data = JSON.parse(content);
    }
    
    data[screenId] = true;
    
    await writeAsStringAsync(INSTRUCTIONS_FILE, JSON.stringify(data));
  } catch (error) {
    console.error('Error marking instruction as seen:', error);
  }
};
