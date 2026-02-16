import { useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
import { SettingsManager } from '@/lib/settings';

const SHAKE_THRESHOLD = 25;
const SHAKE_COUNT_THRESHOLD = 3;

export function useShakeDetection(onShake: () => void) {
  useEffect(() => {
    let shakeCount = 0;
    let lastShakeTime = 0;
    const shakeResetTimeout = 500; // ms

    const _onAccelerometerEvent = async (event: any) => {
      const { x, y, z } = event;
      const acceleration = Math.sqrt(x * x + y * y + z * z);

      // Check if shake threshold is exceeded
      if (acceleration > SHAKE_THRESHOLD) {
        const now = Date.now();

        // Reset shake count if too much time has passed
        if (now - lastShakeTime > shakeResetTimeout) {
          shakeCount = 0;
        }

        shakeCount++;
        lastShakeTime = now;

        // Check if we've detected enough shakes
        if (shakeCount >= SHAKE_COUNT_THRESHOLD) {
          const settings = await SettingsManager.loadSettings();
          if (settings.shakeEnabled) {
            onShake();
            shakeCount = 0; // Reset after triggering
          }
        }
      }
    };

    // Set accelerometer update interval
    Accelerometer.setUpdateInterval(100);

    // Subscribe to accelerometer events
    const subscription = Accelerometer.addListener(_onAccelerometerEvent);

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [onShake]);
}
