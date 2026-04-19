import { Platform } from 'react-native';
import AsyncStorage from './storage';

const API_URL_KEY = 'API_BASE_URL';

// Automatically select the correct base URL for emulator, simulator, or device
function getDefaultBaseUrl() {
	const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
	if (envBaseUrl) {
		const normalized = envBaseUrl.replace(/\/+$/, '');
		if (Platform.OS === 'android') {
			return normalized
				.replace('http://127.0.0.1:8000', 'http://10.0.2.2:8000')
				.replace('http://localhost:8000', 'http://10.0.2.2:8000');
		}

		return normalized;
	}

	if (Platform.OS === 'android') {
		return 'http://10.0.2.2:8000';
	}

	return 'http://127.0.0.1:8000';
}

const DEFAULT_BASE_URL = getDefaultBaseUrl();
let cachedBaseUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
	if (cachedBaseUrl) return cachedBaseUrl;
	const stored = await AsyncStorage.getItem(API_URL_KEY);
	cachedBaseUrl = (stored || DEFAULT_BASE_URL).replace(/\/+$/, '');
	return cachedBaseUrl;
}

export async function setApiBaseUrl(url: string): Promise<void> {
	cachedBaseUrl = url.replace(/\/+$/, '');
	await AsyncStorage.setItem(API_URL_KEY, cachedBaseUrl);
}

// For legacy usage, fallback to default (sync, not recommended for new code)
export const API_BASE_URL = DEFAULT_BASE_URL.replace(/\/+$/, '');
export const imAPI_BASE_URL = DEFAULT_BASE_URL.replace(/\/+$/, '');
