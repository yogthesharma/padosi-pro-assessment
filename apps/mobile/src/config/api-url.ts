import { Platform } from 'react-native';
import { preferences } from '@/lib/storage';

const STORAGE_KEY = 'padosipro.apiUrl';

/**
 * The Android emulator reaches the host machine at 10.0.2.2; web and iOS simulators use localhost.
 * EXPO_PUBLIC_API_URL (baked in at build time) wins, and a URL saved in Server settings wins over both,
 * so a single APK works on an emulator or a real phone on the same Wi-Fi.
 */
export const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');

let current = DEFAULT_API_URL;

export const getApiUrl = () => current;

export async function loadApiUrl() {
  current = (await preferences.get(STORAGE_KEY)) ?? DEFAULT_API_URL;
  return current;
}

export async function saveApiUrl(url: string) {
  const normalised = normaliseApiUrl(url);
  current = normalised;
  if (normalised === DEFAULT_API_URL) await preferences.remove(STORAGE_KEY);
  else await preferences.set(STORAGE_KEY, normalised);
  return normalised;
}

export function normaliseApiUrl(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}
