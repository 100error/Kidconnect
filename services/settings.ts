import * as FileSystem from "expo-file-system/legacy";

const SETTINGS_FILE = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}settings.json`;

export interface Settings {
  hasSeenWelcome: boolean;
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
}

const defaultSettings: Settings = {
  hasSeenWelcome: false,
  musicEnabled: true,
  soundEffectsEnabled: true,
};

type SettingsListener = (settings: Settings) => void;

export const settingsService = {
  listeners: [] as SettingsListener[],

  async getSettings(): Promise<Settings> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE);
      if (!fileInfo.exists) {
        await this.saveSettings(defaultSettings);
        return defaultSettings;
      }

      const content = await FileSystem.readAsStringAsync(SETTINGS_FILE);
      const settings = JSON.parse(content);

      // Migration: if audioEnabled exists, use it for both music and sound
      if (settings.audioEnabled !== undefined) {
        if (settings.musicEnabled === undefined)
          settings.musicEnabled = settings.audioEnabled;
        if (settings.soundEffectsEnabled === undefined)
          settings.soundEffectsEnabled = settings.audioEnabled;
      }

      // Merge with default to ensure new keys exist
      return { ...defaultSettings, ...settings };
    } catch (error) {
      console.error("Error reading settings:", error);
      return defaultSettings;
    }
  },

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(
        SETTINGS_FILE,
        JSON.stringify(settings),
      );
      this.notifyListeners(settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  },

  async setHasSeenWelcome(value: boolean): Promise<void> {
    const settings = await this.getSettings();
    settings.hasSeenWelcome = value;
    await this.saveSettings(settings);
  },

  async setMusicEnabled(value: boolean): Promise<void> {
    const settings = await this.getSettings();
    settings.musicEnabled = value;
    await this.saveSettings(settings);
  },

  async setSoundEffectsEnabled(value: boolean): Promise<void> {
    const settings = await this.getSettings();
    settings.soundEffectsEnabled = value;
    await this.saveSettings(settings);
  },

  async hasSeenWelcome(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.hasSeenWelcome;
  },

  async isMusicEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.musicEnabled;
  },

  async isSoundEffectsEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.soundEffectsEnabled;
  },

  addListener(listener: SettingsListener) {
    this.listeners.push(listener);
  },

  removeListener(listener: SettingsListener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  },

  notifyListeners(settings: Settings) {
    this.listeners.forEach((l) => l(settings));
  },
};
