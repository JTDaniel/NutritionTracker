import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, useColorScheme, Alert
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from '../utils/storage';
import { loginUser, registerUser } from '../utils/api';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = dark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const submit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const data = tab === 'login'
        ? await loginUser(email.trim(), password)
        : await registerUser(email.trim(), password, name.trim());
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, data.token);
      await AsyncStorage.setItem(KEYS.USER_ID, data.userId);
      await AsyncStorage.setItem(KEYS.USER_EMAIL, data.email);
      router.replace('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`flex-1 ${bg}`}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-10">
            <Text className="text-6xl mb-3">🥦</Text>
            <Text className={`text-3xl font-bold ${text}`}>NutritionTracker</Text>
            <Text className={`text-sm mt-1 ${muted}`}>Your personal health companion</Text>
          </View>

          <View className={`rounded-2xl border p-6 ${card}`}>
            {/* Tab toggle */}
            <View className={`flex-row rounded-xl p-1 mb-6 ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {['login', 'register'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-2.5 rounded-lg items-center ${tab === t ? 'bg-green-600' : ''}`}
                >
                  <Text className={`text-sm font-semibold ${tab === t ? 'text-white' : muted}`}>
                    {t === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'register' && (
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-1.5 ${text}`}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                  className={`border rounded-xl px-4 py-3 text-sm ${inputCls}`}
                />
              </View>
            )}

            <View className="mb-4">
              <Text className={`text-sm font-medium mb-1.5 ${text}`}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                keyboardType="email-address"
                autoCapitalize="none"
                className={`border rounded-xl px-4 py-3 text-sm ${inputCls}`}
              />
            </View>

            <View className="mb-5">
              <Text className={`text-sm font-medium mb-1.5 ${text}`}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={tab === 'register' ? 'At least 8 characters' : 'Your password'}
                placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                secureTextEntry
                className={`border rounded-xl px-4 py-3 text-sm ${inputCls}`}
              />
            </View>

            {error ? (
              <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={submit}
              disabled={loading}
              className={`rounded-xl py-3.5 items-center ${loading ? 'bg-green-400' : 'bg-green-600'}`}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/settings')} className="mt-6 items-center">
            <Text className={`text-sm ${muted}`}>⚙️ Configure backend URL in Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
