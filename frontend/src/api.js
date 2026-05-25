// Set VITE_API_URL in Cloudflare Pages environment variables when deploying
// e.g. https://api.yourdomain.com  (no trailing slash)
// Leave unset when running locally via Docker (uses relative /api path)
const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const apiFetch = (path, options = {}) => {
  const token = localStorage.getItem('nt-token');
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BASE_URL}${path}`, { ...options, headers }).then(handleResponse);
};

export const loginUser = (email, password) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(handleResponse);

export const registerUser = (email, password, name) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  }).then(handleResponse);

// User
export const getUser = () =>
  apiFetch('/users/me');

export const updateUser = (data) =>
  apiFetch('/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

// Foods
export const searchFoods = (query, limit = 20) =>
  apiFetch(`/foods/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const getFoodDetail = (fdcId) =>
  apiFetch(`/foods/${fdcId}`);

export const getFoodSeedStatus = () =>
  apiFetch('/foods/seed-status');

// Exercises
export const searchExercises = (query = '') =>
  apiFetch(`/exercises/search?q=${encodeURIComponent(query)}`);

// Food Logs
export const getFoodLog = (date) =>
  apiFetch(`/logs/food?date=${date}`);

export const addFoodLog = (date, food) =>
  apiFetch('/logs/food', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, food })
  });

export const deleteFoodItem = (logId, itemIndex) =>
  apiFetch(`/logs/food/${logId}/item/${itemIndex}`, {
    method: 'DELETE'
  });

// Exercise Logs
export const getExerciseLog = (date) =>
  apiFetch(`/logs/exercise?date=${date}`);

export const addExerciseLog = (date, exercise) =>
  apiFetch('/logs/exercise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, exercise })
  });

export const deleteExerciseItem = (logId, itemIndex) =>
  apiFetch(`/logs/exercise/${logId}/item/${itemIndex}`, {
    method: 'DELETE'
  });

// Weight log
export const getWeightLog = () =>
  apiFetch('/weight');

export const logWeight = (date, weightKg) =>
  apiFetch('/weight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, weightKg })
  });

export const deleteWeightEntry = (id) =>
  apiFetch(`/weight/${id}`, { method: 'DELETE' });

// Recent foods
export const getRecentFoods = (limit = 25) =>
  apiFetch(`/logs/food/recent?limit=${limit}`);

// Health check
export const healthCheck = () =>
  apiFetch('/health');

// Custom Foods
export const getCustomFoods = () =>
  apiFetch('/custom-foods');

export const createCustomFood = (data) =>
  apiFetch('/custom-foods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const updateCustomFood = (id, data) =>
  apiFetch(`/custom-foods/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const deleteCustomFood = (id) =>
  apiFetch(`/custom-foods/${id}`, { method: 'DELETE' });

// Recipes
export const getRecipes = () =>
  apiFetch('/recipes');

export const createRecipe = (data) =>
  apiFetch('/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const updateRecipe = (id, data) =>
  apiFetch(`/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const deleteRecipe = (id) =>
  apiFetch(`/recipes/${id}`, { method: 'DELETE' });

export const getRecipeNutrition = (id) =>
  apiFetch(`/recipes/${id}/nutrition`);

// Barcode
export const lookupBarcode = (barcode) =>
  apiFetch(`/barcode/${barcode}`);

// Analytics
export const getCalorieHistory = (days = 30) =>
  apiFetch(`/analytics/calories?days=${days}`);

export const getWeeklySummary = (weeks = 8) =>
  apiFetch(`/analytics/weekly?weeks=${weeks}`);

export const getStreaks = () =>
  apiFetch('/analytics/streaks');

// Measurements
export const getMeasurements = () =>
  apiFetch('/measurements');

export const saveMeasurement = (data) =>
  apiFetch('/measurements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const deleteMeasurement = (id) =>
  apiFetch(`/measurements/${id}`, { method: 'DELETE' });

// Water
export const getWaterLog = (date) =>
  apiFetch(`/water?date=${date}`);

export const addWater = (date, ml) =>
  apiFetch('/water/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, ml })
  });

export const deleteWaterLog = (id) =>
  apiFetch(`/water/${id}`, { method: 'DELETE' });

// Fasting
export const getFastingSessions = () =>
  apiFetch('/fasting');

export const getActiveFasting = () =>
  apiFetch('/fasting/active');

export const startFasting = (targetHours) =>
  apiFetch('/fasting/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetHours })
  });

export const stopFasting = () =>
  apiFetch('/fasting/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

export const deleteFastingSession = (id) =>
  apiFetch(`/fasting/${id}`, { method: 'DELETE' });

// Gamification
export const getGamificationProfile = () =>
  apiFetch('/gamification');

export const getAllBadges = () =>
  apiFetch('/gamification/badges');

export const awardXP = (action) =>
  apiFetch('/gamification/award', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });

export const useShield = (date) =>
  apiFetch('/gamification/use-shield', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date })
  });

export const claimChallenge = (challengeId) =>
  apiFetch('/gamification/claim-challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId })
  });
