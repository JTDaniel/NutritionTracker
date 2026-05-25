import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, useColorScheme, KeyboardAvoidingView, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { lookupBarcode, addFoodLog, awardXP } from '../utils/api';

const today = () => new Date().toISOString().split('T')[0];

export default function BarcodeScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [foundFood, setFoundFood] = useState(null);
  const [servingSize, setServingSize] = useState('');
  const [logDate, setLogDate] = useState(today());
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleBarcode = async (barcode) => {
    if (scanned) return;
    setScanned(true);
    setError('');
    setFoundFood(null);
    setSuccessMsg('');
    try {
      const data = await lookupBarcode(barcode);
      if (data?.food) {
        setFoundFood(data.food);
        setServingSize(String(data.food.servingSize || 100));
      } else {
        setError('No food found for this barcode.');
      }
    } catch (e) {
      setError(`Not found: ${e.message}`);
    }
  };

  const handleManualLookup = async () => {
    if (!manualBarcode.trim()) return;
    setError('');
    setFoundFood(null);
    setSuccessMsg('');
    await handleBarcode(manualBarcode.trim());
  };

  const scaledNutrition = () => {
    if (!foundFood) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const size = parseFloat(servingSize) || 100;
    const base = foundFood.servingSize || 100;
    const scale = size / base;
    return {
      calories: Math.round((foundFood.calories || 0) * scale),
      protein: Math.round((foundFood.protein || 0) * scale),
      carbs: Math.round((foundFood.carbs || 0) * scale),
      fat: Math.round((foundFood.fat || 0) * scale),
    };
  };

  const handleAdd = async () => {
    if (!foundFood) return;
    setAdding(true);
    try {
      const size = parseFloat(servingSize) || 100;
      const base = foundFood.servingSize || 100;
      const scale = size / base;
      await addFoodLog(logDate, {
        name: foundFood.name,
        brandName: foundFood.brandName,
        servingSize: size,
        calories: (foundFood.calories || 0) * scale,
        protein: (foundFood.protein || 0) * scale,
        carbs: (foundFood.carbs || 0) * scale,
        fat: (foundFood.fat || 0) * scale,
        fiber: (foundFood.fiber || 0) * scale,
      });
      await awardXP('FOOD_LOG').catch(() => {});
      setSuccessMsg(`✓ ${foundFood.name} added to log!`);
      setFoundFood(null);
      setScanned(false);
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

  const scaled = scaledNutrition();

  if (!permission) {
    return (
      <View className={`flex-1 items-center justify-center ${bg}`}>
        <Text className={muted}>Requesting camera permission...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${bg}`}
    >
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="px-4 pt-12 pb-8">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-2xl text-gray-400">‹</Text>
            </TouchableOpacity>
            <Text className={`text-2xl font-bold flex-1 ${text}`}>Barcode Scanner</Text>
          </View>

          {/* Camera */}
          {permission.granted ? (
            <View className="rounded-2xl overflow-hidden mb-4" style={{ height: 220 }}>
              {!scanned ? (
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={({ data }) => handleBarcode(data)}
                  barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
                />
              ) : (
                <View className="flex-1 bg-gray-200 dark:bg-gray-700 items-center justify-center">
                  <Text className="text-4xl mb-2">📷</Text>
                  <Text className={`text-sm ${muted}`}>
                    {foundFood ? 'Food found!' : 'Scan complete'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setScanned(false); setFoundFood(null); setError(''); setSuccessMsg(''); }}
                    className="mt-3 bg-green-600 rounded-xl px-4 py-2"
                  >
                    <Text className="text-white font-semibold">Scan Again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View className={`rounded-2xl p-6 items-center mb-4 ${card}`}>
              <Text className="text-4xl mb-3">📷</Text>
              <Text className={`text-sm text-center mb-3 ${muted}`}>
                Camera permission is required to scan barcodes
              </Text>
              <TouchableOpacity onPress={requestPermission} className="bg-green-600 rounded-xl px-5 py-3">
                <Text className="text-white font-semibold">Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Manual entry */}
          <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
            <Text className={`font-semibold mb-2 ${text}`}>Manual Barcode Entry</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={manualBarcode}
                onChangeText={setManualBarcode}
                placeholder="Enter barcode number..."
                placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                keyboardType="numeric"
                onSubmitEditing={handleManualLookup}
                className={`flex-1 border rounded-xl px-3 py-3 text-sm ${inputCls}`}
              />
              <TouchableOpacity
                onPress={handleManualLookup}
                className="bg-green-600 rounded-xl px-4 items-center justify-center"
              >
                <Text className="text-white font-semibold">Look Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <Text className="text-red-500 text-sm mb-4">{error}</Text>
          ) : null}

          {/* Success */}
          {successMsg ? (
            <View className="bg-green-100 dark:bg-green-900 rounded-xl p-4 mb-4 items-center">
              <Text className="text-green-700 dark:text-green-300 font-semibold">{successMsg}</Text>
            </View>
          ) : null}

          {/* Found food */}
          {foundFood && (
            <View className={`rounded-2xl border p-4 mb-4 ${card}`}>
              <Text className={`text-lg font-bold mb-0.5 ${text}`}>{foundFood.name}</Text>
              {foundFood.brandName ? (
                <Text className={`text-sm mb-3 ${muted}`}>{foundFood.brandName}</Text>
              ) : <View className="mb-3" />}

              <Text className={`text-sm font-semibold mb-1 ${muted}`}>Serving Size (g)</Text>
              <TextInput
                value={servingSize}
                onChangeText={setServingSize}
                keyboardType="numeric"
                className={`border rounded-xl px-3 py-3 text-sm mb-3 ${inputCls}`}
              />

              <Text className={`text-sm font-semibold mb-1 ${muted}`}>Date</Text>
              <TextInput
                value={logDate}
                onChangeText={setLogDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={dark ? '#6b7280' : '#9ca3af'}
                className={`border rounded-xl px-3 py-3 text-sm mb-4 ${inputCls}`}
              />

              <View className="flex-row justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
                <View className="items-center">
                  <Text className="text-lg font-bold text-green-600 dark:text-green-400">{scaled.calories}</Text>
                  <Text className={`text-xs ${muted}`}>kcal</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">{scaled.protein}g</Text>
                  <Text className={`text-xs ${muted}`}>Protein</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{scaled.carbs}g</Text>
                  <Text className={`text-xs ${muted}`}>Carbs</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-red-500 dark:text-red-400">{scaled.fat}g</Text>
                  <Text className={`text-xs ${muted}`}>Fat</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAdd}
                disabled={adding}
                className="bg-green-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">
                  {adding ? 'Adding...' : 'Add to Log'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
