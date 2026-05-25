import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function FoodCard({ food, onAdd, onDelete, index, showAdd = false, dietCompliance }) {
  const serving = food.servingSize || 100;
  const scale = serving / 100;
  const calories = Math.round((food.calories || 0) * scale);
  const protein = Math.round((food.protein || 0) * scale);
  const carbs = Math.round((food.carbs || 0) * scale);
  const fat = Math.round((food.fat || 0) * scale);

  return (
    <View className="flex-row items-start justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mb-2">
      <View className="flex-1 mr-3">
        <Text className="font-medium text-gray-900 dark:text-white text-sm" numberOfLines={1}>
          {food.name}
        </Text>
        {food.brandName ? (
          <Text className="text-xs text-gray-400 dark:text-gray-500" numberOfLines={1}>
            {food.brandName}
          </Text>
        ) : null}
        {dietCompliance && (
          <View className={`self-start px-1.5 py-0.5 rounded mt-1 ${
            dietCompliance.compliant === true ? 'bg-green-100 dark:bg-green-900' :
            dietCompliance.compliant === 'warn' ? 'bg-yellow-100 dark:bg-yellow-900' :
            'bg-red-100 dark:bg-red-900'
          }`}>
            <Text className={`text-xs ${
              dietCompliance.compliant === true ? 'text-green-700 dark:text-green-300' :
              dietCompliance.compliant === 'warn' ? 'text-yellow-700 dark:text-yellow-300' :
              'text-red-600 dark:text-red-400'
            }`}>{dietCompliance.label}</Text>
          </View>
        )}
        <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
          <View className="bg-green-50 dark:bg-green-900 px-2 py-0.5 rounded">
            <Text className="text-sm font-semibold text-green-700 dark:text-green-400">{calories} kcal</Text>
          </View>
          <Text className="text-xs text-gray-400 dark:text-gray-500">
            {food.householdServing ? `${food.householdServing} (${serving}g)` : `${serving}g`}
          </Text>
          <Text className="text-xs text-blue-600 dark:text-blue-400">P:{protein}g</Text>
          <Text className="text-xs text-yellow-600 dark:text-yellow-400">C:{carbs}g</Text>
          <Text className="text-xs text-red-500 dark:text-red-400">F:{fat}g</Text>
        </View>
      </View>
      <View className="flex-row gap-2 items-center">
        {showAdd && onAdd && (
          <TouchableOpacity
            onPress={() => onAdd(food)}
            className="w-9 h-9 bg-green-600 rounded-xl items-center justify-center"
          >
            <Text className="text-white text-xl font-bold">+</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(index)}
            className="w-9 h-9 bg-red-100 dark:bg-red-900 rounded-xl items-center justify-center"
          >
            <Text className="text-red-600 dark:text-red-400 text-base">✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
