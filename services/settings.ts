import * as FileSystem from 'expo-file-system/legacy';

const SETTINGS_FILE = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}settings.json`;

export interface Settings {
  hasSeenWelcome: boolean;
}

const defaultSettings: Settings = {
  hasSeenWelcome: false,
};

export const settingsService = {
  async getSettings(): Promise<Settings> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE);
      if (!fileInfo.exists) {
        await this.saveSettings(defaultSettings);
        return defaultSettings;
      }

      const content = await FileSystem.readAsStringAsync(SETTINGS_FILE);
      return JSON.parse(content) as Settings;
    } catch (error) {
      console.error('Error reading settings:', error);
      return defaultSettings;
    }
  },

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  async setHasSeenWelcome(value: boolean): Promise<void> {
    const settings = await this.getSettings();
    settings.hasSeenWelcome = value;
    await this.saveSettings(settings);
  },

  async hasSeenWelcome(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.hasSeenWelcome;
  }
};
