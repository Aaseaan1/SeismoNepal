import { useEffect } from 'react';
import { Platform, View, Alert } from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';



// Keep splash visible until the root view is mounted.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      }).catch(() => undefined);
    }
  }, []);

  const handleLayout = () => {
    SplashScreen.hideAsync().catch(() => undefined);
  };

  const handleLocationPress = () => {
    Alert.alert('Location Button', 'You pressed the location button!');
    // TODO: Replace with your location logic
  };

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
