import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { getWeightLog, getStreaks, getGamificationProfile } from '../../utils/api';

export default function ProgressHub() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [weightLog, setWeightLog] = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [gamProfile, setGamProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [weights, streakData, gam] = await Promise.all([
        getWeightLog(),
        getStreaks(),
        getGamificationProfile(),
      ]);
      setWeightLog(weights);
      setStreaks(streakData);
      setGamProfile(gam);
    } catch (e) {
      console.log('Progress load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';

  const latestWeight = weightLog?.entries?.[0]?.weightKg;
  const loggingStreak = streaks?.logging?.current ?? 0;

  const sections = [
    {
      emoji: '⚖️',
      label: 'Weight Tracker',
      route: '/weight',
      stat: latestWeight ? `Latest: ${latestWeight.toFixed(1)} kg` : 'No entries yet',
      color: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      emoji: '📊',
      label: 'Calorie History',
      route: '/analytics',
      stat: gamProfile ? `Level ${gamProfile.level} · ${gamProfile.xp} XP` : 'View analytics',
      color: 'bg-green-100 dark:bg-green-900',
    },
    {
      emoji: '📏',
      label: 'Body Measurements',
      route: '/measurements',
      stat: 'Track your body measurements',
      color: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      emoji: '📅',
      label: 'Weekly Summary',
      route: '/weekly-summary',
      stat: 'View weekly averages',
      color: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      emoji: '🔥',
      label: 'Streaks',
      route: '/streaks',
      stat: loggingStreak > 0 ? `Logging streak: ${loggingStreak} days` : 'Start your streak!',
      color: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <Text className={`text-2xl font-bold mb-1 ${text}`}>Progress</Text>
        <Text className={`text-sm mb-6 ${muted}`}>Track your health journey</Text>

        {sections.map((section) => (
          <TouchableOpacity
            key={section.route}
            onPress={() => router.push(section.route)}
            className={`rounded-2xl border p-4 mb-4 flex-row items-center ${card}`}
          >
            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${section.color}`}>
              <Text className="text-2xl">{section.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className={`font-semibold text-base ${text}`}>{section.label}</Text>
              <Text className={`text-sm mt-0.5 ${muted}`}>{section.stat}</Text>
            </View>
            <Text className={`text-2xl ${muted}`}>›</Text>
          </TouchableOpacity>
        ))}

        {!loading && gamProfile && (
          <TouchableOpacity
            onPress={() => router.push('/badges')}
            className="rounded-2xl bg-indigo-600 p-4 flex-row items-center"
          >
            <View className="w-12 h-12 bg-indigo-500 rounded-xl items-center justify-center mr-4">
              <Text className="text-2xl">🏆</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-base text-white">Badge Collection</Text>
              <Text className="text-sm text-indigo-200 mt-0.5">
                {gamProfile.badges?.length ?? 0} badges earned
              </Text>
            </View>
            <Text className="text-2xl text-indigo-300">›</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
