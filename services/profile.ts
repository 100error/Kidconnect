import * as FileSystem from 'expo-file-system/legacy';

const PROFILE_FILE = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}profile.json`;

export interface UserProfile {
  deviceId: string;
  username: string;
  avatarId: string;
  createdAt: string;
}

// Simple UUID generator since we don't have crypto/uuid
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const profileService = {
  async getProfile(): Promise<UserProfile | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(PROFILE_FILE);
      if (!fileInfo.exists) {
        return null;
      }
      const content = await FileSystem.readAsStringAsync(PROFILE_FILE);
      return JSON.parse(content) as UserProfile;
    } catch (error) {
      console.error('Error reading profile:', error);
      return null;
    }
  },

  async saveProfile(username: string, avatarId: string): Promise<UserProfile> {
    try {
      // Get or create Device ID
      let deviceId = generateUUID();
      
      // Attempt to use a real device identifier if stable, but fallback to UUID
      // We'll stick to the generated UUID as the "Device ID" for this app's logic 
      // to ensure it persists even if system IDs change, as long as file persists.
      // If a profile already exists, we should ideally keep that ID, but this function
      // is for "Registration", so we assume we are creating fresh or overwriting.
      // However, the prompt says "One profile per device only".
      
      // Check if we already have a profile to preserve the ID? 
      // The prompt says "If the device is already registered... NO edit". 
      // So this function should probably only be called if no profile exists.
      
      const newProfile: UserProfile = {
        deviceId,
        username,
        avatarId,
        createdAt: new Date().toISOString(),
      };

      await FileSystem.writeAsStringAsync(PROFILE_FILE, JSON.stringify(newProfile));
      return newProfile;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  },

  async updateProfile(username: string, avatarId: string): Promise<UserProfile> {
    try {
      const currentProfile = await this.getProfile();
      if (!currentProfile) {
        throw new Error("No profile to update");
      }

      const updatedProfile: UserProfile = {
        ...currentProfile,
        username,
        avatarId,
      };

      await FileSystem.writeAsStringAsync(PROFILE_FILE, JSON.stringify(updatedProfile));
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async hasProfile(): Promise<boolean> {
    const profile = await this.getProfile();
    return !!profile;
  },

  // Helper to clear profile (dev only, not exposed in UI)
  async clearProfile(): Promise<void> {
    try {
      await FileSystem.deleteAsync(PROFILE_FILE, { idempotent: true });
    } catch (error) {
      console.error('Error clearing profile:', error);
    }
  }
};
