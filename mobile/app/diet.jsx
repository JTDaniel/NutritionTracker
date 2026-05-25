import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { updateUser } from '../utils/api';
import { KEYS } from '../utils/storage';

const DIETS = [
  {
    id: 'balanced',
    name: 'Balanced',
    emoji: '🥗',
    description: 'A well-rounded diet with all macronutrients',
    macros: { protein: 20, carbs: 50, fat: 30 },
    tips: ['Eat a variety of whole foods', 'Include fruits and vegetables daily', 'Choose whole grains over refined'],
  },
  {
    id: 'keto',
    name: 'Ketogenic',
    emoji: '🥩',
    description: 'Very low carb, high fat diet for ketosis',
    macros: { protein: 25, carbs: 5, fat: 70 },
    tips: ['Keep carbs under 20-50g/day', 'Focus on healthy fats', 'Monitor electrolytes'],
  },
  {
    id: 'paleo',
    name: 'Paleo',
    emoji: '🍖',
    description: 'Based on foods of our paleolithic ancestors',
    macros: { protein: 30, carbs: 35, fat: 35 },
    tips: ['Avoid processed foods', 'No grains or legumes', 'Focus on whole, unprocessed foods'],
  },
  {
    id: 'vegan',
    name: 'Vegan',
    emoji: '🌱',
    description: 'Plant-based diet, no animal products',
    macros: { protein: 15, carbs: 60, fat: 25 },
    tips: ['Monitor B12 and iron', 'Combine proteins for complete amino acids', 'Include legumes and nuts'],
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    emoji: '🥬',
    description: 'No meat but includes dairy and eggs',
    macros: { protein: 18, carbs: 55, fat: 27 },
    tips: ['Include eggs and dairy for protein', 'Monitor iron and zinc', 'Eat a variety of plant proteins'],
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    emoji: '🫒',
    description: 'Heart-healthy diet inspired by Mediterranean cuisine',
    macros: { protein: 18, carbs: 50, fat: 32 },
    tips: ['Use olive oil as primary fat', 'Eat fish twice a week', 'Limit red meat and processed foods'],
  },
  {
    id: 'lowcarb',
    name: 'Low Carb',
    emoji: '🥦',
    description: 'Reduced carbohydrate intake for weight management',
    macros: { protein: 30, carbs: 20, fat: 50 },
    tips: ['Limit bread, pasta, and sugar', 'Focus on protein and vegetables', 'Include healthy fats'],
  },
  {
    id: 'highprotein',
    name: 'High Protein',
    emoji: '💪',
    description: 'Elevated protein for muscle building',
    macros: { protein: 40, carbs: 35, fat: 25 },
    tips: ['Aim for 1.6-2.2g protein per kg bodyweight', 'Spread protein across meals', 'Post-workout protein is key'],
  },
  {
    id: 'intermittent',
    name: 'Intermittent Fasting',
    emoji: '⏱',
    description: 'Time-restricted eating patterns',
    macros: { protein: 25, carbs: 45, fat: 30 },
    tips: ['Common windows: 16:8 or 18:6', 'Stay hydrated during fasting', 'Break fast with protein-rich foods'],
  },
  {
    id: 'dash',
    name: 'DASH',
    emoji: '❤️',
    description: 'Dietary Approaches to Stop Hypertension',
    macros: { protein: 18, carbs: 55, fat: 27 },
    tips: ['Limit sodium to 2300mg/day', 'Emphasize fruits and vegetables', 'Choose low-fat dairy'],
  },
  {
    id: 'carnivore',
    name: 'Carnivore',
    emoji: '🥩',
    description: 'All-animal product diet',
    macros: { protein: 35, carbs: 0, fat: 65 },
    tips: ['Focus on ruminant meats', 'Include organ meats for nutrients', 'Monitor electrolytes closely'],
  },
  {
    id: 'glutenfree',
    name: 'Gluten Free',
    emoji: '🌾',
    description: 'Avoids gluten-containing grains',
    macros: { protein: 20, carbs: 50, fat: 30 },
    tips: ['Avoid wheat, barley, and rye', 'Watch for hidden gluten in sauces', 'Choose certified GF products'],
  },
];

export default function Diet() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [activeDiet, setActiveDiet] = useState('balanced');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const stored = await AsyncStorage.getItem(KEYS.DIET);
      if (stored) setActiveDiet(stored);
    };
    init();
  }, []);

  const handleSelect = async (diet) => {
    setSaving(true);
    try {
      setActiveDiet(diet.id);
      await AsyncStorage.setItem(KEYS.DIET, diet.id);
      await updateUser({ dietType: diet.id });
    } catch (e) {
      console.log('Diet save error:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';

  const activeDietData = DIETS.find(d => d.id === activeDiet);

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>🥦 Diet Type</Text>
        </View>

        {/* Active diet card */}
        {activeDietData && (
          <View className="rounded-2xl bg-green-600 p-4 mb-4">
            <Text className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-1">
              Current Diet
            </Text>
            <View className="flex-row items-center mb-2">
              <Text className="text-3xl mr-2">{activeDietData.emoji}</Text>
              <Text className="text-white text-xl font-bold">{activeDietData.name}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <View className="items-center">
                <Text className="text-white font-bold text-lg">{activeDietData.macros.protein}%</Text>
                <Text className="text-green-200 text-xs">Protein</Text>
              </View>
              <View className="items-center">
                <Text className="text-white font-bold text-lg">{activeDietData.macros.carbs}%</Text>
                <Text className="text-green-200 text-xs">Carbs</Text>
              </View>
              <View className="items-center">
                <Text className="text-white font-bold text-lg">{activeDietData.macros.fat}%</Text>
                <Text className="text-green-200 text-xs">Fat</Text>
              </View>
            </View>
            <Text className="text-green-100 text-xs font-semibold mb-1">Tips:</Text>
            {activeDietData.tips.map((tip, i) => (
              <Text key={i} className="text-green-100 text-xs">• {tip}</Text>
            ))}
          </View>
        )}

        <Text className={`font-semibold mb-3 ${text}`}>Choose Your Diet</Text>

        <View className="flex-row flex-wrap gap-3">
          {DIETS.map((diet) => {
            const isActive = activeDiet === diet.id;
            return (
              <TouchableOpacity
                key={diet.id}
                onPress={() => handleSelect(diet)}
                disabled={saving}
                className={`rounded-xl border p-3 items-center ${
                  isActive
                    ? 'bg-green-600 border-green-600'
                    : card
                }`}
                style={{ width: '47%' }}
              >
                <Text className="text-2xl mb-1">{diet.emoji}</Text>
                <Text className={`font-semibold text-sm text-center ${isActive ? 'text-white' : text}`}>
                  {diet.name}
                </Text>
                <Text className={`text-xs text-center mt-0.5 ${isActive ? 'text-green-100' : muted}`}
                  numberOfLines={2}>
                  {diet.description}
                </Text>
                <View className="flex-row gap-1 mt-2">
                  <View className={`px-1.5 py-0.5 rounded ${isActive ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Text className={`text-xs ${isActive ? 'text-white' : muted}`}>
                      P:{diet.macros.protein}%
                    </Text>
                  </View>
                  <View className={`px-1.5 py-0.5 rounded ${isActive ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Text className={`text-xs ${isActive ? 'text-white' : muted}`}>
                      C:{diet.macros.carbs}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
