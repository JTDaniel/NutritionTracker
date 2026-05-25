import React, { useContext } from 'react';
import { GamificationContext } from '../context/GamificationContext.js';
import { claimChallenge } from '../api.js';

export default function ChallengesWidget() {
  const { profile, refreshProfile } = useContext(GamificationContext);

  if (!profile || !profile.challenges) return null;

  const handleClaim = async (challengeId) => {
    try {
      await claimChallenge(challengeId);
      await refreshProfile();
    } catch (_) {}
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span>📅</span> Weekly Challenges
      </h3>
      <div className="space-y-3">
        {profile.challenges.map(ch => {
          const pct = Math.min(Math.round((ch.progress / ch.target) * 100), 100);
          return (
            <div key={ch.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <span>{ch.icon}</span>{ch.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                  {ch.progress}/{ch.target}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${ch.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {ch.completed && !ch.claimed ? (
                  <button
                    onClick={() => handleClaim(ch.id)}
                    className="text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
                  >
                    +{ch.xpReward} XP
                  </button>
                ) : ch.claimed ? (
                  <span className="text-xs text-green-500 flex-shrink-0">✓</span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{ch.xpReward} XP</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
