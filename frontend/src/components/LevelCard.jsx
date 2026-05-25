import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { GamificationContext } from '../context/GamificationContext.js';

export default function LevelCard() {
  const { profile } = useContext(GamificationContext);
  if (!profile) return null;

  const { level, title, xp, xpForCurrentLevel, xpForNextLevel, shields } = profile;
  const progress = xpForNextLevel > xpForCurrentLevel
    ? Math.round(((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100)
    : 100;

  return (
    <div className="card bg-gradient-to-br from-indigo-600 to-purple-700 border-0 text-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-indigo-200 text-xs uppercase tracking-wide">Level {level}</p>
          <p className="text-xl font-bold">{title}</p>
        </div>
        <div className="text-right">
          <p className="text-indigo-200 text-xs">Total XP</p>
          <p className="text-2xl font-bold">{xp.toLocaleString()}</p>
        </div>
      </div>

      {/* XP bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-indigo-200 mb-1">
          <span>{xp - xpForCurrentLevel} / {xpForNextLevel - xpForCurrentLevel} XP</span>
          <span>Level {level + 1}</span>
        </div>
        <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <NavLink to="/badges" className="text-indigo-200 hover:text-white underline">
          {(profile.badgesEarned || []).length} badges earned
        </NavLink>
        {shields > 0 && (
          <span className="flex items-center gap-1 text-yellow-300">
            🛡️ {shields} shield{shields > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
