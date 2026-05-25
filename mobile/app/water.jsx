import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { getWaterLog, addWater, awardXP } from '../utils/api';

const fmtDate = (d) => d.toISOString().split('T')[0];
const displayDate = (d) =>
  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const QUICK_AMOUNTS = [250, 350, 500, 750];
const GOAL_ML = 2500;

export default function Water() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [date, setDate] = useState(new Date());
  const [waterLog, setWaterLog] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const data = await getWaterLog(fmtDate(d));
      setWaterLog(data);
    } catch (e) {
      console.log('Water load error:', e.message);
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

  const handleAddWater = async (ml) => {
    if (!ml || ml <= 0) return;
    setAdding(true);
    try {
      await addWater(fmtDate(date), ml);
      const newTotal = (waterLog?.totalMl || 0) + ml;
      if (newTotal >= GOAL_ML && (waterLog?.totalMl || 0) < GOAL_ML) {
        await awardXP('WATER_GOAL_HIT').catch(() => {});
      }
      load(date);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleCustomAdd = async () => {
    const ml = parseFloat(customAmount);
    if (!ml || ml <= 0) return Alert.alert('Invalid', 'Enter a valid amount');
    await handleAddWater(ml);
    setCustomAmount('');
  };

  const totalMl = waterLog?.totalMl || 0;
  const pct = Math.min(100, Math.round((totalMl / GOAL_ML) * 100));

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>💧 Water Tracker</Text>
        </View>

        {/* Date nav */}
        <View className={`flex-row items-center justify-between rounded-2xl border p-3 mb-4 ${card}`}>
          <TouchableOpacity onPress={prevDay} className="px-4 py-2">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`font-semibold ${text}`}>{displayDate(date)}</Text>
          <TouchableOpacity onPress={nextDay} className="px-4 py-2">
            <Text className="text-2xl text-gray-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Progress card */}
        <View className={`rounded-2xl border p-5 mb-4 items-center ${card}`}>
          <Text className="text-5xl mb-3">💧</Text>
          <Text className={`text-4xl font-bold ${pct >= 100 ? 'text-blue-500' : text}`}>
            {totalMl}ml
          </Text>
          <Text className={`text-sm mt-1 mb-4 ${muted}`}>of {GOAL_ML}ml goal</Text>

          <View className="w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
            <View
              className={`h-full rounded-full ${pct >= 100 ? 'bg-blue-500' : 'bg-blue-400'}`}
              style={{ width: `${pct}%` }}
            />
          </View>
          <Text className={`text-sm font-semibold ${pct >= 100 ? 'text-blue-500' : muted}`}>
            {pct >= 100 ? '🎉 Goal reached!' : `${pct}% — ${GOAL_ML - totalMl}ml remaining`}
          </Text>
        </View>

        {/* Quick add buttons */}
        <Text className={`font-semibold mb-3 ${text}`}>Quick Add</Text>
        <View className="flex-row gap-2 mb-4">
          {QUICK_AMOUNTS.map((ml) => (
            <TouchableOpacity
              key={ml}
              onPress={() => handleAddWater(ml)}
              disabled={adding}
              className="flex-1 bg-blue-500 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold text-xs">+{ml}ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom amount */}
        <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
          <Text className={`font-semibold mb-2 ${text}`}>Custom Amount</Text>
          <View className="flex-row gap-2">
            <TextInput
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="Amount in ml"
              placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
              keyboardType="numeric"
              className={`flex-1 border rounded-xl px-3 py-3 text-sm ${inputCls}`}
            />
            <TouchableOpacity
              onPress={handleCustomAdd}
              disabled={adding}
              className="bg-blue-500 rounded-xl px-4 items-center justify-center"
            >
              <Text className="text-white font-semibold">Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's entries */}
        <Text className={`font-semibold mb-3 ${text}`}>Today's Entries</Text>
        {loading ? (
          <View className="items-center py-4">
            <Text className={muted}>Loading...</Text>
          </View>
        ) : (waterLog?.entries || []).length === 0 ? (
          <View className={`rounded-2xl border p-6 items-center ${card}`}>
            <Text className={`text-sm ${muted}`}>No water logged yet — stay hydrated!</Text>
          </View>
        ) : (
          (waterLog.entries || []).map((entry, index) => (
            <View key={index} className={`flex-row items-center justify-between rounded-xl border p-3 mb-2 ${card}`}>
              <Text className="text-2xl">💧</Text>
              <Text className={`flex-1 ml-3 font-semibold ${text}`}>{entry.ml}ml</Text>
              <Text className={`text-xs ${muted}`}>
                {entry.time ? new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
