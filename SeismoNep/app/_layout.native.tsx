import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useShakeDetection } from '@/hooks/use-shake-detection';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Handle shake detection (only on native platforms)
  const handleShake = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Phone Shake Detected!', 'A shake event was detected by your device.');
      // Dynamically import native-only modules
      const { AlertService } = await import('@/lib/alerts');
      await AlertService.triggerEarthquakeAlert(4.5, 'Shake Detected');
    }
  }, []);

  // Enable shake detection (only on native)
  useShakeDetection(Platform.OS !== 'web' ? handleShake : undefined);

  // Auto-fetch earthquake data on app startup (only on native)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Dynamically import native-only modules
      import('@/lib/database').then(({ db }) => {
        db.autoFetchEarthquakes();
      });
      import('@/lib/alerts').then(({ AlertService }) => {
        AlertService.initialize();
      });
      return () => {
        import('@/lib/alerts').then(({ AlertService }) => {
          AlertService.cleanup();
        });
      };
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false, 
        }}
      />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
