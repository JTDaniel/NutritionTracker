import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ScrollView, Modal, Alert, useColorScheme, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  searchFoods, getRecentFoods, addFoodLog, awardXP, getFoodSeedStatus,
} from '../utils/api';

const today = () => new Date().toISOString().split('T')[0];

export default function FoodSearch() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingSize, setServingSize] = useState('');
  const [logDate, setLogDate] = useState(today());
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [recent, status] = await Promise.all([
          getRecentFoods(25),
          getFoodSeedStatus(),
        ]);
        setRecentFoods(recent?.foods || recent || []);
        setSeedStatus(status);
      } catch (e) {
        console.log('Init error:', e.message);
      }
    };
    init();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchFoods(query.trim(), 30);
      setResults(data?.foods || data || []);
    } catch (e) {
      Alert.alert('Search Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (food) => {
    setSelectedFood(food);
    setServingSize(String(food.servingSize || 100));
    setLogDate(today());
    setSuccessMsg('');
  };

  const closeModal = () => {
    setSelectedFood(null);
    setSuccessMsg('');
  };

  const scaledNutrition = () => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const size = parseFloat(servingSize) || 100;
    const base = selectedFood.servingSize || 100;
    const scale = size / base;
    return {
      calories: Math.round((selectedFood.calories || 0) * scale),
      protein: Math.round((selectedFood.protein || 0) * scale),
      carbs: Math.round((selectedFood.carbs || 0) * scale),
      fat: Math.round((selectedFood.fat || 0) * scale),
    };
  };

  const handleAdd = async () => {
    if (!selectedFood) return;
    setAdding(true);
    try {
      const size = parseFloat(servingSize) || 100;
      const base = selectedFood.servingSize || 100;
      const scale = size / base;
      const foodToLog = {
        name: selectedFood.name,
        brandName: selectedFood.brandName,
        servingSize: size,
        calories: (selectedFood.calories || 0) * scale,
        protein: (selectedFood.protein || 0) * scale,
        carbs: (selectedFood.carbs || 0) * scale,
        fat: (selectedFood.fat || 0) * scale,
        fiber: (selectedFood.fiber || 0) * scale,
      };
      await addFoodLog(logDate, foodToLog);
      await awardXP('FOOD_LOG').catch(() => {});
      setSuccessMsg(`✓ ${selectedFood.name} added!`);
      setTimeout(closeModal, 1500);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setAdding(false);
    }
  };

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  const displayList = query.trim() ? results : recentFoods;
  const listLabel = query.trim() ? `${results.length} results` : 'Recent Foods';

  const scaled = scaledNutrition();

  return (
    <View className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>Search Foods</Text>
        </View>

        {seedStatus?.brandedInProgress && (
          <View className="bg-yellow-100 dark:bg-yellow-900 rounded-xl px-3 py-2 mb-3">
            <Text className="text-yellow-800 dark:text-yellow-200 text-xs">
              🔄 Seeding branded foods database... more results coming soon
            </Text>
          </View>
        )}

        <View className="flex-row gap-2">
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search foods..."
            placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
            returnKeyType="search"
            className={`flex-1 border rounded-xl px-3 py-3 text-sm ${inputCls}`}
          />
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-green-600 rounded-xl px-4 items-center justify-center"
          >
            <Text className="text-white font-semibold">Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 pb-2">
        <Text className={`text-sm font-semibold ${muted}`}>{listLabel}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className={muted}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item, index) => item._id || item.fdcId || String(index)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openModal(item)}>
              <View className={`flex-row items-start justify-between p-3 rounded-xl border mb-2 ${card}`}>
                <View className="flex-1 mr-3">
                  <Text className={`font-medium text-sm ${text}`} numberOfLines={1}>{item.name}</Text>
                  {item.brandName ? (
                    <Text className={`text-xs ${muted}`} numberOfLines={1}>{item.brandName}</Text>
                  ) : null}
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    <View className="bg-green-50 dark:bg-green-900 px-2 py-0.5 rounded">
                      <Text className="text-xs font-semibold text-green-700 dark:text-green-400">
                        {Math.round((item.calories || 0) * ((item.servingSize || 100) / 100))} kcal
                      </Text>
                    </View>
                    <Text className={`text-xs ${muted}`}>{item.servingSize || 100}g</Text>
                    <Text className="text-xs text-blue-600 dark:text-blue-400">
                      P:{Math.round((item.protein || 0) * ((item.servingSize || 100) / 100))}g
                    </Text>
                    <Text className="text-xs text-yellow-600 dark:text-yellow-400">
                      C:{Math.round((item.carbs || 0) * ((item.servingSize || 100) / 100))}g
                    </Text>
                    <Text className="text-xs text-red-500 dark:text-red-400">
                      F:{Math.round((item.fat || 0) * ((item.servingSize || 100) / 100))}g
                    </Text>
                  </View>
                </View>
                <View className="w-9 h-9 bg-green-600 rounded-xl items-center justify-center">
                  <Text className="text-white text-xl font-bold">+</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className={`text-sm ${muted}`}>
                {query.trim() ? 'No results found' : 'Search for foods to get started'}
              </Text>
            </View>
          }
        />
      )}

      {/* Add to log modal */}
      <Modal visible={!!selectedFood} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <View className="bg-black/40 flex-1" />
          <View className={`rounded-t-3xl px-5 pt-5 pb-10 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
            <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-4" />
            {successMsg ? (
              <View className="items-center py-8">
                <Text className="text-5xl mb-3">✓</Text>
                <Text className={`text-lg font-semibold ${text}`}>{successMsg}</Text>
              </View>
            ) : selectedFood ? (
              <>
                <Text className={`text-lg font-bold mb-1 ${text}`} numberOfLines={2}>
                  {selectedFood.name}
                </Text>
                {selectedFood.brandName ? (
                  <Text className={`text-sm mb-4 ${muted}`}>{selectedFood.brandName}</Text>
                ) : null}

                <Text className={`text-sm font-semibold mb-1 ${muted}`}>Serving Size (g)</Text>
                <TextInput
                  value={servingSize}
                  onChangeText={setServingSize}
                  keyboardType="numeric"
                  className={`border rounded-xl px-3 py-3 text-sm mb-4 ${inputCls}`}
                />

                <Text className={`text-sm font-semibold mb-1 ${muted}`}>Date</Text>
                <TextInput
                  value={logDate}
                  onChangeText={setLogDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                  className={`border rounded-xl px-3 py-3 text-sm mb-4 ${inputCls}`}
                />

                <View className="flex-row justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-5">
                  <View className="items-center">
                    <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                      {scaled.calories}
                    </Text>
                    <Text className={`text-xs ${muted}`}>kcal</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {scaled.protein}g
                    </Text>
                    <Text className={`text-xs ${muted}`}>Protein</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {scaled.carbs}g
                    </Text>
                    <Text className={`text-xs ${muted}`}>Carbs</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-red-500 dark:text-red-400">
                      {scaled.fat}g
                    </Text>
                    <Text className={`text-xs ${muted}`}>Fat</Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={closeModal}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl py-3 items-center"
                  >
                    <Text className={`font-semibold ${text}`}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAdd}
                    disabled={adding}
                    className="flex-1 bg-green-600 rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-semibold">
                      {adding ? 'Adding...' : 'Add to Log'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
