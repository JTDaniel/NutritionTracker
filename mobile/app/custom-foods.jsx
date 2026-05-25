import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  Alert, Modal, useColorScheme, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { getCustomFoods, createCustomFood, deleteCustomFood } from '../utils/api';

const EMPTY_FORM = {
  name: '', brand: '', servingSize: '100', calories: '', protein: '', carbs: '', fat: '', fiber: '',
};

export default function CustomFoods() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomFoods();
      setFoods(data?.foods || data || []);
    } catch (e) {
      console.log('Custom foods load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Required', 'Food name is required');
    if (!form.calories.trim()) return Alert.alert('Required', 'Calories are required');
    setSaving(true);
    try {
      await createCustomFood({
        name: form.name.trim(),
        brandName: form.brand.trim() || undefined,
        servingSize: parseFloat(form.servingSize) || 100,
        calories: parseFloat(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        fiber: parseFloat(form.fiber) || 0,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete', `Remove "${name}" from your custom foods?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteCustomFood(id);
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
    <View className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>Custom Foods</Text>
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            className="bg-green-600 rounded-xl px-4 py-2"
          >
            <Text className="text-white font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className={muted}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View className={`rounded-xl border p-3 mb-2 flex-row items-start justify-between ${card}`}>
              <View className="flex-1 mr-3">
                <Text className={`font-medium text-sm ${text}`} numberOfLines={1}>{item.name}</Text>
                {item.brandName ? (
                  <Text className={`text-xs ${muted}`}>{item.brandName}</Text>
                ) : null}
                <View className="flex-row flex-wrap gap-2 mt-1">
                  <View className="bg-green-50 dark:bg-green-900 px-2 py-0.5 rounded">
                    <Text className="text-xs font-semibold text-green-700 dark:text-green-400">
                      {item.calories} kcal
                    </Text>
                  </View>
                  <Text className={`text-xs ${muted}`}>{item.servingSize || 100}g</Text>
                  <Text className="text-xs text-blue-600 dark:text-blue-400">P:{item.protein || 0}g</Text>
                  <Text className="text-xs text-yellow-600 dark:text-yellow-400">C:{item.carbs || 0}g</Text>
                  <Text className="text-xs text-red-500 dark:text-red-400">F:{item.fat || 0}g</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item._id || item.id, item.name)}
                className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg items-center justify-center"
              >
                <Text className="text-red-600 dark:text-red-400 text-sm">✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View className={`rounded-2xl border p-8 items-center ${card}`}>
              <Text className="text-4xl mb-3">✏️</Text>
              <Text className={`text-sm text-center ${muted}`}>
                No custom foods yet.{'\n'}Tap "+ Add" to create your first food.
              </Text>
            </View>
          }
        />
      )}

      {/* Add food modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <View className="bg-black/40 flex-1" />
          <View className={`rounded-t-3xl px-5 pt-5 pb-10 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
            <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-4" />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className={`text-xl font-bold mb-4 ${text}`}>Add Custom Food</Text>
              <Field label="Name *" field="name" placeholder="Food name" />
              <Field label="Brand (optional)" field="brand" placeholder="Brand name" />
              <Field label="Serving Size (g)" field="servingSize" keyboardType="decimal-pad" placeholder="100" />
              <Field label="Calories (kcal) *" field="calories" keyboardType="decimal-pad" placeholder="0" />
              <Field label="Protein (g)" field="protein" keyboardType="decimal-pad" placeholder="0" />
              <Field label="Carbs (g)" field="carbs" keyboardType="decimal-pad" placeholder="0" />
              <Field label="Fat (g)" field="fat" keyboardType="decimal-pad" placeholder="0" />
              <Field label="Fiber (g)" field="fiber" keyboardType="decimal-pad" placeholder="0" />
              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  onPress={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl py-3 items-center"
                >
                  <Text className={`font-semibold ${text}`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-semibold">{saving ? 'Saving...' : 'Save Food'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
