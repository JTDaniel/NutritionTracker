import React, { useState, useEffect, useCallback, useContext } from 'react';
import { getStreaks } from '../api.js';
import { useShield } from '../api.js';
import { GamificationContext } from '../context/GamificationContext.js';

const getFlame = (current) => {
  if (current === 0) return null;
  if (current >= 30) return { flames: '🔥🔥🔥', cls: 'text-yellow-400 animate-pulse text-2xl', label: 'On Fire!' };
  if (current >= 7) return { flames: '🔥🔥', cls: 'text-orange-500 text-xl', label: 'Hot Streak' };
  return { flames: '🔥', cls: 'text-orange-400 text-base', label: '' };
};

const StreakCard = ({ title, icon, current, best }) => {
  const flame = getFlame(current);
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {flame && (
          <span className={flame.cls} title={flame.label}>{flame.flames}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className={`text-3xl font-bold ${current >= 30 ? 'text-yellow-500' : current >= 7 ? 'text-orange-500' : 'text-green-600 dark:text-green-400'}`}>
            {current}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Current Streak</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{current === 1 ? 'day' : 'days'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{best}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Best Streak</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{best === 1 ? 'day' : 'days'}</p>
        </div>
      </div>
    </div>
  );
};

export default function Streaks() {
  const { profile, refreshProfile } = useContext(GamificationContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shieldUsing, setShieldUsing] = useState(false);
  const [shieldMsg, setShieldMsg] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getStreaks();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUseShield = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setShieldUsing(true);
    setShieldMsg(null);
    try {
      await useShield(yesterdayStr);
      setShieldMsg(`Shield used for ${yesterdayStr}. Your streak is protected!`);
      await refreshProfile();
      await loadData();
    } catch (err) {
      setShieldMsg('Failed to use shield: ' + err.message);
    } finally {
      setShieldUsing(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Streaks & Consistency</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadData} className="btn-primary mt-3">Retry</button>
        </div>
      ) : !data ? null : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Days Logged</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalLoggedDays}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">all time</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Weigh-Ins</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalWeighIns}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">all time</p>
            </div>
          </div>

          {/* Shield section */}
          {profile && profile.shields > 0 && (
            <div className="card border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                    You have {profile.shields} streak shield{profile.shields > 1 ? 's' : ''}!
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">
                    A shield protects your streak for a missed day. Use one to restore yesterday's streak.
                  </p>
                  {shieldMsg && (
                    <p className="text-sm mt-2 font-medium text-yellow-900 dark:text-yellow-200">{shieldMsg}</p>
                  )}
                  <button
                    onClick={handleUseShield}
                    disabled={shieldUsing}
                    className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-1.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {shieldUsing ? 'Using...' : 'Use Shield to restore yesterday\'s streak'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Streak Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StreakCard
              title="Food Logging"
              icon="📋"
              current={data.logging?.current || 0}
              best={data.logging?.best || 0}
            />
            <StreakCard
              title="On-Target Calories"
              icon="🎯"
              current={data.onTarget?.current || 0}
              best={data.onTarget?.best || 0}
            />
            <StreakCard
              title="Exercise"
              icon="🏃"
              current={data.exercise?.current || 0}
              best={data.exercise?.best || 0}
            />
            <StreakCard
              title="Weigh-In"
              icon="⚖️"
              current={data.weighIn?.current || 0}
              best={data.weighIn?.best || 0}
            />
          </div>

          {/* Motivation Message */}
          <div className="card bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <span className="text-3xl">
                {data.logging?.current >= 30 ? '🏆' : data.logging?.current >= 7 ? '🔥' : data.logging?.current >= 3 ? '⚡' : '💪'}
              </span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {data.logging?.current >= 30
                    ? 'Incredible! 30+ day streak!'
                    : data.logging?.current >= 7
                      ? `${data.logging.current} day logging streak — keep it up!`
                      : data.logging?.current >= 1
                        ? `${data.logging.current} day${data.logging.current !== 1 ? 's' : ''} in a row — great start!`
                        : 'Start logging today to build your streak!'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {data.onTarget?.current >= 1
                    ? `You've been on target for ${data.onTarget.current} consecutive day${data.onTarget.current !== 1 ? 's' : ''}.`
                    : 'Log today and hit your calorie target to start an on-target streak.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
