import AsyncStorage from '@react-native-async-storage/async-storage';

export const getItem = async (key, fallback = null) => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch { return fallback; }
};

export const setItem = async (key, value) => {
  try { await AsyncStorage.setItem(key, String(value)); } catch {}
};

export const getJSON = async (key, fallback = null) => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
};

export const setJSON = async (key, value) => {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const KEYS = {
  BACKEND_URL: 'nt-backend-url',
  USER_ID: 'nt-user-id',
  AUTH_TOKEN: 'nt-auth-token',
  USER_EMAIL: 'nt-user-email',
  DIET: 'nt-diet',
  PROFILE_BACKUP: 'nt-profile-backup',
};
