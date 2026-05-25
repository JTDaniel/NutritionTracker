import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { getActiveFasting, getFastingSessions, startFasting, stopFasting, awardXP } from '../utils/api';

const WINDOWS = [
  { label: '12:12', hours: 12 },
  { label: '14:10', hours: 14 },
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
];

const fmtDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function Fasting() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [selectedWindow, setSelectedWindow] = useState(WINDOWS[2]); // 16:8 default
  const [activeFast, setActiveFast] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [active, history] = await Promise.all([
        getActiveFasting(),
        getFastingSessions(),
      ]);
      setActiveFast(active?.fast || null);
      setSessions(history?.sessions?.slice(0, 5) || []);
    } catch (e) {
      console.log('Fasting load error:', e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Tick timer
  useEffect(() => {
    if (activeFast?.startTime) {
      const tick = () => {
        const start = new Date(activeFast.startTime).getTime();
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeFast]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await startFasting(selectedWindow.hours);
      setActiveFast(result?.fast || { startTime: new Date().toISOString(), targetHours: selectedWindow.hours });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    Alert.alert('End Fast', 'Are you sure you want to end your fast?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Fast', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            const targetSecs = (activeFast?.targetHours || selectedWindow.hours) * 3600;
            const completed = elapsed >= targetSecs;
            await stopFasting();
            if (completed) {
              await awardXP('FASTING_COMPLETE').catch(() => {});
            }
            setActiveFast(null);
            load();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const targetSecs = (activeFast?.targetHours || selectedWindow.hours) * 3600;
  const pct = Math.min(100, Math.round((elapsed / targetSecs) * 100));
  const isActive = !!activeFast;

  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = dark ? 'text-white' : 'text-gray-900';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';

  return (
    <ScrollView className={`flex-1 ${bg}`}>
      <View className="px-4 pt-12 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ${text}`}>⏱ Fasting Timer</Text>
        </View>

        {/* Window selector */}
        {!isActive && (
          <View className="mb-4">
            <Text className={`font-semibold mb-2 ${muted}`}>Fasting Window</Text>
            <View className="flex-row gap-2 flex-wrap">
              {WINDOWS.map((w) => (
                <TouchableOpacity
                  key={w.label}
                  onPress={() => setSelectedWindow(w)}
                  className={`px-4 py-2 rounded-xl ${selectedWindow.label === w.label
                    ? 'bg-orange-500'
                    : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Text className={`font-semibold ${selectedWindow.label === w.label ? 'text-white' : text}`}>
                    {w.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Timer display */}
        <View className={`rounded-2xl border p-6 mb-4 items-center ${card}`}>
          {isActive ? (
            <>
              <Text className={`text-sm font-semibold mb-2 ${muted}`}>
                {activeFast.targetHours}h Fast in Progress
              </Text>
            </>
          ) : (
            <Text className={`text-sm font-semibold mb-2 ${muted}`}>
              {selectedWindow.hours}h Fast Selected
            </Text>
          )}

          <Text className={`text-5xl font-bold font-mono mb-4 ${isActive ? 'text-orange-500' : text}`}>
            {fmtDuration(elapsed)}
          </Text>

          <View className="w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
            <View
              className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${pct}%` }}
            />
          </View>

          <Text className={`text-sm ${muted}`}>
            {pct >= 100
              ? '🎉 Fast complete!'
              : isActive
                ? `${pct}% · ${fmtDuration(Math.max(0, targetSecs - elapsed))} remaining`
                : `Target: ${selectedWindow.hours}h`
            }
          </Text>
        </View>

        {/* Start / Stop button */}
        {isActive ? (
          <TouchableOpacity
            onPress={handleStop}
            disabled={loading}
            className="bg-red-500 rounded-xl py-4 items-center mb-4"
          >
            <Text className="text-white font-bold text-lg">⏹ Stop Fast</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStart}
            disabled={loading}
            className="bg-orange-500 rounded-xl py-4 items-center mb-4"
          >
            <Text className="text-white font-bold text-lg">▶ Start Fast</Text>
          </TouchableOpacity>
        )}

        {/* Session history */}
        <Text className={`font-semibold mb-3 ${text}`}>Recent Sessions</Text>
        {sessions.length === 0 ? (
          <View className={`rounded-2xl border p-6 items-center ${card}`}>
            <Text className="text-3xl mb-2">⏱</Text>
            <Text className={`text-sm ${muted}`}>No fasting sessions yet</Text>
          </View>
        ) : (
          sessions.map((session, index) => {
            const durationHours = session.durationMinutes
              ? (session.durationMinutes / 60).toFixed(1)
              : '—';
            return (
              <View key={index} className={`rounded-xl border p-3 mb-2 flex-row items-center ${card}`}>
                <Text className="text-2xl mr-3">
                  {session.completed ? '✅' : '⏹'}
                </Text>
                <View className="flex-1">
                  <Text className={`font-medium text-sm ${text}`}>
                    {session.targetHours}h fast · {durationHours}h elapsed
                  </Text>
                  <Text className={`text-xs ${muted}`}>
                    {session.startTime ? new Date(session.startTime).toLocaleDateString() : ''}
                    {session.completed ? ' · Completed' : ' · Stopped early'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
