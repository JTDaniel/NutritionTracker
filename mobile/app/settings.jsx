import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { KEYS } from '../utils/storage';

const handleSignOut = async () => {
  await AsyncStorage.multiRemove([KEYS.AUTH_TOKEN, KEYS.USER_ID, KEYS.USER_EMAIL]);
  router.replace('/login');
};

export default function Settings() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [backendUrl, setBackendUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEYS.BACKEND_URL).then(val => {
      if (val) setBackendUrl(val);
    });
  }, []);

  const handleSave = async () => {
    const url = backendUrl.trim().replace(/\/$/, '');
    await AsyncStorage.setItem(KEYS.BACKEND_URL, url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    try {
      const url = backendUrl.trim().replace(/\/$/, '');
      const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) Alert.alert('Success ✓', 'Connected to backend successfully!');
      else Alert.alert('Error', `Backend returned HTTP ${res.status}`);
    } catch (e) {
      Alert.alert('Failed', `Cannot connect: ${e.message}`);
    }
  };

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
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
          <View>
            <Text className={`text-2xl font-bold mb-0.5 ${text}`}>Settings</Text>
            <Text className={`text-sm ${muted}`}>Configure your backend connection</Text>
          </View>
        </View>

        <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
          <Text className={`font-semibold mb-1 ${text}`}>Backend URL</Text>
          <Text className={`text-xs mb-3 ${muted}`}>
            Enter your computer's Tailscale IP and port.{'\n'}
            Find it by running: tailscale ip -4{'\n'}
            Example: http://100.64.0.1:3002
          </Text>
          <TextInput
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="http://100.x.x.x:3002"
            placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            className={`border rounded-xl px-3 py-3 text-sm mb-3 ${inputCls}`}
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleTest}
              className="flex-1 bg-gray-500 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold">Test Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-green-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold">{saved ? '✓ Saved' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
          <Text className={`font-semibold mb-2 ${text}`}>How to connect</Text>
          <Text className={`text-sm ${muted} leading-relaxed`}>
            1. Make sure your Docker backend is running{'\n'}
            2. Open a terminal and run: tailscale ip -4{'\n'}
            3. Enter that IP above with port 3002{'\n'}
            4. Both devices must be on Tailscale{'\n\n'}
            The backend runs at port 3002 by default (mapped in docker-compose.yml).
          </Text>
        </View>

        <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
          <Text className={`font-semibold mb-2 ${text}`}>Quick Navigation</Text>
          <View className="gap-2">
            {[
              { label: 'Edit Profile', route: '/profile', emoji: '👤' },
              { label: 'Choose Diet', route: '/diet', emoji: '🥦' },
              { label: 'View Badges', route: '/badges', emoji: '🏆' },
            ].map(item => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route)}
                className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <Text className="text-lg mr-3">{item.emoji}</Text>
                <Text className={`flex-1 font-medium ${text}`}>{item.label}</Text>
                <Text className={`text-xl ${muted}`}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className={`rounded-2xl border p-4 ${card}`}>
          <Text className={`font-semibold mb-1 ${text}`}>Account</Text>
          <Text className={`text-xs mb-3 ${muted}`}>Sign out to switch accounts or log in with a different user.</Text>
          <TouchableOpacity
            onPress={() => Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: handleSignOut },
              ]
            )}
            className="bg-red-600 rounded-xl py-3 items-center"
          >
            <Text className="text-white font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
