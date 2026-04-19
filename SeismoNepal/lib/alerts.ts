import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import type { AVPlaybackSource } from 'expo-av';
import { Settings, SettingsManager } from './settings';

export class AlertService {
  private static soundObject: Audio.Sound | null = null;
  private static settings: Settings | null = null;

  // Initialize the alert service
  static async initialize(): Promise<void> {
    try {
      // Load settings
      this.settings = await SettingsManager.loadSettings();
      
      // Setup audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error initializing AlertService:', error);
    }
  }

  // Trigger earthquake alert with enabled features
  static async triggerEarthquakeAlert(
    magnitude: number,
    location: string
  ): Promise<void> {
    try {
      if (!this.settings) {
        this.settings = await SettingsManager.loadSettings();
      }

      // Vibration pattern based on magnitude
      if (this.settings.vibrationEnabled) {
        await this.triggerVibration(magnitude);
      }

      // Play alert sound
      if (this.settings.soundEnabled) {
        await this.playAlertSound();
      }

      console.log(
        `Earthquake Alert - Magnitude: ${magnitude}, Location: ${location}`
      );
    } catch (error) {
      console.error('Error triggering earthquake alert:', error);
    }
  }

  // Vibration based on magnitude
  private static async triggerVibration(magnitude: number): Promise<void> {
    try {
      if (magnitude < 4.0) {
        // Light vibration for low magnitude
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
      } else if (magnitude < 5.0) {
        // Medium vibration
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        // Heavy vibration for high magnitude
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
    } catch (error) {
      console.error('Error triggering vibration:', error);
    }
  }

  // Play alert sound
  private static async playAlertSound(): Promise<void> {
    try {
      // If a sound has been preloaded elsewhere, replay it; otherwise fallback to haptics.
      if (this.soundObject) {
        await this.soundObject.replayAsync();
        return;
      }

      // No bundled alert sound configured; provide haptic feedback as a fallback.
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch (error) {
      console.error('Error playing alert sound:', error);
      // If custom sound fails, try system haptics
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    }
  }

  // Optionally preload a custom alert sound from a bundled asset or URI
  static async preloadAlertSound(source: number | AVPlaybackSource): Promise<void> {
    try {
      if (this.soundObject) return;
      this.soundObject = new Audio.Sound();
      await this.soundObject.loadAsync(source);
    } catch (error) {
      console.error('Error preloading alert sound:', error);
    }
  }

  // Test vibration
  static async testVibration(): Promise<void> {
    try {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch (error) {
      console.error('Error testing vibration:', error);
    }
  }

  // Cleanup
  static async cleanup(): Promise<void> {
    try {
      if (this.soundObject) {
        await this.soundObject.unloadAsync();
        this.soundObject = null;
      }
    } catch (error) {
      console.error('Error cleaning up AlertService:', error);
    }
  }
}
