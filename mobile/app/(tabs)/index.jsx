import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { getFoodLog, getUser, getGamificationProfile, getWaterLog } from '../../utils/api';

const today = () => new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [foodLog, setFoodLog] = useState(null);
  const [user, setUser] = useState(null);
  const [gamProfile, setGamProfile] = useState(null);
  const [waterLog, setWaterLog] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const dateStr = today();
      const [food, userData, gam, water] = await Promise.all([
        getFoodLog(dateStr),
        getUser(),
        getGamificationProfile(),
        getWaterLog(dateStr),
      ]);
      setFoodLog(food);
      setUser(userData);
      setGamProfile(gam);
      setWaterLog(water);
    } catch (e) {
      console.log('Dashboard load error:', e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totals = foodLog?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const target = user?.tdee?.recommendedCalories || 2000;
  const calPct = Math.min(100, Math.round((totals.calories / target) * 100));
  const waterMl = waterLog?.totalMl || 0;
  const waterPct = Math.min(100, Math.round((waterMl / 2500) * 100));

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';

  const xpPct = (() => {
    if (!gamProfile) return 0;
    const { xp, xpForCurrentLevel, xpForNextLevel } = gamProfile;
    if (!xpForNextLevel || xpForNextLevel <= xpForCurrentLevel) return 100;
    return Math.round(((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100);
  })();

  return (
    <ScrollView
      className={`flex-1 ${bg}`}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-4 pt-12 pb-6 space-y-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              🥦 NutritionTracker
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
            <Text className="text-lg">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Level card */}
        {gamProfile && (
          <TouchableOpacity onPress={() => router.push('/badges')}
            className="rounded-2xl p-4 bg-indigo-600 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-indigo-200 text-xs">Level {gamProfile.level}</Text>
                <Text className="text-white font-bold text-lg">{gamProfile.title}</Text>
              </View>
              <View className="items-end">
                <Text className="text-indigo-200 text-xs">Total XP</Text>
                <Text className="text-white font-bold text-xl">{gamProfile.xp}</Text>
              </View>
            </View>
            <View className="h-2 bg-indigo-800 rounded-full overflow-hidden">
              <View className="h-full bg-yellow-400 rounded-full" style={{ width: `${xpPct}%` }} />
            </View>
          </TouchableOpacity>
        )}

        {/* Calories card */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/log')}
          className={`rounded-2xl p-4 border mb-4 ${card}`}>
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Today's Calories</Text>
          <View className="flex-row items-end justify-between mb-2">
            <Text className="text-4xl font-bold text-green-600 dark:text-green-400">
              {Math.round(totals.calories)}
            </Text>
            <Text className="text-gray-400 dark:text-gray-500 mb-1">/ {target} kcal</Text>
          </View>
          <View className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${calPct > 110 ? 'bg-red-500' : calPct > 90 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${calPct}%` }}
            />
          </View>
          <View className="flex-row justify-between mt-3">
            {[
              { label: 'Protein', val: totals.protein, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Carbs', val: totals.carbs, color: 'text-yellow-600 dark:text-yellow-400' },
              { label: 'Fat', val: totals.fat, color: 'text-red-500 dark:text-red-400' },
            ].map(m => (
              <View key={m.label} className="items-center">
                <Text className={`text-base font-bold ${m.color}`}>{Math.round(m.val)}g</Text>
                <Text className="text-xs text-gray-400 dark:text-gray-500">{m.label}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Water card */}
        <TouchableOpacity onPress={() => router.push('/water')}
          className={`rounded-2xl p-4 border mb-4 ${card}`}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">💧 Water</Text>
            <Text className="text-blue-600 dark:text-blue-400 font-semibold">{waterMl}ml / 2500ml</Text>
          </View>
          <View className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <View className="h-full bg-blue-500 rounded-full" style={{ width: `${waterPct}%` }} />
          </View>
        </TouchableOpacity>

        {/* Quick actions */}
        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2 mb-3">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-3">
          {[
            { label: 'Log Food', emoji: '🥗', route: '/food-search' },
            { label: 'Log Exercise', emoji: '🏃', route: '/exercise-search' },
            { label: 'Weigh In', emoji: '⚖️', route: '/weight' },
            { label: 'Barcode', emoji: '📷', route: '/barcode' },
          ].map(a => (
            <TouchableOpacity key={a.label} onPress={() => router.push(a.route)}
              className={`flex-1 min-w-[45%] rounded-xl p-3 border items-center ${card}`}>
              <Text className="text-2xl">{a.emoji}</Text>
              <Text className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
