import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, FlatList, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { getAllBadges, getGamificationProfile } from '../utils/api';

export default function Badges() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [allBadges, setAllBadges] = useState([]);
  const [earnedIds, setEarnedIds] = useState(new Set());
  const [earnedDates, setEarnedDates] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [badges, profile] = await Promise.all([
        getAllBadges(),
        getGamificationProfile(),
      ]);
      const badgeList = badges?.badges || badges || [];
      setAllBadges(badgeList);

      // Extract unique categories
      const cats = ['All', ...new Set(badgeList.map(b => b.category).filter(Boolean))];
      setCategories(cats);

      // Map earned badges
      const earned = new Set();
      const dates = {};
      (profile?.badges || []).forEach(b => {
        const id = b.badgeId || b._id || b;
        earned.add(id);
        if (b.earnedAt) dates[id] = b.earnedAt;
      });
      setEarnedIds(earned);
      setEarnedDates(dates);
    } catch (e) {
      console.log('Badges load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';

  const filtered = selectedCategory === 'All'
    ? allBadges
    : allBadges.filter(b => b.category === selectedCategory);

  const earnedCount = allBadges.filter(b => earnedIds.has(b._id || b.id)).length;

  return (
    <View className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-2">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${text}`}>🏆 Badges</Text>
            <Text className={`text-sm ${muted}`}>
              {earnedCount} / {allBadges.length} earned
            </Text>
          </View>
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2 pb-1">
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full ${
                  selectedCategory === cat ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <Text className={`text-sm font-semibold ${
                  selectedCategory === cat ? 'text-white' : text
                }`}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className={muted}>Loading badges...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id || item.id || item.name}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          renderItem={({ item }) => {
            const badgeId = item._id || item.id;
            const isEarned = earnedIds.has(badgeId);
            const earnDate = earnedDates[badgeId];
            return (
              <View className={`flex-1 rounded-2xl border p-4 items-center ${card} ${!isEarned ? 'opacity-50' : ''}`}>
                <Text className="text-4xl mb-2">{item.emoji || '🏅'}</Text>
                <Text className={`font-semibold text-sm text-center ${text}`} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.category && (
                  <View className="mt-1 px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900">
                    <Text className="text-xs text-indigo-700 dark:text-indigo-300">{item.category}</Text>
                  </View>
                )}
                {isEarned ? (
                  <View className="mt-2 items-center">
                    <Text className="text-green-600 dark:text-green-400 text-xs font-semibold">✓ Earned</Text>
                    {earnDate && (
                      <Text className={`text-xs ${muted}`}>
                        {new Date(earnDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text className={`text-xs mt-2 text-center ${muted}`} numberOfLines={2}>
                    {item.description || 'Keep going!'}
                  </Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">🏆</Text>
              <Text className={`text-sm ${muted}`}>No badges in this category</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
