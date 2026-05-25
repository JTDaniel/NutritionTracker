import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUser, getFoodLog, getExerciseLog, getWeightLog, getStreaks } from '../api.js';
import MacroBar from '../components/MacroBar.jsx';
import WaterWidget from '../components/WaterWidget.jsx';
import FastingWidget from '../components/FastingWidget.jsx';
import LevelCard from '../components/LevelCard.jsx';
import ChallengesWidget from '../components/ChallengesWidget.jsx';

const kgToLbs = (kg) => +(kg * 2.20462).toFixed(1);

const today = () => new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [foodLog, setFoodLog] = useState(null);
  const [exerciseLog, setExerciseLog] = useState(null);
  const [weightEntries, setWeightEntries] = useState([]);
  const [streaks, setStreaks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const date = today();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userData, foodData, exerciseData, weightData, streaksData] = await Promise.all([
        getUser(),
        getFoodLog(date),
        getExerciseLog(date),
        getWeightLog(),
        getStreaks().catch(() => null)
      ]);
      setUser(userData);
      setFoodLog(foodData);
      setExerciseLog(exerciseData);
      setWeightEntries(weightData.entries || []);
      setStreaks(streaksData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tdee = user?.tdee;
  const calorieTarget = tdee?.targets?.lose_one_lb || tdee?.tdee || 2000;
  const consumed = foodLog?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const exerciseCalories = exerciseLog?.totalCaloriesBurned || 0;
  const netCalories = Math.round(consumed.calories - exerciseCalories);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-center py-8">
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load dashboard</p>
        <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>
        <button onClick={loadData} className="btn-primary">Retry</button>
      </div>
    );
  }

  const isProfileComplete = user?.name && user?.weightKg && user?.heightCm;

  return (
    <div className="space-y-5">
      {/* Gamification widgets */}
      <LevelCard />
      <ChallengesWidget />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.name ? `Good day, ${user.name}!` : 'Dashboard'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/log" className="btn-secondary text-sm">View Log</Link>
      </div>

      {/* Profile incomplete notice */}
      {!isProfileComplete && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">Complete your profile</p>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-0.5">
                Set up your profile to get accurate TDEE and calorie targets.
              </p>
              <Link to="/profile" className="inline-block mt-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 underline">
                Go to Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Calorie Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Target</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{Math.round(calorieTarget)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Consumed</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{Math.round(consumed.calories)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Burned</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-500">{exerciseCalories}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Net</p>
          <p className={`text-xl sm:text-2xl font-bold ${netCalories > calorieTarget ? 'text-red-600' : 'text-blue-600'}`}>
            {netCalories}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
        </div>
      </div>

      {/* Macro Progress */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Nutrition</h2>
        <MacroBar consumed={consumed} calorieTarget={calorieTarget} />
      </div>

      {/* TDEE Summary */}
      {tdee && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Calorie Targets</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">BMR</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{tdee.bmr} kcal</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Base metabolic rate</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">TDEE (Maintain)</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{tdee.tdee} kcal</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Total daily expenditure</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Weight Loss Targets</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">0.5 lb/week</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">{tdee.targets.lose_half_lb} kcal</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">1 lb/week</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">{tdee.targets.lose_one_lb} kcal</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">1.5 lb/week</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">{tdee.targets.lose_one_half_lb} kcal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Food summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Food Log</h2>
            <Link to="/search/food" className="text-sm text-green-600 hover:text-green-700 font-medium">+ Add Food</Link>
          </div>
          {foodLog?.foods?.length > 0 ? (
            <div className="space-y-1.5">
              {foodLog.foods.slice(0, 4).map((food, i) => {
                const multiplier = (food.servingSize || 100) / 100;
                return (
                  <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-gray-700 dark:text-gray-200 truncate flex-1">{food.name}</span>
                    <span className="text-green-700 dark:text-green-400 font-medium ml-2 flex-shrink-0">
                      {Math.round((food.calories || 0) * multiplier)} kcal
                    </span>
                  </div>
                );
              })}
              {foodLog.foods.length > 4 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">+{foodLog.foods.length - 4} more items</p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No foods logged today</p>
              <Link to="/search/food" className="mt-2 inline-block text-sm text-green-600 hover:underline">
                Search & add foods
              </Link>
            </div>
          )}
        </div>

        {/* Exercise summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Exercise Log</h2>
            <Link to="/search/exercise" className="text-sm text-green-600 hover:text-green-700 font-medium">+ Add Exercise</Link>
          </div>
          {exerciseLog?.exercises?.length > 0 ? (
            <div className="space-y-1.5">
              {exerciseLog.exercises.slice(0, 4).map((ex, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <span className="text-gray-700 dark:text-gray-200">{ex.name}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({ex.durationMinutes} min)</span>
                  </div>
                  <span className="text-orange-600 dark:text-orange-400 font-medium ml-2 flex-shrink-0">
                    -{ex.caloriesBurned} kcal
                  </span>
                </div>
              ))}
              {exerciseLog.exercises.length > 4 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">+{exerciseLog.exercises.length - 4} more exercises</p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No exercises logged today</p>
              <Link to="/search/exercise" className="mt-2 inline-block text-sm text-green-600 hover:underline">
                Search & add exercises
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Weight Summary */}
      {(() => {
        const latest = weightEntries[weightEntries.length - 1];
        const prev = weightEntries[weightEntries.length - 2];
        const goalKg = user?.goalWeightKg;
        const diff = latest && prev ? kgToLbs(latest.weightKg) - kgToLbs(prev.weightKg) : null;
        const toGoal = latest && goalKg ? kgToLbs(latest.weightKg) - kgToLbs(goalKg) : null;
        return (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Weight</h2>
              <Link to="/weight" className="text-sm text-green-600 hover:text-green-700 font-medium">Track →</Link>
            </div>
            {latest ? (
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{kgToLbs(latest.weightKg)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">lbs · {new Date(latest.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                {diff != null && (
                  <div>
                    <p className={`text-lg font-semibold ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} lbs
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">since last entry</p>
                  </div>
                )}
                {toGoal != null && (
                  <div>
                    <p className={`text-lg font-semibold ${Math.abs(toGoal) < 2 ? 'text-green-600' : 'text-purple-600 dark:text-purple-400'}`}>
                      {toGoal > 0 ? '-' : '+'}{Math.abs(toGoal).toFixed(1)} lbs
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">to goal</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-400 dark:text-gray-500 text-sm">No weigh-ins yet</p>
                <Link to="/weight" className="text-sm text-green-600 hover:underline">Log weight →</Link>
              </div>
            )}
          </div>
        );
      })()}

      {/* Water & Fasting Widgets */}
      <div className="grid md:grid-cols-2 gap-4">
        <WaterWidget />
        <FastingWidget />
      </div>

      {/* Streaks Summary */}
      {streaks && (streaks.logging?.current > 0 || streaks.onTarget?.current > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Streaks</h2>
            <Link to="/streaks" className="text-sm text-green-600 hover:text-green-700 font-medium">View All →</Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {streaks.logging?.current > 0 && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <span>📋</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{streaks.logging.current}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">day logging streak</span>
                {streaks.logging.current >= 7 && <span>🔥</span>}
              </div>
            )}
            {streaks.onTarget?.current > 0 && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <span>🎯</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{streaks.onTarget.current}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">days on target</span>
                {streaks.onTarget.current >= 7 && <span>🔥</span>}
              </div>
            )}
            {streaks.exercise?.current > 0 && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <span>🏃</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{streaks.exercise.current}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">day exercise streak</span>
                {streaks.exercise.current >= 7 && <span>🔥</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/search/food"
          className="card hover:shadow-md transition-shadow flex items-center gap-3 cursor-pointer hover:border-green-200 dark:hover:border-green-700"
        >
          <span className="text-3xl">🥗</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Log Food</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Search USDA database</p>
          </div>
        </Link>
        <Link
          to="/search/exercise"
          className="card hover:shadow-md transition-shadow flex items-center gap-3 cursor-pointer hover:border-green-200 dark:hover:border-green-700"
        >
          <span className="text-3xl">🏃</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Log Exercise</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Track your workouts</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
