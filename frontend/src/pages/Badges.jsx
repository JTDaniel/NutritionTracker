import React, { useState, useEffect, useContext } from 'react';
import { getAllBadges } from '../api.js';
import { GamificationContext } from '../context/GamificationContext.js';

const CATEGORIES = ['All', 'Food', 'Nutrition', 'Exercise', 'Progress', 'Health', 'Streaks', 'XP'];

export default function Badges() {
  const { profile } = useContext(GamificationContext);
  const [allBadges, setAllBadges] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    getAllBadges().then(data => setAllBadges(data.badges || [])).catch(() => {});
  }, []);

  const earnedIds = new Set((profile?.badgesEarned || []).map(b => b.badgeId));
  const filtered = activeCategory === 'All' ? allBadges : allBadges.filter(b => b.category === activeCategory);
  const earnedCount = allBadges.filter(b => earnedIds.has(b.id)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Badges</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{earnedCount} / {allBadges.length} earned</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map(badge => {
          const earned = earnedIds.has(badge.id);
          const earnedDate = earned ? profile.badgesEarned.find(b => b.badgeId === badge.id)?.earnedAt : null;
          return (
            <div
              key={badge.id}
              className={`card text-center p-4 transition-all ${
                earned
                  ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <p className={`font-semibold text-sm mb-1 ${earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{badge.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{badge.desc}</p>
              {earned && earnedDate && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  {new Date(earnedDate).toLocaleDateString()}
                </p>
              )}
              {!earned && (
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">Locked</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
