import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { API_BASE_URL } from './api';

function getConfiguredProjectId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }

  const fromConfig =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (typeof fromConfig === 'string' && fromConfig.trim()) {
    return fromConfig.trim();
  }

  return undefined;
}

async function requestPushPermissions(): Promise<boolean> {
  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  return status === 'granted';
}

async function getExpoPushToken(): Promise<string | null> {
  const projectId = getConfiguredProjectId();

  if (!projectId) {
    throw new Error(
      'Missing EXPO_PUBLIC_EAS_PROJECT_ID. Set a valid EAS project UUID in frontend-mobile/.env, then restart Expo and log in again on a physical device.'
    );
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token || null;
}

export async function registerDeviceToken(accessToken: string): Promise<void> {
  if (!Device.isDevice) return;

  const hasPermission = await requestPushPermissions();
  if (!hasPermission) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const expoPushToken = await getExpoPushToken();
  if (!expoPushToken) return;

  await fetch(`${API_BASE_URL}/api/alerts/device-token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token: expoPushToken, platform: Platform.OS }),
  });
}
