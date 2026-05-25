import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, useColorScheme, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import { getWeightLog, logWeight, deleteWeightEntry, awardXP } from '../utils/api';

const screenWidth = Dimensions.get('window').width - 32;
const today = () => new Date().toISOString().split('T')[0];

export default function Weight() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [entries, setEntries] = useState([]);
  const [weightInput, setWeightInput] = useState('');
  const [unit, setUnit] = useState('kg'); // 'kg' or 'lbs'
  const [dateInput, setDateInput] = useState(today());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWeightLog();
      setEntries(data?.entries || []);
    } catch (e) {
      console.log('Weight load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLog = async () => {
    const val = parseFloat(weightInput);
    if (!val || val <= 0) return Alert.alert('Invalid', 'Please enter a valid weight');
    setSaving(true);
    try {
      const weightKg = unit === 'lbs' ? val * 0.453592 : val;
      await logWeight(dateInput, weightKg);
      await awardXP('WEIGH_IN').catch(() => {});
      setWeightInput('');
      load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Entry', 'Remove this weight entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteWeightEntry(id);
            load();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  const chartConfig = {
    backgroundGradientFrom: dark ? '#1f2937' : '#ffffff',
    backgroundGradientTo: dark ? '#1f2937' : '#ffffff',
    color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
    labelColor: (opacity = 1) =>
      dark ? `rgba(156,163,175,${opacity})` : `rgba(107,114,128,${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 1,
  };

  // Chart data: last 14 entries, oldest first
  const chartEntries = [...entries].reverse().slice(-14);
  const chartData = chartEntries.length >= 2 ? {
    labels: chartEntries.map(e => {
      const d = new Date(e.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    datasets: [{
      data: chartEntries.map(e =>
        unit === 'lbs' ? parseFloat((e.weightKg * 2.20462).toFixed(1)) : parseFloat(e.weightKg.toFixed(1))
      ),
    }],
  } : null;

  const displayWeight = (kg) =>
    unit === 'lbs' ? `${(kg * 2.20462).toFixed(1)} lbs` : `${kg.toFixed(1)} kg`;

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>Weight Tracker</Text>
        </View>

        {/* Latest weight */}
        {entries.length > 0 && (
          <View className="bg-green-600 rounded-2xl p-5 mb-4 items-center">
            <Text className="text-green-200 text-sm">Latest Weight</Text>
            <Text className="text-white text-4xl font-bold mt-1">
              {displayWeight(entries[0].weightKg)}
            </Text>
            <Text className="text-green-200 text-xs mt-1">
              {new Date(entries[0].date).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Log form */}
        <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
          <Text className={`font-semibold mb-3 ${text}`}>Log Weight</Text>

          <View className="flex-row gap-2 mb-3">
            {['kg', 'lbs'].map(u => (
              <TouchableOpacity
                key={u}
                onPress={() => setUnit(u)}
                className={`flex-1 py-2 rounded-xl items-center ${unit === u ? 'bg-green-600' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                <Text className={`font-semibold ${unit === u ? 'text-white' : text}`}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder={`Weight in ${unit}`}
            placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
            keyboardType="decimal-pad"
            className={`border rounded-xl px-3 py-3 text-sm mb-3 ${inputCls}`}
          />

          <TextInput
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
            className={`border rounded-xl px-3 py-3 text-sm mb-3 ${inputCls}`}
          />

          <TouchableOpacity
            onPress={handleLog}
            disabled={saving}
            className="bg-green-600 rounded-xl py-3 items-center"
          >
            <Text className="text-white font-semibold">{saving ? 'Saving...' : 'Log Weight'}</Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        {chartData && (
          <View className={`rounded-2xl border overflow-hidden mb-4 ${card}`}>
            <Text className={`font-semibold p-4 pb-0 ${text}`}>Weight History</Text>
            <LineChart
              data={chartData}
              width={screenWidth}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={{ marginTop: 8 }}
              withInnerLines={false}
            />
          </View>
        )}

        {/* Recent entries */}
        <Text className={`font-semibold mb-3 ${text}`}>Recent Entries</Text>
        {loading ? (
          <View className="items-center py-6">
            <Text className={muted}>Loading...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View className={`rounded-2xl border p-6 items-center ${card}`}>
            <Text className="text-3xl mb-2">⚖️</Text>
            <Text className={`text-sm ${muted}`}>No weight entries yet</Text>
          </View>
        ) : (
          entries.slice(0, 10).map((entry) => (
            <View key={entry._id} className={`flex-row items-center justify-between rounded-xl border p-3 mb-2 ${card}`}>
              <View>
                <Text className={`font-semibold ${text}`}>{displayWeight(entry.weightKg)}</Text>
                <Text className={`text-xs ${muted}`}>{new Date(entry.date).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(entry._id)}
                className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg items-center justify-center"
              >
                <Text className="text-red-600 dark:text-red-400 text-sm">✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
