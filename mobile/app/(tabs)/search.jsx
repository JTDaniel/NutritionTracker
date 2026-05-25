import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { router } from 'expo-router';

export default function SearchHub() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <Text className={`text-2xl font-bold mb-1 ${text}`}>Search</Text>
        <Text className={`text-sm mb-6 ${muted}`}>Find foods, exercises, or scan a barcode</Text>

        <TouchableOpacity
          onPress={() => router.push('/food-search')}
          className={`rounded-2xl border p-5 mb-4 flex-row items-center ${card}`}
        >
          <View className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-2xl items-center justify-center mr-4">
            <Text className="text-3xl">🥗</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-lg font-bold ${text}`}>Search Foods</Text>
            <Text className={`text-sm mt-0.5 ${muted}`}>
              Search USDA database, branded foods, and your custom foods
            </Text>
          </View>
          <Text className={`text-2xl ${muted}`}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/exercise-search')}
          className={`rounded-2xl border p-5 mb-4 flex-row items-center ${card}`}
        >
          <View className="w-14 h-14 bg-orange-100 dark:bg-orange-900 rounded-2xl items-center justify-center mr-4">
            <Text className="text-3xl">🏃</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-lg font-bold ${text}`}>Search Exercises</Text>
            <Text className={`text-sm mt-0.5 ${muted}`}>
              Browse exercises and log activity with calorie burn
            </Text>
          </View>
          <Text className={`text-2xl ${muted}`}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/barcode')}
          className={`rounded-2xl border p-5 mb-4 flex-row items-center ${card}`}
        >
          <View className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-2xl items-center justify-center mr-4">
            <Text className="text-3xl">📷</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-lg font-bold ${text}`}>Scan Barcode</Text>
            <Text className={`text-sm mt-0.5 ${muted}`}>
              Instantly look up packaged foods by barcode
            </Text>
          </View>
          <Text className={`text-2xl ${muted}`}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/custom-foods')}
          className={`rounded-2xl border p-5 flex-row items-center ${card}`}
        >
          <View className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-2xl items-center justify-center mr-4">
            <Text className="text-3xl">✏️</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-lg font-bold ${text}`}>Custom Foods</Text>
            <Text className={`text-sm mt-0.5 ${muted}`}>
              Create and manage your own food entries
            </Text>
          </View>
          <Text className={`text-2xl ${muted}`}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
