import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import {
  getFoodLog,
  getExerciseLog,
  deleteFoodItem,
  deleteExerciseItem,
} from '../../utils/api';

const fmtDate = (d) => d.toISOString().split('T')[0];
const displayDate = (d) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function LogScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [date, setDate] = useState(new Date());
  const [foodLog, setFoodLog] = useState(null);
  const [exerciseLog, setExerciseLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const dateStr = fmtDate(d);
      const [food, exercise] = await Promise.all([
        getFoodLog(dateStr),
        getExerciseLog(dateStr),
      ]);
      setFoodLog(food);
      setExerciseLog(exercise);
    } catch (e) {
      console.log('Log load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const prevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d);
  };

  const nextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
  };

  const handleDeleteFood = (index) => {
    if (!foodLog?._id) return;
    Alert.alert('Delete Item', 'Remove this food from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteFoodItem(foodLog._id, index);
            load(date);
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  const handleDeleteExercise = (index) => {
    if (!exerciseLog?._id) return;
    Alert.alert('Delete Item', 'Remove this exercise from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteExerciseItem(exerciseLog._id, index);
            load(date);
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  const totals = foodLog?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const exerciseCalories = (exerciseLog?.items || []).reduce((s, i) => s + (i.caloriesBurned || 0), 0);
  const netCalories = Math.round(totals.calories - exerciseCalories);

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        {/* Header */}
        <Text className={`text-2xl font-bold mb-4 ${text}`}>Daily Log</Text>

        {/* Date picker */}
        <View className={`flex-row items-center justify-between rounded-2xl border p-3 mb-4 ${card}`}>
          <TouchableOpacity onPress={prevDay} className="px-4 py-2">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`font-semibold text-base ${text}`}>{displayDate(date)}</Text>
          <TouchableOpacity onPress={nextDay} className="px-4 py-2">
            <Text className="text-2xl text-gray-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Macro summary */}
        <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
          <Text className={`text-sm font-semibold mb-3 ${muted}`}>Summary</Text>
          <View className="flex-row justify-between mb-3">
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round(totals.calories)}
              </Text>
              <Text className={`text-xs ${muted}`}>Eaten</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-orange-500">
                {Math.round(exerciseCalories)}
              </Text>
              <Text className={`text-xs ${muted}`}>Burned</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {netCalories}
              </Text>
              <Text className={`text-xs ${muted}`}>Net</Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="font-semibold text-blue-600 dark:text-blue-400">{Math.round(totals.protein)}g</Text>
              <Text className={`text-xs ${muted}`}>Protein</Text>
            </View>
            <View className="items-center">
              <Text className="font-semibold text-yellow-600 dark:text-yellow-400">{Math.round(totals.carbs)}g</Text>
              <Text className={`text-xs ${muted}`}>Carbs</Text>
            </View>
            <View className="items-center">
              <Text className="font-semibold text-red-500 dark:text-red-400">{Math.round(totals.fat)}g</Text>
              <Text className={`text-xs ${muted}`}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Food section */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`text-lg font-bold ${text}`}>🍽 Food</Text>
          <TouchableOpacity onPress={() => router.push('/food-search')}
            className="bg-green-600 rounded-xl px-4 py-2">
            <Text className="text-white font-semibold text-sm">+ Add Food</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="items-center py-8">
            <Text className={muted}>Loading...</Text>
          </View>
        ) : (foodLog?.items || []).length === 0 ? (
          <View className={`rounded-2xl border p-6 items-center mb-4 ${card}`}>
            <Text className="text-3xl mb-2">🥗</Text>
            <Text className={`text-sm ${muted}`}>No food logged yet</Text>
          </View>
        ) : (
          <View className="mb-4">
            {(foodLog.items || []).map((item, index) => (
              <View key={index} className={`rounded-xl border p-3 mb-2 flex-row items-start justify-between ${card}`}>
                <View className="flex-1 mr-3">
                  <Text className={`font-medium text-sm ${text}`} numberOfLines={1}>{item.name}</Text>
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    <Text className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {Math.round(item.calories || 0)} kcal
                    </Text>
                    <Text className={`text-xs ${muted}`}>{item.servingSize || 100}g</Text>
                    <Text className="text-xs text-blue-600 dark:text-blue-400">P:{Math.round(item.protein || 0)}g</Text>
                    <Text className="text-xs text-yellow-600 dark:text-yellow-400">C:{Math.round(item.carbs || 0)}g</Text>
                    <Text className="text-xs text-red-500 dark:text-red-400">F:{Math.round(item.fat || 0)}g</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteFood(index)}
                  className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg items-center justify-center">
                  <Text className="text-red-600 dark:text-red-400 text-sm">✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Exercise section */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`text-lg font-bold ${text}`}>🏃 Exercise</Text>
          <TouchableOpacity onPress={() => router.push('/exercise-search')}
            className="bg-orange-500 rounded-xl px-4 py-2">
            <Text className="text-white font-semibold text-sm">+ Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {(exerciseLog?.items || []).length === 0 ? (
          <View className={`rounded-2xl border p-6 items-center mb-4 ${card}`}>
            <Text className="text-3xl mb-2">🏋️</Text>
            <Text className={`text-sm ${muted}`}>No exercise logged yet</Text>
          </View>
        ) : (
          <View className="mb-4">
            {(exerciseLog.items || []).map((item, index) => (
              <View key={index} className={`rounded-xl border p-3 mb-2 flex-row items-start justify-between ${card}`}>
                <View className="flex-1 mr-3">
                  <Text className={`font-medium text-sm ${text}`} numberOfLines={1}>{item.name}</Text>
                  <View className="flex-row gap-2 mt-1">
                    <Text className="text-sm font-semibold text-orange-500">
                      {Math.round(item.caloriesBurned || 0)} kcal burned
                    </Text>
                    <Text className={`text-xs ${muted}`}>{item.duration || 0} min</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteExercise(index)}
                  className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg items-center justify-center">
                  <Text className="text-red-600 dark:text-red-400 text-sm">✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
