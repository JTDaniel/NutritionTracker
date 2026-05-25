import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { getStreaks, getGamificationProfile, useShield } from '../utils/api';

const flameEmoji = (days) => {
  if (days >= 30) return '🔥🔥🔥';
  if (days >= 7) return '🔥🔥';
  return '🔥';
};

const STREAK_TYPES = [
  { key: 'logging', label: 'Logging Streak', emoji: '📋', color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-400' },
  { key: 'onTarget', label: 'On-Target Streak', emoji: '🎯', color: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-600 dark:text-green-400' },
  { key: 'exercise', label: 'Exercise Streak', emoji: '🏃', color: 'bg-orange-100 dark:bg-orange-900', textColor: 'text-orange-600 dark:text-orange-400' },
  { key: 'weighIn', label: 'Weigh-in Streak', emoji: '⚖️', color: 'bg-purple-100 dark:bg-purple-900', textColor: 'text-purple-600 dark:text-purple-400' },
];

export default function Streaks() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [streaks, setStreaks] = useState(null);
  const [gamProfile, setGamProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingShield, setUsingShield] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [streakData, gam] = await Promise.all([
        getStreaks(),
        getGamificationProfile(),
      ]);
      setStreaks(streakData);
      setGamProfile(gam);
    } catch (e) {
      console.log('Streaks load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUseShield = () => {
    const today = new Date().toISOString().split('T')[0];
    Alert.alert(
      'Use Shield',
      `Use a shield to protect your streak for today (${today})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Shield', onPress: async () => {
            setUsingShield(true);
            try {
              await useShield(today);
              load();
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally {
              setUsingShield(false);
            }
          }
        }
      ]
    );
  };

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';

  const shields = gamProfile?.shields ?? 0;

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>🔥 Streaks</Text>
        </View>

        {/* Shield card */}
        <View className={`rounded-2xl border p-4 mb-4 flex-row items-center justify-between ${card}`}>
          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">🛡</Text>
            <View>
              <Text className={`font-semibold ${text}`}>{shields} Shield{shields !== 1 ? 's' : ''}</Text>
              <Text className={`text-xs ${muted}`}>Protect your streak for one day</Text>
            </View>
          </View>
          {shields > 0 && (
            <TouchableOpacity
              onPress={handleUseShield}
              disabled={usingShield}
              className="bg-yellow-500 rounded-xl px-4 py-2"
            >
              <Text className="text-white font-semibold text-sm">
                {usingShield ? '...' : 'Use Shield'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View className="items-center py-12">
            <Text className={muted}>Loading...</Text>
          </View>
        ) : (
          <View className="gap-3">
            {STREAK_TYPES.map((type) => {
              const streakData = streaks?.[type.key] || {};
              const current = streakData.current ?? 0;
              const best = streakData.best ?? 0;
              return (
                <View key={type.key} className={`rounded-2xl border p-4 ${card}`}>
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className={`w-10 h-10 rounded-xl items-center justify-center ${type.color}`}>
                        <Text className="text-xl">{type.emoji}</Text>
                      </View>
                      <Text className={`font-semibold ${text}`}>{type.label}</Text>
                    </View>
                    {current > 0 && (
                      <Text className="text-lg">{flameEmoji(current)}</Text>
                    )}
                  </View>
                  <View className="flex-row justify-between">
                    <View className="items-center">
                      <Text className={`text-3xl font-bold ${type.textColor}`}>{current}</Text>
                      <Text className={`text-xs ${muted}`}>Current</Text>
                    </View>
                    <View className="w-px bg-gray-200 dark:bg-gray-600" />
                    <View className="items-center">
                      <Text className={`text-3xl font-bold ${text}`}>{best}</Text>
                      <Text className={`text-xs ${muted}`}>Best</Text>
                    </View>
                  </View>
                  {current === 0 && (
                    <Text className={`text-xs text-center mt-2 ${muted}`}>
                      Log consistently to build your streak!
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
