import { useState, useCallback, useRef } from 'react';
import { getGamificationProfile, awardXP as apiAwardXP } from '../api.js';

export function useGamification(userId) {
  const [profile, setProfile] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [levelUpData, setLevelUpData] = useState(null);
  const [milestoneData, setMilestoneData] = useState(null);
  const toastId = useRef(0);

  const addToast = useCallback((toast) => {
    const id = toastId.current++;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getGamificationProfile();
      setProfile(data);
    } catch (_) {}
  }, [userId]);

  const triggerAward = useCallback(async (action) => {
    try {
      const result = await apiAwardXP(action);
      if (result.xpGained > 0) {
        addToast({ type: 'xp', message: `+${result.xpGained} XP`, sub: action.replace(/_/g, ' ').toLowerCase() });
      }
      if (result.leveledUp) {
        setLevelUpData({ level: result.level, title: result.title });
      }
      if (result.newBadges && result.newBadges.length > 0) {
        result.newBadges.forEach(badge => {
          addToast({ type: 'badge', message: `Badge: ${badge.name}`, sub: badge.desc, icon: badge.icon });
        });
      }
      if (result.newMilestones && result.newMilestones.length > 0) {
        result.newMilestones.forEach(lbs => {
          setMilestoneData({ lbs });
        });
      }
      // Update profile state
      setProfile(prev => prev ? {
        ...prev,
        xp: result.totalXP,
        level: result.level,
        title: result.title,
        shields: result.shields
      } : prev);
    } catch (_) {}
  }, [addToast]);

  return { profile, setProfile, toasts, levelUpData, setLevelUpData, milestoneData, setMilestoneData, refreshProfile, triggerAward };
}
