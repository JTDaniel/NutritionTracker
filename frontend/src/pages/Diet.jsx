import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { DIETS, getDiet } from '../utils/dietUtils.js';
import { getUser, updateUser } from '../api.js';

export default function Diet() {
  const [activeDiet, setActiveDiet] = useState(localStorage.getItem('nt-diet') || 'none');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const diet = getDiet(activeDiet);

  const COLOR_CLASSES = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
  };

  const handleSave = async (dietId) => {
    setActiveDiet(dietId);
    localStorage.setItem('nt-diet', dietId);
    setSaving(true);
    try {
      await updateUser({ dietType: dietId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diet Type</h1>
        {saved && <span className="text-green-600 dark:text-green-400 text-sm font-medium">✓ Saved</span>}
      </div>

      {/* Active diet banner */}
      {activeDiet !== 'none' && (
        <div className={`card border ${COLOR_CLASSES[diet.color] || COLOR_CLASSES.gray}`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{diet.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-lg">{diet.name}</p>
              <p className="text-sm opacity-80 mt-0.5">{diet.description}</p>
              {diet.macroSplit && (
                <div className="flex gap-4 mt-2 text-xs font-medium">
                  <span>Protein: {diet.macroSplit.protein}%</span>
                  <span>Fat: {diet.macroSplit.fat}%</span>
                  <span>Carbs: {diet.macroSplit.carbs}%</span>
                </div>
              )}
              {Object.keys(diet.dailyLimits).length > 0 && (
                <div className="flex gap-4 mt-1 text-xs">
                  {diet.dailyLimits.netCarbs && <span>Net carb limit: {diet.dailyLimits.netCarbs}g/day</span>}
                  {diet.dailyLimits.sodium && <span>Sodium limit: {diet.dailyLimits.sodium}mg/day</span>}
                  {diet.dailyLimits.sugar !== undefined && <span>Added sugar: {diet.dailyLimits.sugar === 0 ? 'none' : `<${diet.dailyLimits.sugar}g`}</span>}
                </div>
              )}
            </div>
          </div>
          {diet.tips.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-2">Tips</p>
              <ul className="space-y-1">
                {diet.tips.map((tip, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="mt-0.5 opacity-60">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Diet grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DIETS.map(d => (
          <button
            key={d.id}
            onClick={() => handleSave(d.id)}
            disabled={saving}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              activeDiet === d.id
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{d.icon}</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{d.name}</span>
              {activeDiet === d.id && (
                <span className="ml-auto text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{d.description}</p>
            {d.macroSplit && (
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">P {d.macroSplit.protein}%</span>
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">F {d.macroSplit.fat}%</span>
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">C {d.macroSplit.carbs}%</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Compliance indicators in food search are keyword-based estimates — always verify with product labels.
      </p>
    </div>
  );
}
