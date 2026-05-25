import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getFoodLog, getExerciseLog, deleteFoodItem, deleteExerciseItem, getUser } from '../api.js';
import DatePicker from '../components/DatePicker.jsx';
import FoodCard from '../components/FoodCard.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import MacroBar from '../components/MacroBar.jsx';
import { getDiet, getDietDailyMetrics } from '../utils/dietUtils.js';

export default function DailyLog() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodLog, setFoodLog] = useState(null);
  const [exerciseLog, setExerciseLog] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('food');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [foodData, exerciseData, userData] = await Promise.all([
        getFoodLog(date),
        getExerciseLog(date),
        getUser()
      ]);
      setFoodLog(foodData);
      setExerciseLog(exerciseData);
      setUser(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteFood = async (index) => {
    if (!foodLog?._id) return;
    try {
      const updated = await deleteFoodItem(foodLog._id, index);
      const totals = (updated.foods || []).reduce((acc, food) => {
        const multiplier = (food.servingSize || 100) / 100;
        acc.calories += (food.calories || 0) * multiplier;
        acc.protein += (food.protein || 0) * multiplier;
        acc.carbs += (food.carbs || 0) * multiplier;
        acc.fat += (food.fat || 0) * multiplier;
        acc.fiber += (food.fiber || 0) * multiplier;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
      Object.keys(totals).forEach(k => { totals[k] = Math.round(totals[k] * 10) / 10; });
      setFoodLog({ ...updated, totals });
    } catch (err) {
      alert('Failed to delete food item: ' + err.message);
    }
  };

  const handleDeleteExercise = async (index) => {
    if (!exerciseLog?._id) return;
    try {
      const updated = await deleteExerciseItem(exerciseLog._id, index);
      const totalCaloriesBurned = (updated.exercises || []).reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
      setExerciseLog({ ...updated, totalCaloriesBurned });
    } catch (err) {
      alert('Failed to delete exercise item: ' + err.message);
    }
  };

  const calorieTarget = user?.tdee?.targets?.lose_one_lb || user?.tdee?.tdee || 2000;
  const consumed = foodLog?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const exerciseBurned = exerciseLog?.totalCaloriesBurned || 0;
  const dietType = localStorage.getItem('nt-diet') || 'none';
  const diet = getDiet(dietType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Log</h1>
        <DatePicker date={date} onChange={setDate} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading log...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-center py-6">
          <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
          <button onClick={loadData} className="btn-primary">Retry</button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consumed</p>
              <p className="text-xl font-bold text-green-600">{Math.round(consumed.calories)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">kcal</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Burned</p>
              <p className="text-xl font-bold text-orange-500">{exerciseBurned}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">kcal</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net</p>
              <p className={`text-xl font-bold ${(consumed.calories - exerciseBurned) > calorieTarget ? 'text-red-600' : 'text-blue-600'}`}>
                {Math.round(consumed.calories - exerciseBurned)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">kcal</p>
            </div>
          </div>

          {/* Macro progress */}
          <div className="card">
            <MacroBar consumed={consumed} calorieTarget={calorieTarget} />
          </div>

          {/* Diet metrics */}
          {(() => {
            const metrics = getDietDailyMetrics(foodLog?.foods || [], diet, user?.tdee?.recommendedCalories);
            if (!metrics || metrics.length === 0) return null;
            return (
              <div className="card mt-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {diet.icon} {diet.name} Metrics
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {metrics.map(m => (
                    <div key={m.label} className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                      <p className={`text-base font-bold ${
                        m.color === 'green' ? 'text-green-600 dark:text-green-400' :
                        m.color === 'red' ? 'text-red-500 dark:text-red-400' :
                        m.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}>
                        {m.value}<span className="text-xs font-normal ml-0.5">{m.unit}</span>
                      </p>
                      {m.limit && m.unit !== '%' && (
                        <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${m.color === 'red' ? 'bg-red-500' : m.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, Math.round((m.value / m.limit) * 100))}%` }}
                          />
                        </div>
                      )}
                      {m.unit === '%' && m.target && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">target {m.target}%</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('food')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'food'
                  ? 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Food ({foodLog?.foods?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('exercise')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'exercise'
                  ? 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Exercise ({exerciseLog?.exercises?.length || 0})
            </button>
          </div>

          {/* Food tab */}
          {activeTab === 'food' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Food Entries</h2>
                <Link to="/search/food" className="btn-primary text-sm py-1.5 px-3">+ Add Food</Link>
              </div>

              {foodLog?.foods?.length > 0 ? (
                <div className="space-y-2">
                  {foodLog.foods.map((food, i) => (
                    <FoodCard
                      key={i}
                      food={food}
                      index={i}
                      onDelete={handleDeleteFood}
                    />
                  ))}

                  {/* Daily totals */}
                  <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 mt-3">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">Daily Totals</p>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[
                        { label: 'Calories', value: Math.round(consumed.calories), unit: 'kcal' },
                        { label: 'Protein', value: Math.round(consumed.protein), unit: 'g' },
                        { label: 'Carbs', value: Math.round(consumed.carbs), unit: 'g' },
                        { label: 'Fat', value: Math.round(consumed.fat), unit: 'g' },
                        { label: 'Fiber', value: Math.round(consumed.fiber), unit: 'g' }
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                          <p className="font-bold text-green-800 dark:text-green-300">{item.value}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{item.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-10">
                  <p className="text-4xl mb-3">🥗</p>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No foods logged for this day</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-4">Start tracking your nutrition</p>
                  <Link to="/search/food" className="btn-primary">Search Foods</Link>
                </div>
              )}
            </div>
          )}

          {/* Exercise tab */}
          {activeTab === 'exercise' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Exercise Entries</h2>
                <Link to="/search/exercise" className="btn-primary text-sm py-1.5 px-3">+ Add Exercise</Link>
              </div>

              {exerciseLog?.exercises?.length > 0 ? (
                <div className="space-y-2">
                  {exerciseLog.exercises.map((ex, i) => (
                    <ExerciseCard
                      key={i}
                      exercise={ex}
                      index={i}
                      onDelete={handleDeleteExercise}
                    />
                  ))}

                  <div className="card bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 mt-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Total Exercise</p>
                      <div className="text-right">
                        <p className="font-bold text-orange-700 dark:text-orange-400">{exerciseBurned} kcal burned</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {exerciseLog.exercises.reduce((s, e) => s + (e.durationMinutes || 0), 0)} min total
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-10">
                  <p className="text-4xl mb-3">🏃</p>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No exercises logged for this day</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-4">Track your workouts</p>
                  <Link to="/search/exercise" className="btn-primary">Search Exercises</Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
