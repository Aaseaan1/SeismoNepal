import AsyncStorage from '@react-native-async-storage/async-storage';

export type Settings = {
  vibrationEnabled: boolean;
  shakeEnabled: boolean;
  soundEnabled: boolean;
};

const SETTINGS_KEY = 'earthquake_settings';

const DEFAULT_SETTINGS: Settings = {
  vibrationEnabled: false,
  shakeEnabled: false,
  soundEnabled: false,
};

export class SettingsManager {
  // Load settings from storage
  static async loadSettings(): Promise<Settings> {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // Save settings to storage
  static async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Update a single setting
  static async updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ): Promise<void> {
    const settings = await this.loadSettings();
    settings[key] = value;
    await this.saveSettings(settings);
  }

  // Reset to defaults
  static async resetSettings(): Promise<void> {
    await this.saveSettings(DEFAULT_SETTINGS);
  }
}
