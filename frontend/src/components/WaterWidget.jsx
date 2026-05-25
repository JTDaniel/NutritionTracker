import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWaterLog, addWater } from '../api.js';

const GOAL_ML = 2500;
const mlToOz = (ml) => (ml * 0.033814).toFixed(1);
const today = () => new Date().toISOString().split('T')[0];

export default function WaterWidget() {
  const [totalMl, setTotalMl] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getWaterLog(today())
      .then(data => setTotalMl(data.log?.totalMl || 0))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (ml) => {
    setAdding(true);
    try {
      const data = await addWater(today(), ml);
      setTotalMl(data.log?.totalMl || 0);
    } catch (_) {}
    setAdding(false);
  };

  const pct = Math.min(100, Math.round((totalMl / GOAL_ML) * 100));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Water Today</h2>
        <Link to="/water" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Details →</Link>
      </div>
      {loading ? (
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💧</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">{totalMl} ml</span>
                <span className="text-gray-400 dark:text-gray-500">{GOAL_ML} ml goal</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{mlToOz(totalMl)} oz · {pct}%</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[250, 500].map(ml => (
              <button
                key={ml}
                onClick={() => handleAdd(ml)}
                disabled={adding}
                className="flex-1 btn-secondary text-xs py-1.5 text-blue-600 dark:text-blue-400"
              >
                +{ml}ml
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
