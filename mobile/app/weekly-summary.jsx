import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, useColorScheme, Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import { getWeeklySummary, getUser } from '../utils/api';

const screenWidth = Dimensions.get('window').width - 32;

export default function WeeklySummary() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [weeks, setWeeks] = useState([]);
  const [target, setTarget] = useState(2000);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, userData] = await Promise.all([
        getWeeklySummary(8),
        getUser().catch(() => null),
      ]);
      setWeeks(summary?.weeks || summary || []);
      if (userData?.tdee?.recommendedCalories) setTarget(userData.tdee.recommendedCalories);
    } catch (e) {
      console.log('Weekly summary error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const displayWeeks = weeks.slice(-8);
  const chartData = displayWeeks.length >= 2 ? {
    labels: displayWeeks.map((w, i) => `W${i + 1}`),
    datasets: [{ data: displayWeeks.map(w => w.avgCalories || 0) }],
  } : null;

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>Weekly Summary</Text>
        </View>

        {loading ? (
          <View className="items-center py-12">
            <Text className={muted}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Bar chart */}
            {chartData ? (
              <View className={`rounded-2xl border overflow-hidden mb-4 ${card}`}>
                <Text className={`font-semibold p-4 pb-0 ${text}`}>Avg Calories per Week</Text>
                <BarChart
                  data={chartData}
                  width={screenWidth}
                  height={200}
                  chartConfig={chartConfig}
                  style={{ marginTop: 8 }}
                  withInnerLines={false}
                  showBarTops={false}
                  fromZero
                />
              </View>
            ) : (
              <View className={`rounded-2xl border p-8 items-center mb-4 ${card}`}>
                <Text className="text-4xl mb-2">📅</Text>
                <Text className={`text-sm ${muted}`}>Log food for multiple weeks to see trends</Text>
              </View>
            )}

            {/* Weekly rows */}
            <Text className={`font-semibold mb-3 ${text}`}>Weekly Breakdown</Text>
            {weeks.length === 0 ? (
              <View className={`rounded-2xl border p-6 items-center ${card}`}>
                <Text className={`text-sm ${muted}`}>No weekly data yet</Text>
              </View>
            ) : (
              [...weeks].reverse().map((week, index) => {
                const onTarget = Math.abs(week.avgCalories - target) <= target * 0.1;
                const over = week.avgCalories > target * 1.1;
                const startDate = week.weekStart
                  ? new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : `Week ${index + 1}`;
                return (
                  <View key={index} className={`rounded-xl border p-4 mb-3 ${card}`}>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className={`font-semibold ${text}`}>{startDate}</Text>
                      <View className={`px-2 py-0.5 rounded ${
                        over ? 'bg-red-100 dark:bg-red-900' :
                        onTarget ? 'bg-green-100 dark:bg-green-900' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          over ? 'text-red-600 dark:text-red-400' :
                          onTarget ? 'text-green-700 dark:text-green-400' :
                          muted
                        }`}>
                          {over ? 'Over' : onTarget ? 'On Track' : 'Under'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between">
                      <View className="items-center">
                        <Text className={`font-bold text-base ${text}`}>{week.avgCalories || 0}</Text>
                        <Text className={`text-xs ${muted}`}>avg kcal</Text>
                      </View>
                      <View className="items-center">
                        <Text className={`font-bold text-base ${text}`}>{week.daysLogged || 0}/7</Text>
                        <Text className={`text-xs ${muted}`}>days logged</Text>
                      </View>
                      <View className="items-center">
                        <Text className={`font-bold text-base ${text}`}>{week.daysOnTarget || 0}</Text>
                        <Text className={`text-xs ${muted}`}>on target</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
