import { Platform } from 'react-native';

const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.1.117';

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
export const imAPI_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
