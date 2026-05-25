import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, Alert, useColorScheme, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { searchExercises, addExerciseLog, awardXP, getUser } from '../utils/api';

const today = () => new Date().toISOString().split('T')[0];

export default function ExerciseSearch() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [userWeightKg, setUserWeightKg] = useState(75);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [duration, setDuration] = useState('30');
  const [logDate, setLogDate] = useState(today());
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [exercises, userData] = await Promise.all([
          searchExercises(''),
          getUser().catch(() => null),
        ]);
        setAllExercises(exercises?.exercises || exercises || []);
        setResults(exercises?.exercises || exercises || []);
        if (userData?.weightKg) setUserWeightKg(userData.weightKg);
      } catch (e) {
        console.log('Exercise init error:', e.message);
      }
    };
    init();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await searchExercises(query.trim());
      setResults(data?.exercises || data || []);
    } catch (e) {
      Alert.alert('Search Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (exercise) => {
    setSelectedExercise(exercise);
    setDuration('30');
    setLogDate(today());
    setSuccessMsg('');
  };

  const closeModal = () => {
    setSelectedExercise(null);
    setSuccessMsg('');
  };

  const caloriesBurned = () => {
    if (!selectedExercise) return 0;
    const met = selectedExercise.met || 4;
    const hours = (parseFloat(duration) || 0) / 60;
    return Math.round(met * userWeightKg * hours);
  };

  const handleAdd = async () => {
    if (!selectedExercise) return;
    setAdding(true);
    try {
      const burned = caloriesBurned();
      await addExerciseLog(logDate, {
        name: selectedExercise.name,
        category: selectedExercise.category,
        met: selectedExercise.met,
        duration: parseFloat(duration) || 30,
        caloriesBurned: burned,
      });
      await awardXP('EXERCISE_LOG').catch(() => {});
      setSuccessMsg(`✓ ${selectedExercise.name} logged!`);
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

  const displayList = query.trim() ? results : allExercises;

  return (
    <View className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>Search Exercises</Text>
        </View>

        <View className="flex-row gap-2">
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search exercises..."
            placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
            returnKeyType="search"
            className={`flex-1 border rounded-xl px-3 py-3 text-sm ${inputCls}`}
          />
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-orange-500 rounded-xl px-4 items-center justify-center"
          >
            <Text className="text-white font-semibold">Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className={muted}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openModal(item)}>
              <View className={`flex-row items-center p-3 rounded-xl border mb-2 ${card}`}>
                <View className="flex-1 mr-3">
                  <Text className={`font-medium text-sm ${text}`} numberOfLines={1}>{item.name}</Text>
                  <View className="flex-row gap-2 mt-1">
                    {item.category ? (
                      <View className="bg-orange-50 dark:bg-orange-900 px-2 py-0.5 rounded">
                        <Text className="text-xs text-orange-700 dark:text-orange-300">{item.category}</Text>
                      </View>
                    ) : null}
                    <Text className={`text-xs ${muted}`}>MET {item.met || '—'}</Text>
                    <Text className={`text-xs ${muted}`}>
                      ~{Math.round((item.met || 4) * userWeightKg * 0.5)} kcal/30min
                    </Text>
                  </View>
                </View>
                <View className="w-9 h-9 bg-orange-500 rounded-xl items-center justify-center">
                  <Text className="text-white text-xl font-bold">+</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">🏃</Text>
              <Text className={`text-sm ${muted}`}>No exercises found</Text>
            </View>
          }
        />
      )}

      {/* Add to log modal */}
      <Modal visible={!!selectedExercise} transparent animationType="slide">
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
            ) : selectedExercise ? (
              <>
                <Text className={`text-lg font-bold mb-1 ${text}`}>{selectedExercise.name}</Text>
                {selectedExercise.category ? (
                  <Text className={`text-sm mb-4 ${muted}`}>{selectedExercise.category}</Text>
                ) : <View className="mb-4" />}

                <Text className={`text-sm font-semibold mb-1 ${muted}`}>Duration (minutes)</Text>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
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

                <View className="bg-orange-50 dark:bg-orange-900 rounded-xl p-4 mb-5 items-center">
                  <Text className="text-3xl font-bold text-orange-600 dark:text-orange-300">
                    {caloriesBurned()} kcal
                  </Text>
                  <Text className={`text-sm mt-1 ${muted}`}>estimated burned</Text>
                  <Text className={`text-xs mt-0.5 ${muted}`}>
                    MET {selectedExercise.met || 4} × {userWeightKg}kg × {((parseFloat(duration) || 0) / 60).toFixed(2)}h
                  </Text>
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
                    className="flex-1 bg-orange-500 rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-semibold">
                      {adding ? 'Adding...' : 'Log Exercise'}
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
