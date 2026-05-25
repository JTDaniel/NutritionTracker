import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, useColorScheme, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import { getMeasurements, saveMeasurement, deleteMeasurement } from '../utils/api';

const screenWidth = Dimensions.get('window').width - 32;
const today = () => new Date().toISOString().split('T')[0];

const FIELDS = [
  { key: 'waist', label: 'Waist (cm)' },
  { key: 'hips', label: 'Hips (cm)' },
  { key: 'chest', label: 'Chest (cm)' },
  { key: 'neck', label: 'Neck (cm)' },
  { key: 'leftArm', label: 'Left Arm (cm)' },
  { key: 'rightArm', label: 'Right Arm (cm)' },
];

export default function Measurements() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ waist: '', hips: '', chest: '', neck: '', leftArm: '', rightArm: '' });
  const [dateInput, setDateInput] = useState(today());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMeasurements();
      setEntries(data?.measurements || data || []);
    } catch (e) {
      console.log('Measurements load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    const anyFilled = FIELDS.some(f => form[f.key].trim());
    if (!anyFilled) return Alert.alert('Empty Form', 'Please fill at least one measurement');
    setSaving(true);
    try {
      const payload = { date: dateInput };
      FIELDS.forEach(f => {
        if (form[f.key].trim()) payload[f.key] = parseFloat(form[f.key]);
      });
      await saveMeasurement(payload);
      setForm({ waist: '', hips: '', chest: '', neck: '', leftArm: '', rightArm: '' });
      load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this measurement entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteMeasurement(id);
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
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) =>
      dark ? `rgba(156,163,175,${opacity})` : `rgba(107,114,128,${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 1,
  };

  // Waist trend chart
  const waistEntries = [...entries]
    .reverse()
    .filter(e => e.waist)
    .slice(-10);
  const chartData = waistEntries.length >= 2 ? {
    labels: waistEntries.map(e => {
      const d = new Date(e.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    datasets: [{ data: waistEntries.map(e => e.waist) }],
  } : null;

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>Body Measurements</Text>
        </View>

        {/* Form */}
        <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
          <Text className={`font-semibold mb-3 ${text}`}>Log Measurements</Text>
          {FIELDS.map(field => (
            <View key={field.key} className="mb-3">
              <Text className={`text-sm font-semibold mb-1 ${muted}`}>{field.label}</Text>
              <TextInput
                value={form[field.key]}
                onChangeText={val => setForm(prev => ({ ...prev, [field.key]: val }))}
                placeholder="cm"
                placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                keyboardType="decimal-pad"
                className={`border rounded-xl px-3 py-2.5 text-sm ${inputCls}`}
              />
            </View>
          ))}
          <TextInput
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
            className={`border rounded-xl px-3 py-2.5 text-sm mb-3 ${inputCls}`}
          />
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-purple-600 rounded-xl py-3 items-center"
          >
            <Text className="text-white font-semibold">{saving ? 'Saving...' : 'Save Measurements'}</Text>
          </TouchableOpacity>
        </View>

        {/* Waist trend chart */}
        {chartData && (
          <View className={`rounded-2xl border overflow-hidden mb-4 ${card}`}>
            <Text className={`font-semibold p-4 pb-0 ${text}`}>Waist Trend</Text>
            <LineChart
              data={chartData}
              width={screenWidth}
              height={160}
              chartConfig={chartConfig}
              bezier
              style={{ marginTop: 8 }}
              withInnerLines={false}
            />
          </View>
        )}

        {/* History */}
        <Text className={`font-semibold mb-3 ${text}`}>History</Text>
        {loading ? (
          <View className="items-center py-6">
            <Text className={muted}>Loading...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View className={`rounded-2xl border p-6 items-center ${card}`}>
            <Text className="text-3xl mb-2">📏</Text>
            <Text className={`text-sm ${muted}`}>No measurements recorded yet</Text>
          </View>
        ) : (
          entries.slice(0, 5).map((entry) => (
            <View key={entry._id} className={`rounded-xl border p-4 mb-3 ${card}`}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className={`font-semibold ${text}`}>
                  {new Date(entry.date).toLocaleDateString()}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(entry._id)}
                  className="w-7 h-7 bg-red-100 dark:bg-red-900 rounded-lg items-center justify-center"
                >
                  <Text className="text-red-600 dark:text-red-400 text-xs">✕</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                {FIELDS.map(f => entry[f.key] ? (
                  <Text key={f.key} className={`text-sm ${muted}`}>
                    {f.label.split(' ')[0]}: <Text className={text}>{entry[f.key]}cm</Text>
                  </Text>
                ) : null)}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
