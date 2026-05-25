import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, useColorScheme, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import { getCalorieHistory, getUser } from '../utils/api';

const screenWidth = Dimensions.get('window').width - 32;

const DAY_OPTIONS = [30, 60, 90];

export default function Analytics() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [days, setDays] = useState(30);
  const [history, setHistory] = useState([]);
  const [target, setTarget] = useState(2000);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const [histData, userData] = await Promise.all([
        getCalorieHistory(d),
        getUser().catch(() => null),
      ]);
      setHistory(histData?.days || histData || []);
      if (userData?.tdee?.recommendedCalories) {
        setTarget(userData.tdee.recommendedCalories);
      }
    } catch (e) {
      console.log('Analytics load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';

  const chartConfig = {
    backgroundGradientFrom: dark ? '#1f2937' : '#ffffff',
    backgroundGradientTo: dark ? '#1f2937' : '#ffffff',
    color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
    labelColor: (opacity = 1) =>
      dark ? `rgba(156,163,175,${opacity})` : `rgba(107,114,128,${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
  };

  // Subsample for chart (max 15 points)
  const chartPoints = history.length > 0
    ? history.filter((_, i) => i % Math.ceil(history.length / 15) === 0 || i === history.length - 1)
    : [];

  const chartData = chartPoints.length >= 2 ? {
    labels: chartPoints.map(d => {
      const dt = new Date(d.date);
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    }),
    datasets: [{
      data: chartPoints.map(d => d.calories || 0),
      color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
    }],
  } : null;

  // Stats
  const loggedDays = history.filter(d => d.calories > 0);
  const avgCalories = loggedDays.length > 0
    ? Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length)
    : 0;
  const daysOnTarget = loggedDays.filter(d => Math.abs(d.calories - target) <= target * 0.1).length;

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>Calorie History</Text>
        </View>

        {/* Day range tabs */}
        <View className="flex-row gap-2 mb-4">
          {DAY_OPTIONS.map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => setDays(d)}
              className={`flex-1 py-2 rounded-xl items-center ${days === d ? 'bg-green-600' : 'bg-gray-100 dark:bg-gray-700'}`}
            >
              <Text className={`font-semibold ${days === d ? 'text-white' : text}`}>{d} days</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View className="items-center py-12">
            <Text className={muted}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Chart */}
            {chartData ? (
              <View className={`rounded-2xl border overflow-hidden mb-4 ${card}`}>
                <Text className={`font-semibold p-4 pb-0 ${text}`}>Daily Calories ({days}d)</Text>
                <LineChart
                  data={chartData}
                  width={screenWidth}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={{ marginTop: 8 }}
                  withInnerLines={false}
                  withDots={chartPoints.length <= 20}
                />
                {/* Target reference */}
                <View className="px-4 pb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="w-4 h-0.5 bg-red-400 border-t border-dashed border-red-400" />
                    <Text className={`text-xs ${muted}`}>Target: {target} kcal/day</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className={`rounded-2xl border p-8 items-center mb-4 ${card}`}>
                <Text className="text-4xl mb-2">📊</Text>
                <Text className={`text-sm ${muted}`}>Not enough data to show chart</Text>
              </View>
            )}

            {/* Summary stats */}
            <View className="flex-row gap-3 mb-4">
              <View className={`flex-1 rounded-2xl border p-4 items-center ${card}`}>
                <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {avgCalories}
                </Text>
                <Text className={`text-xs mt-1 text-center ${muted}`}>Avg kcal/day</Text>
              </View>
              <View className={`flex-1 rounded-2xl border p-4 items-center ${card}`}>
                <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loggedDays.length}
                </Text>
                <Text className={`text-xs mt-1 text-center ${muted}`}>Days logged</Text>
              </View>
              <View className={`flex-1 rounded-2xl border p-4 items-center ${card}`}>
                <Text className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {daysOnTarget}
                </Text>
                <Text className={`text-xs mt-1 text-center ${muted}`}>On target</Text>
              </View>
            </View>

            {/* Day list */}
            <Text className={`font-semibold mb-3 ${text}`}>Daily Breakdown</Text>
            {history.slice(-14).reverse().map((day, index) => {
              const onTarget = Math.abs(day.calories - target) <= target * 0.1;
              const over = day.calories > target * 1.1;
              return (
                <View key={index} className={`flex-row items-center justify-between rounded-xl border p-3 mb-2 ${card}`}>
                  <Text className={`text-sm ${muted}`}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <View className="flex-1 mx-3">
                    <View className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <View
                        className={`h-full rounded-full ${over ? 'bg-red-500' : onTarget ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, Math.round((day.calories / target) * 100))}%` }}
                      />
                    </View>
                  </View>
                  <Text className={`text-sm font-semibold ${text}`}>
                    {day.calories > 0 ? `${day.calories} kcal` : '—'}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </View>
    </ScrollView>
  );
}
