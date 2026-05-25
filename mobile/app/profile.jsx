import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getUser, updateUser } from '../utils/api';
import { KEYS } from '../utils/storage';

const GENDERS = ['male', 'female', 'other'];
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Light', description: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: '3-5 days/week' },
  { value: 'active', label: 'Active', description: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Hard exercise + physical job' },
];
const GOALS = [
  { value: 'lose_fast', label: 'Lose Fast (-1kg/wk)' },
  { value: 'lose', label: 'Lose Weight (-0.5kg/wk)' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'gain', label: 'Gain Weight (+0.5kg/wk)' },
  { value: 'gain_fast', label: 'Gain Fast (+1kg/wk)' },
];

export default function Profile() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    heightCm: '',
    weightKg: '',
    activityLevel: 'moderate',
    weeklyGoal: 'maintain',
  });
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' or 'ft'
  const [weightUnit, setWeightUnit] = useState('kg');
  const [ftIn, setFtIn] = useState({ ft: '', in: '' });
  const [tdee, setTdee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await getUser();
        if (userData) {
          setForm({
            name: userData.name || '',
            age: String(userData.age || ''),
            gender: userData.gender || 'male',
            heightCm: String(userData.heightCm || ''),
            weightKg: String(userData.weightKg || ''),
            activityLevel: userData.activityLevel || 'moderate',
            weeklyGoal: userData.weeklyGoal || 'maintain',
          });
          if (userData.heightCm) {
            const totalIn = userData.heightCm / 2.54;
            setFtIn({ ft: String(Math.floor(totalIn / 12)), in: String(Math.round(totalIn % 12)) });
          }
          if (userData.tdee) setTdee(userData.tdee);
        }
      } catch (e) {
        console.log('Profile load error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getHeightCm = () => {
    if (heightUnit === 'cm') return parseFloat(form.heightCm) || 0;
    const ft = parseFloat(ftIn.ft) || 0;
    const inch = parseFloat(ftIn.in) || 0;
    return Math.round((ft * 12 + inch) * 2.54);
  };

  const getWeightKg = () => {
    const val = parseFloat(form.weightKg) || 0;
    return weightUnit === 'lbs' ? val * 0.453592 : val;
  };

  const handleSave = async () => {
    if (!form.age || !form.heightCm || !form.weightKg) {
      return Alert.alert('Required', 'Please fill in age, height, and weight');
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        age: parseInt(form.age) || 0,
        gender: form.gender,
        heightCm: getHeightCm(),
        weightKg: getWeightKg(),
        activityLevel: form.activityLevel,
        weeklyGoal: form.weeklyGoal,
      };
      const result = await updateUser(payload);
      if (result?.tdee) setTdee(result.tdee);
      await AsyncStorage.setItem(KEYS.PROFILE_BACKUP, JSON.stringify(payload));
      Alert.alert('Saved!', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  const Field = ({ label, field, keyboardType = 'default', placeholder = '' }) => (
    <View className="mb-3">
      <Text className={`text-sm font-semibold mb-1 ${muted}`}>{label}</Text>
      <TextInput
        value={form[field]}
        onChangeText={val => setForm(prev => ({ ...prev, [field]: val }))}
        placeholder={placeholder}
        placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
        keyboardType={keyboardType}
        className={`border rounded-xl px-3 py-2.5 text-sm ${inputCls}`}
      />
    </View>
  );

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>👤 Profile</Text>
        </View>

        {loading ? (
          <View className="items-center py-12">
            <Text className={muted}>Loading...</Text>
          </View>
        ) : (
          <>
            <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
              <Text className={`font-semibold mb-3 ${text}`}>Personal Info</Text>
              <Field label="Name" field="name" placeholder="Your name" />
              <Field label="Age" field="age" keyboardType="numeric" placeholder="Years" />

              <Text className={`text-sm font-semibold mb-1 ${muted}`}>Gender</Text>
              <View className="flex-row gap-2 mb-3">
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setForm(prev => ({ ...prev, gender: g }))}
                    className={`flex-1 py-2 rounded-xl items-center ${
                      form.gender === g ? 'bg-green-600' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Text className={`font-semibold text-sm capitalize ${form.gender === g ? 'text-white' : text}`}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
              <Text className={`font-semibold mb-3 ${text}`}>Body Measurements</Text>

              <Text className={`text-sm font-semibold mb-1 ${muted}`}>Height</Text>
              <View className="flex-row gap-2 mb-2">
                {['cm', 'ft'].map(u => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setHeightUnit(u)}
                    className={`flex-1 py-2 rounded-xl items-center ${heightUnit === u ? 'bg-green-600' : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    <Text className={`font-semibold ${heightUnit === u ? 'text-white' : text}`}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {heightUnit === 'cm' ? (
                <TextInput
                  value={form.heightCm}
                  onChangeText={val => setForm(prev => ({ ...prev, heightCm: val }))}
                  placeholder="Height in cm"
                  placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                  keyboardType="decimal-pad"
                  className={`border rounded-xl px-3 py-2.5 text-sm mb-3 ${inputCls}`}
                />
              ) : (
                <View className="flex-row gap-2 mb-3">
                  <TextInput
                    value={ftIn.ft}
                    onChangeText={val => setFtIn(prev => ({ ...prev, ft: val }))}
                    placeholder="ft"
                    placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                    keyboardType="numeric"
                    className={`flex-1 border rounded-xl px-3 py-2.5 text-sm ${inputCls}`}
                  />
                  <TextInput
                    value={ftIn.in}
                    onChangeText={val => setFtIn(prev => ({ ...prev, in: val }))}
                    placeholder="in"
                    placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                    keyboardType="numeric"
                    className={`flex-1 border rounded-xl px-3 py-2.5 text-sm ${inputCls}`}
                  />
                </View>
              )}

              <Text className={`text-sm font-semibold mb-1 ${muted}`}>Weight</Text>
              <View className="flex-row gap-2 mb-2">
                {['kg', 'lbs'].map(u => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setWeightUnit(u)}
                    className={`flex-1 py-2 rounded-xl items-center ${weightUnit === u ? 'bg-green-600' : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    <Text className={`font-semibold ${weightUnit === u ? 'text-white' : text}`}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={form.weightKg}
                onChangeText={val => setForm(prev => ({ ...prev, weightKg: val }))}
                placeholder={`Weight in ${weightUnit}`}
                placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                keyboardType="decimal-pad"
                className={`border rounded-xl px-3 py-2.5 text-sm ${inputCls}`}
              />
            </View>

            <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
              <Text className={`font-semibold mb-3 ${text}`}>Activity Level</Text>
              {ACTIVITY_LEVELS.map(level => (
                <TouchableOpacity
                  key={level.value}
                  onPress={() => setForm(prev => ({ ...prev, activityLevel: level.value }))}
                  className={`flex-row items-center p-3 rounded-xl mb-2 ${
                    form.activityLevel === level.value
                      ? 'bg-green-50 dark:bg-green-900 border border-green-500'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    form.activityLevel === level.value
                      ? 'border-green-600 bg-green-600'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {form.activityLevel === level.value && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                  <View>
                    <Text className={`font-semibold text-sm ${text}`}>{level.label}</Text>
                    <Text className={`text-xs ${muted}`}>{level.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
              <Text className={`font-semibold mb-3 ${text}`}>Weekly Goal</Text>
              {GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.value}
                  onPress={() => setForm(prev => ({ ...prev, weeklyGoal: goal.value }))}
                  className={`p-3 rounded-xl mb-2 ${
                    form.weeklyGoal === goal.value
                      ? 'bg-green-50 dark:bg-green-900 border border-green-500'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      form.weeklyGoal === goal.value
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {form.weeklyGoal === goal.value && (
                        <Text className="text-white text-xs">✓</Text>
                      )}
                    </View>
                    <Text className={`font-semibold text-sm ${text}`}>{goal.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-green-600 rounded-xl py-4 items-center mb-4"
            >
              <Text className="text-white font-bold text-base">
                {saving ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>

            {/* TDEE results */}
            {tdee && (
              <View className={`rounded-2xl border p-4 ${card}`}>
                <Text className={`font-semibold mb-3 ${text}`}>Your Calorie Targets</Text>
                <View className="flex-row justify-between mb-2">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {tdee.bmr || 0}
                    </Text>
                    <Text className={`text-xs ${muted}`}>BMR</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-orange-500">
                      {tdee.tdee || 0}
                    </Text>
                    <Text className={`text-xs ${muted}`}>TDEE</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {tdee.recommendedCalories || 0}
                    </Text>
                    <Text className={`text-xs ${muted}`}>Goal</Text>
                  </View>
                </View>
                <Text className={`text-xs text-center ${muted}`}>calories per day</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
