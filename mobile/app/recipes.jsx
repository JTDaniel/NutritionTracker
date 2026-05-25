import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, FlatList,
  Alert, Modal, TextInput, useColorScheme, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { getRecipes, deleteRecipe, addFoodLog, awardXP } from '../utils/api';

const today = () => new Date().toISOString().split('T')[0];

export default function Recipes() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [logModal, setLogModal] = useState(null);
  const [logDate, setLogDate] = useState(today());
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecipes();
      setRecipes(data?.recipes || data || []);
    } catch (e) {
      console.log('Recipes load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id, name) => {
    Alert.alert('Delete Recipe', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteRecipe(id);
            load();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  const handleLogRecipe = async () => {
    if (!logModal) return;
    setLogging(true);
    try {
      const recipe = logModal;
      const perServing = recipe.servings || 1;
      for (const ingredient of recipe.ingredients || []) {
        await addFoodLog(logDate, {
          name: ingredient.name || ingredient.foodName,
          calories: (ingredient.calories || 0) / perServing,
          protein: (ingredient.protein || 0) / perServing,
          carbs: (ingredient.carbs || 0) / perServing,
          fat: (ingredient.fat || 0) / perServing,
          servingSize: (ingredient.amount || 100) / perServing,
        });
      }
      await awardXP('FOOD_LOG').catch(() => {});
      setLogModal(null);
      Alert.alert('Logged!', `${recipe.name} has been added to your log for ${logDate}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLogging(false);
    }
  };

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = dark
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  const totalMacros = (recipe) => {
    const servings = recipe.servings || 1;
    const ingredients = recipe.ingredients || [];
    return {
      calories: Math.round(ingredients.reduce((s, i) => s + (i.calories || 0), 0) / servings),
      protein: Math.round(ingredients.reduce((s, i) => s + (i.protein || 0), 0) / servings),
      carbs: Math.round(ingredients.reduce((s, i) => s + (i.carbs || 0), 0) / servings),
      fat: Math.round(ingredients.reduce((s, i) => s + (i.fat || 0), 0) / servings),
    };
  };

  return (
    <View className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>📖 Recipes</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className={muted}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id || String(Math.random())}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const macros = totalMacros(item);
            const isExpanded = expanded === item._id;
            return (
              <View className={`rounded-2xl border mb-3 overflow-hidden ${card}`}>
                <TouchableOpacity
                  onPress={() => setExpanded(isExpanded ? null : item._id)}
                  className="p-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className={`font-semibold text-base ${text}`} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.servings ? (
                        <Text className={`text-xs ${muted}`}>{item.servings} serving{item.servings !== 1 ? 's' : ''}</Text>
                      ) : null}
                      <View className="flex-row flex-wrap gap-2 mt-2">
                        <View className="bg-green-50 dark:bg-green-900 px-2 py-0.5 rounded">
                          <Text className="text-xs font-semibold text-green-700 dark:text-green-400">
                            {macros.calories} kcal/serving
                          </Text>
                        </View>
                        <Text className="text-xs text-blue-600 dark:text-blue-400">P:{macros.protein}g</Text>
                        <Text className="text-xs text-yellow-600 dark:text-yellow-400">C:{macros.carbs}g</Text>
                        <Text className="text-xs text-red-500 dark:text-red-400">F:{macros.fat}g</Text>
                      </View>
                    </View>
                    <Text className={`text-xl ${muted}`}>{isExpanded ? '∧' : '∨'}</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View className="px-4 pb-4">
                    <Text className={`font-semibold text-sm mb-2 ${muted}`}>Ingredients</Text>
                    {(item.ingredients || []).map((ing, idx) => (
                      <View key={idx} className="flex-row items-center justify-between py-1.5">
                        <Text className={`text-sm flex-1 ${text}`}>{ing.name || ing.foodName}</Text>
                        <Text className={`text-xs ${muted}`}>{ing.amount || '—'}g</Text>
                      </View>
                    ))}
                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        onPress={() => { setLogModal(item); setLogDate(today()); }}
                        className="flex-1 bg-green-600 rounded-xl py-2.5 items-center"
                      >
                        <Text className="text-white font-semibold text-sm">Log Recipe</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item._id, item.name)}
                        className="w-10 bg-red-100 dark:bg-red-900 rounded-xl items-center justify-center"
                      >
                        <Text className="text-red-600 dark:text-red-400">✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View className={`rounded-2xl border p-8 items-center ${card}`}>
              <Text className="text-4xl mb-3">📖</Text>
              <Text className={`text-sm text-center ${muted}`}>
                No recipes yet.{'\n'}Create recipes in the web app.
              </Text>
            </View>
          }
        />
      )}

      {/* Log recipe modal */}
      <Modal visible={!!logModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <View className="bg-black/40 flex-1" />
          <View className={`rounded-t-3xl px-5 pt-5 pb-10 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
            <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-4" />
            <Text className={`text-lg font-bold mb-1 ${text}`}>Log Recipe</Text>
            <Text className={`text-sm mb-4 ${muted}`}>{logModal?.name}</Text>
            <Text className={`text-sm font-semibold mb-1 ${muted}`}>Date</Text>
            <TextInput
              value={logDate}
              onChangeText={setLogDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
              className={`border rounded-xl px-3 py-3 text-sm mb-4 ${inputCls}`}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setLogModal(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl py-3 items-center"
              >
                <Text className={`font-semibold ${text}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogRecipe}
                disabled={logging}
                className="flex-1 bg-green-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">{logging ? 'Logging...' : 'Log to Diary'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
