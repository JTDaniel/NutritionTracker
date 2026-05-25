import React, { useState, useEffect, useCallback, useContext } from 'react';
import { getWaterLog, addWater } from '../api.js';
import { GamificationContext } from '../context/GamificationContext.js';

const today = () => new Date().toISOString().split('T')[0];
const GOAL_ML = 2500;
const mlToOz = (ml) => (ml * 0.033814).toFixed(1);

export default function Water() {
  const { triggerAward } = useContext(GamificationContext);
  const [date, setDate] = useState(today());
  const [log, setLog] = useState({ totalMl: 0, entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customMl, setCustomMl] = useState(250);
  const [adding, setAdding] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const loadLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWaterLog(date);
      setLog(data.log || { totalMl: 0, entries: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadLog(); }, [loadLog]);

  const handleAdd = async (ml) => {
    setAdding(true);
    try {
      const prevTotal = log.totalMl || 0;
      const data = await addWater(date, ml);
      const newTotal = data.log?.totalMl || 0;
      setLog(data.log);
      if (prevTotal < GOAL_ML && newTotal >= GOAL_ML) {
        triggerAward('WATER_GOAL_HIT');
      }
    } catch (err) {
      alert('Failed to add water: ' + err.message);
    } finally {
      setAdding(false);
      setShowCustom(false);
    }
  };

  const totalMl = log.totalMl || 0;
  const pct = Math.min(100, Math.round((totalMl / GOAL_ML) * 100));
  const remaining = Math.max(0, GOAL_ML - totalMl);

  const ringRadius = 54;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - pct / 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Water Tracker</h1>
        <div>
          <label className="label sr-only">Date</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadLog} className="btn-primary mt-3">Retry</button>
        </div>
      ) : (
        <>
          {/* Progress Ring */}
          <div className="card flex flex-col items-center py-8">
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={ringRadius} fill="none" stroke={`${('#e5e7eb')}`} strokeWidth="10" className="stroke-gray-200 dark:stroke-gray-700" />
                <circle
                  cx="60" cy="60" r={ringRadius}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pct}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">of goal</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalMl} ml</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{mlToOz(totalMl)} oz · Goal: {GOAL_ML} ml ({mlToOz(GOAL_ML)} oz)</p>
            {remaining > 0 ? (
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">{remaining} ml more to reach goal</p>
            ) : (
              <p className="text-green-600 dark:text-green-400 font-semibold mt-1">Goal reached!</p>
            )}
          </div>

          {/* Quick Add Buttons */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Quick Add</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[250, 350, 500, 750].map(ml => (
                <button
                  key={ml}
                  onClick={() => handleAdd(ml)}
                  disabled={adding}
                  className="btn-secondary flex flex-col items-center py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                >
                  <span className="text-xl font-bold">+{ml}</span>
                  <span className="text-xs">ml</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{mlToOz(ml)} oz</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              {!showCustom ? (
                <button className="btn-secondary w-full text-sm" onClick={() => setShowCustom(true)}>
                  + Custom Amount
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input flex-1"
                    value={customMl}
                    min="1"
                    step="10"
                    onChange={e => setCustomMl(Math.max(1, parseInt(e.target.value) || 250))}
                    placeholder="Amount in ml"
                  />
                  <button className="btn-primary px-4" onClick={() => handleAdd(customMl)} disabled={adding}>
                    Add
                  </button>
                  <button className="btn-secondary px-4" onClick={() => setShowCustom(false)}>Cancel</button>
                </div>
              )}
            </div>
          </div>

          {/* Today's Entries */}
          {log.entries && log.entries.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Today's Log</h2>
              <div className="space-y-2">
                {[...log.entries].reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500 text-lg">💧</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{entry.ml} ml</span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">{mlToOz(entry.ml)} oz</span>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
