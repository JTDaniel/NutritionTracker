import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';

const SECTIONS = [
  {
    title: 'Tracking',
    items: [
      { emoji: '💧', label: 'Water Tracker', route: '/water' },
      { emoji: '⏱', label: 'Fasting Timer', route: '/fasting' },
    ],
  },
  {
    title: 'Library',
    items: [
      { emoji: '✏️', label: 'Custom Foods', route: '/custom-foods' },
      { emoji: '📖', label: 'Recipes', route: '/recipes' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { emoji: '🏆', label: 'Badges', route: '/badges' },
      { emoji: '🥦', label: 'Diet Type', route: '/diet' },
    ],
  },
  {
    title: 'Account',
    items: [
      { emoji: '👤', label: 'Profile', route: '/profile' },
      { emoji: '⚙️', label: 'Settings', route: '/settings' },
    ],
  },
];

export default function More() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const divider = dark ? 'border-gray-700' : 'border-gray-100';

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <Text className={`text-2xl font-bold mb-6 ${text}`}>More</Text>

        {SECTIONS.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>
              {section.title}
            </Text>
            <View className={`rounded-2xl border overflow-hidden ${card}`}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => router.push(item.route)}
                  className={`flex-row items-center px-4 py-4 ${
                    index < section.items.length - 1 ? `border-b ${divider}` : ''
                  }`}
                >
                  <View className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-xl items-center justify-center mr-3">
                    <Text className="text-lg">{item.emoji}</Text>
                  </View>
                  <Text className={`flex-1 font-medium text-base ${text}`}>{item.label}</Text>
                  <Text className={`text-xl ${muted}`}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
