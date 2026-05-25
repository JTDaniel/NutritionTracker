import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from './storage';

const DEFAULT_URL = 'http://100.x.x.x:3002'; // replaced in Settings

const getBaseURL = async () => {
  const saved = await AsyncStorage.getItem(KEYS.BACKEND_URL);
  return saved || DEFAULT_URL;
};

export const getUserId = async () => {
  const id = await AsyncStorage.getItem(KEYS.USER_ID);
  if (!id) {
    await AsyncStorage.setItem(KEYS.USER_ID, 'default-user');
    return 'default-user';
  }
  return id;
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const apiFetch = async (path, options = {}) => {
  const base = await getBaseURL();
  const token = await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${base}/api${path}`, { ...options, headers }).then(handleResponse);
};

// Auth (no token needed)
export const loginUser = async (email, password) => {
  const base = await getBaseURL();
  return fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(handleResponse);
};

export const registerUser = async (email, password, name) => {
  const base = await getBaseURL();
  return fetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  }).then(handleResponse);
};

// User
export const getUser = async () => apiFetch('/users/me');
export const updateUser = async (data) => apiFetch('/users/me', {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
});

// Foods
export const searchFoods = async (query, limit = 20) =>
  apiFetch(`/foods/search?q=${encodeURIComponent(query)}&limit=${limit}`);
export const getFoodSeedStatus = async () => apiFetch('/foods/seed-status');
export const getRecentFoods = async (limit = 25) =>
  apiFetch(`/logs/food/recent?limit=${limit}`);
export const lookupBarcode = async (barcode) => apiFetch(`/barcode/${barcode}`);

// Exercises
export const searchExercises = async (query = '') =>
  apiFetch(`/exercises/search?q=${encodeURIComponent(query)}`);

// Food Logs
export const getFoodLog = async (date) =>
  apiFetch(`/logs/food?date=${date}`);
export const addFoodLog = async (date, food) => apiFetch('/logs/food', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date, food })
});
export const deleteFoodItem = async (logId, itemIndex) =>
  apiFetch(`/logs/food/${logId}/item/${itemIndex}`, { method: 'DELETE' });

// Exercise Logs
export const getExerciseLog = async (date) =>
  apiFetch(`/logs/exercise?date=${date}`);
export const addExerciseLog = async (date, exercise) => apiFetch('/logs/exercise', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date, exercise })
});
export const deleteExerciseItem = async (logId, itemIndex) =>
  apiFetch(`/logs/exercise/${logId}/item/${itemIndex}`, { method: 'DELETE' });

// Weight
export const getWeightLog = async () => apiFetch('/weight');
export const logWeight = async (date, weightKg) => apiFetch('/weight', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date, weightKg })
});
export const deleteWeightEntry = async (id) => apiFetch(`/weight/${id}`, { method: 'DELETE' });

// Water
export const getWaterLog = async (date) =>
  apiFetch(`/water?date=${date}`);
export const addWater = async (date, ml) => apiFetch('/water/add', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date, ml })
});

// Fasting
export const getActiveFasting = async () => apiFetch('/fasting/active');
export const getFastingSessions = async () => apiFetch('/fasting');
export const startFasting = async (targetHours) => apiFetch('/fasting/start', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ targetHours })
});
export const stopFasting = async () => apiFetch('/fasting/stop', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});

// Analytics
export const getCalorieHistory = async (days = 30) =>
  apiFetch(`/analytics/calories?days=${days}`);
export const getStreaks = async () => apiFetch('/analytics/streaks');
export const getWeeklySummary = async (weeks = 8) =>
  apiFetch(`/analytics/weekly?weeks=${weeks}`);

// Measurements
export const getMeasurements = async () => apiFetch('/measurements');
export const saveMeasurement = async (data) => apiFetch('/measurements', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
});
export const deleteMeasurement = async (id) => apiFetch(`/measurements/${id}`, { method: 'DELETE' });

// Custom Foods
export const getCustomFoods = async () => apiFetch('/custom-foods');
export const createCustomFood = async (data) => apiFetch('/custom-foods', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
});
export const deleteCustomFood = async (id) => apiFetch(`/custom-foods/${id}`, { method: 'DELETE' });

// Recipes
export const getRecipes = async () => apiFetch('/recipes');
export const deleteRecipe = async (id) => apiFetch(`/recipes/${id}`, { method: 'DELETE' });

// Gamification
export const getGamificationProfile = async () => apiFetch('/gamification');
export const awardXP = async (action) => apiFetch('/gamification/award', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action })
});
export const getAllBadges = async () => apiFetch('/gamification/badges');
export const claimChallenge = async (challengeId) => apiFetch('/gamification/claim-challenge', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ challengeId })
});
export const useShield = async (date) => apiFetch('/gamification/use-shield', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date })
});
