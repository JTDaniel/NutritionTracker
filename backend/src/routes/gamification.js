const express = require('express');
const router = express.Router();
const GamificationProfile = require('../models/GamificationProfile');
const FoodLog = require('../models/FoodLog');
const ExerciseLog = require('../models/ExerciseLog');
const WeightLog = require('../models/WeightLog');
const WaterLog = require('../models/WaterLog');
const FastingSession = require('../models/FastingSession');
const CustomFood = require('../models/CustomFood');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { calculateUserTDEE } = require('../utils/tdee');

// ─── Constants ────────────────────────────────────────────────────────────────

const BADGES = [
  { id: 'first_log', name: 'First Log', desc: 'Log your first food', icon: '🍽️', category: 'Food' },
  { id: 'week_warrior', name: 'Week Warrior', desc: '7-day food logging streak', icon: '🗓️', category: 'Food' },
  { id: 'month_master', name: 'Month Master', desc: '30-day food logging streak', icon: '📅', category: 'Food' },
  { id: 'on_target', name: 'On Target', desc: 'Hit your calorie goal for the first time', icon: '🎯', category: 'Nutrition' },
  { id: 'target_week', name: 'Target Week', desc: 'Hit calorie goal 7 days in a row', icon: '🏹', category: 'Nutrition' },
  { id: 'first_exercise', name: 'Sweat Session', desc: 'Log your first exercise', icon: '🏃', category: 'Exercise' },
  { id: 'workouts_10', name: 'Workout Warrior', desc: 'Log 10 total workouts', icon: '💪', category: 'Exercise' },
  { id: 'workouts_100', name: 'Iron Will', desc: 'Log 100 total workouts', icon: '🏋️', category: 'Exercise' },
  { id: 'first_weighin', name: 'Scale Buddy', desc: 'Log your first weigh-in', icon: '⚖️', category: 'Progress' },
  { id: 'first_water_goal', name: 'Hydrated', desc: 'Hit your daily water goal', icon: '💧', category: 'Health' },
  { id: 'water_week', name: 'Hydration Hero', desc: 'Hit water goal 7 days in a row', icon: '🌊', category: 'Health' },
  { id: 'first_fast', name: 'Fast Starter', desc: 'Complete your first fast', icon: '⏱️', category: 'Health' },
  { id: 'fasts_10', name: 'Fasting Master', desc: 'Complete 10 fasting sessions', icon: '🧘', category: 'Health' },
  { id: 'lost_5lbs', name: 'Down 5', desc: 'Lost 5 lbs from starting weight', icon: '📉', category: 'Progress' },
  { id: 'lost_10lbs', name: 'Down 10', desc: 'Lost 10 lbs from starting weight', icon: '🌟', category: 'Progress' },
  { id: 'lost_25lbs', name: 'Down 25', desc: 'Lost 25 lbs — incredible!', icon: '🏆', category: 'Progress' },
  { id: 'custom_food', name: 'Custom Cook', desc: 'Create a custom food', icon: '🥘', category: 'Food' },
  { id: 'first_recipe', name: 'Master Chef', desc: 'Create your first recipe', icon: '📖', category: 'Food' },
  { id: 'streak_30', name: 'Unstoppable', desc: 'Reach a 30-day streak', icon: '🔥', category: 'Streaks' },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach Level 5', icon: '⭐', category: 'XP' },
  { id: 'level_10', name: 'Elite', desc: 'Reach Level 10', icon: '💫', category: 'XP' },
];
module.exports.BADGES = BADGES;

const CHALLENGE_POOL = [
  { id: 'log5', title: 'Log food 5 days this week', metric: 'foodLogDays', target: 5, xpReward: 75, icon: '📝' },
  { id: 'log7', title: 'Log food every day this week', metric: 'foodLogDays', target: 7, xpReward: 150, icon: '📋' },
  { id: 'protein4', title: 'Hit protein goal 4 days', metric: 'proteinGoalDays', target: 4, xpReward: 75, icon: '💪' },
  { id: 'exercise3', title: 'Exercise 3 times this week', metric: 'exerciseSessions', target: 3, xpReward: 75, icon: '🏃' },
  { id: 'exercise5', title: 'Exercise 5 times this week', metric: 'exerciseSessions', target: 5, xpReward: 125, icon: '🔥' },
  { id: 'water5', title: 'Hit water goal 5 days', metric: 'waterGoalDays', target: 5, xpReward: 75, icon: '💧' },
  { id: 'target4', title: 'Hit calorie target 4 days', metric: 'calorieTargetDays', target: 4, xpReward: 100, icon: '🎯' },
  { id: 'target5', title: 'Hit calorie target 5 days', metric: 'calorieTargetDays', target: 5, xpReward: 125, icon: '🏹' },
  { id: 'fasting1', title: 'Complete a fasting session', metric: 'fastingSessions', target: 1, xpReward: 50, icon: '⏱️' },
  { id: 'weighin3', title: 'Weigh in 3 times this week', metric: 'weighInDays', target: 3, xpReward: 50, icon: '⚖️' },
];

const getWeekKey = () => {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((now - jan1) / 86400000) + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const getWeekBounds = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = d => d.toISOString().split('T')[0];
  return { start: fmt(monday), end: fmt(sunday) };
};

const getWeeklyChallenges = (weekKey) => {
  let seed = weekKey.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
  seed = Math.abs(seed);
  const indices = new Set();
  while (indices.size < 3) {
    indices.add(seed % CHALLENGE_POOL.length);
    seed = Math.abs((seed * 1664525 + 1013904223) | 0);
  }
  return [...indices].map(i => CHALLENGE_POOL[i]);
};

const getLevel = (xp) => Math.floor(1 + Math.sqrt(xp / 100));
const getXPForLevel = (level) => Math.pow(level - 1, 2) * 100;
const getTitle = (level) => {
  if (level <= 2) return 'Beginner';
  if (level <= 4) return 'Consistent';
  if (level <= 6) return 'Dedicated';
  if (level <= 9) return 'Athlete';
  if (level <= 14) return 'Champion';
  return 'Legend';
};

const today = () => new Date().toISOString().split('T')[0];

const calcCurrentStreak = (dates, extraDates = []) => {
  const all = [...new Set([...dates, ...extraDates])].sort();
  if (all.length === 0) return 0;
  const todayStr = today();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const last = all[all.length - 1];
  if (last !== todayStr && last !== yesterdayStr) return 0;
  let streak = 1;
  for (let i = all.length - 2; i >= 0; i--) {
    const d1 = new Date(all[i]);
    const d2 = new Date(all[i + 1]);
    if ((d2 - d1) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
};

// ─── Badge checker ────────────────────────────────────────────────────────────

async function checkAndAwardBadges(userId, profile, calorieTargetHit = false) {
  const earnedIds = new Set(profile.badgesEarned.map(b => b.badgeId));
  const newBadges = [];
  const earn = (badgeId) => {
    if (!earnedIds.has(badgeId)) {
      earnedIds.add(badgeId);
      newBadges.push(BADGES.find(b => b.id === badgeId));
      profile.badgesEarned.push({ badgeId, earnedAt: new Date() });
    }
  };

  const [foodLogs, exerciseLogs, weightLogs, fastingSessions, customFoods, recipes, waterLogs] = await Promise.all([
    FoodLog.find({ userId }).lean(),
    ExerciseLog.find({ userId }).lean(),
    WeightLog.find({ userId }).sort({ date: 1 }).lean(),
    FastingSession.countDocuments({ userId, completed: true }),
    CustomFood.countDocuments({ userId }),
    Recipe.countDocuments({ userId }),
    WaterLog.find({ userId }).lean()
  ]);

  // Food logging
  if (foodLogs.length >= 1) earn('first_log');
  const foodStreak = calcCurrentStreak(foodLogs.map(l => l.date), profile.shieldProtectedDates);
  if (foodStreak >= 7) earn('week_warrior');
  if (foodStreak >= 30) { earn('month_master'); earn('streak_30'); }

  // Exercise
  const totalExercises = exerciseLogs.reduce((s, l) => s + l.exercises.length, 0);
  if (totalExercises >= 1) earn('first_exercise');
  if (totalExercises >= 10) earn('workouts_10');
  if (totalExercises >= 100) earn('workouts_100');

  // Calorie target streak
  if (calorieTargetHit) earn('on_target');
  // (target_week badge: would need full streak calc — skip for now, simplify)

  // Weight
  if (weightLogs.length >= 1) earn('first_weighin');

  // Fasting
  if (fastingSessions >= 1) earn('first_fast');
  if (fastingSessions >= 10) earn('fasts_10');

  // Custom food / recipe
  if (customFoods >= 1) earn('custom_food');
  if (recipes >= 1) earn('first_recipe');

  // Water goal streak
  const WATER_GOAL = 2500;
  const waterGoalDays = waterLogs.filter(l => (l.totalMl || 0) >= WATER_GOAL).map(l => l.date);
  if (waterGoalDays.length >= 1) earn('first_water_goal');
  if (calcCurrentStreak(waterGoalDays) >= 7) earn('water_week');

  // Level badges
  if (profile.level >= 5) earn('level_5');
  if (profile.level >= 10) earn('level_10');

  return newBadges.filter(Boolean);
}

// ─── Weight milestone checker ─────────────────────────────────────────────────

async function checkWeightMilestones(userId, profile) {
  const weights = await WeightLog.find({ userId }).sort({ date: 1 }).lean();
  if (weights.length === 0) return [];
  if (!profile.startingWeightKg) profile.startingWeightKg = weights[0].weightKg;
  const current = weights[weights.length - 1].weightKg;
  const lostLbs = (profile.startingWeightKg - current) * 2.20462;
  const earned = new Set(profile.weightMilestonesEarned || []);
  const newMilestones = [];
  for (const lb of [5, 10, 25]) {
    if (lostLbs >= lb && !earned.has(lb)) {
      earned.add(lb);
      newMilestones.push(lb);
    }
  }
  profile.weightMilestonesEarned = [...earned];
  return newMilestones;
}

// ─── Challenge progress computer ──────────────────────────────────────────────

async function computeChallengeProgress(userId, challenges) {
  const { start, end } = getWeekBounds();
  const [foodLogs, exerciseLogs, weightLogs, waterLogs, fastingSessions] = await Promise.all([
    FoodLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    ExerciseLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    WeightLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    WaterLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    FastingSession.countDocuments({ userId, completed: true, startTime: { $gte: new Date(start), $lte: new Date(end + 'T23:59:59Z') } })
  ]);

  let calorieTarget = 2000;
  let proteinTargetG = 150;
  try {
    const user = await User.findById(userId).lean();
    if (user && user.weightKg && user.heightCm && user.age) {
      const r = calculateUserTDEE(user);
      calorieTarget = r.recommendedCalories;
      proteinTargetG = Math.round(user.weightKg * 1.6);
    }
  } catch (_) {}

  const metrics = {
    foodLogDays: foodLogs.length,
    exerciseSessions: exerciseLogs.reduce((s, l) => s + l.exercises.length, 0),
    weighInDays: weightLogs.length,
    waterGoalDays: waterLogs.filter(l => (l.totalMl || 0) >= 2500).length,
    fastingSessions,
    calorieTargetDays: foodLogs.filter(log => {
      const cals = log.foods.reduce((s, f) => s + Math.round((f.calories || 0) * ((f.servingSize || 100) / 100)), 0);
      return Math.abs(cals - calorieTarget) <= 150;
    }).length,
    proteinGoalDays: foodLogs.filter(log => {
      const prot = log.foods.reduce((s, f) => s + (f.protein || 0) * ((f.servingSize || 100) / 100), 0);
      return prot >= proteinTargetG;
    }).length
  };

  return challenges.map(ch => ({
    ...ch,
    progress: Math.min(metrics[ch.metric] || 0, ch.target)
  }));
}

// ─── GET /api/gamification ────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    let profile = await GamificationProfile.findOne({ userId });
    if (!profile) {
      profile = await GamificationProfile.create({ userId });
    }

    const weekKey = getWeekKey();
    const challenges = getWeeklyChallenges(weekKey);
    const challengesWithProgress = await computeChallengeProgress(userId, challenges);
    const claimedIds = profile.weeklyChallenge?.weekKey === weekKey
      ? (profile.weeklyChallenge.claimedIds || [])
      : [];

    const level = getLevel(profile.xp);
    res.json({
      userId,
      xp: profile.xp,
      level,
      title: getTitle(level),
      xpForCurrentLevel: getXPForLevel(level),
      xpForNextLevel: getXPForLevel(level + 1),
      shields: profile.shields,
      shieldProtectedDates: profile.shieldProtectedDates,
      badgesEarned: profile.badgesEarned,
      weightMilestonesEarned: profile.weightMilestonesEarned,
      startingWeightKg: profile.startingWeightKg,
      weekKey,
      challenges: challengesWithProgress.map(ch => ({
        ...ch,
        claimed: claimedIds.includes(ch.id),
        completed: ch.progress >= ch.target
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/gamification/badges ─────────────────────────────────────────────

router.get('/badges', (req, res) => {
  res.json({ badges: BADGES });
});

// ─── POST /api/gamification/award ────────────────────────────────────────────

router.post('/award', async (req, res) => {
  try {
    const userId = req.userId;
    const { action } = req.body;

    const XP_MAP = {
      FOOD_LOG: 10,
      CALORIE_TARGET_HIT: 25,
      EXERCISE_LOG: 15,
      WEIGH_IN: 10,
      WATER_GOAL_HIT: 10,
      FASTING_COMPLETE: 20
    };

    let profile = await GamificationProfile.findOne({ userId });
    if (!profile) profile = await GamificationProfile.create({ userId });

    const todayStr = today();
    let xpGained = 0;
    let calorieTargetHit = false;

    // Check once-per-day limits
    if (action === 'FOOD_LOG' && profile.lastXpAwards.foodLog !== todayStr) {
      xpGained += XP_MAP.FOOD_LOG;
      profile.lastXpAwards.foodLog = todayStr;
      // Also auto-check calorie target for today
      try {
        const log = await FoodLog.findOne({ userId, date: todayStr }).lean();
        if (log) {
          let calorieTarget = 2000;
          const user = await User.findById(userId).lean();
          if (user && user.weightKg && user.heightCm && user.age) {
            calorieTarget = calculateUserTDEE(user).recommendedCalories;
          }
          const cals = log.foods.reduce((s, f) => s + Math.round((f.calories || 0) * ((f.servingSize || 100) / 100)), 0);
          if (Math.abs(cals - calorieTarget) <= 150 && profile.lastXpAwards.calorieTarget !== todayStr) {
            xpGained += XP_MAP.CALORIE_TARGET_HIT;
            profile.lastXpAwards.calorieTarget = todayStr;
            calorieTargetHit = true;
          }
        }
      } catch (_) {}
    } else if (action === 'CALORIE_TARGET_HIT' && profile.lastXpAwards.calorieTarget !== todayStr) {
      xpGained += XP_MAP.CALORIE_TARGET_HIT;
      profile.lastXpAwards.calorieTarget = todayStr;
      calorieTargetHit = true;
    } else if (action === 'EXERCISE_LOG') {
      const todayExercises = (profile.lastXpAwards.exerciseDates || []).filter(d => d === todayStr);
      if (todayExercises.length < 3) {
        xpGained += XP_MAP.EXERCISE_LOG;
        profile.lastXpAwards.exerciseDates = [...(profile.lastXpAwards.exerciseDates || []).slice(-20), todayStr];
      }
    } else if (action === 'WEIGH_IN' && profile.lastXpAwards.weighIn !== todayStr) {
      xpGained += XP_MAP.WEIGH_IN;
      profile.lastXpAwards.weighIn = todayStr;
    } else if (action === 'WATER_GOAL_HIT' && profile.lastXpAwards.waterGoal !== todayStr) {
      xpGained += XP_MAP.WATER_GOAL_HIT;
      profile.lastXpAwards.waterGoal = todayStr;
    } else if (action === 'FASTING_COMPLETE') {
      xpGained += XP_MAP.FASTING_COMPLETE;
    }

    const oldLevel = getLevel(profile.xp);
    profile.xp += xpGained;
    const newLevel = getLevel(profile.xp);
    profile.level = newLevel;
    const leveledUp = newLevel > oldLevel;

    // Award level-up shield at milestones
    if (leveledUp && newLevel % 5 === 0) {
      profile.shields = Math.min((profile.shields || 0) + 1, 5);
    }

    // Check badges
    const newBadges = await checkAndAwardBadges(userId, profile, calorieTargetHit);

    // Check weight milestones
    let newMilestones = [];
    if (action === 'WEIGH_IN') {
      newMilestones = await checkWeightMilestones(userId, profile);
    }

    profile.markModified('lastXpAwards');
    profile.markModified('badgesEarned');
    profile.markModified('weightMilestonesEarned');
    await profile.save();

    res.json({
      xpGained,
      totalXP: profile.xp,
      level: newLevel,
      title: getTitle(newLevel),
      leveledUp,
      newBadges,
      newMilestones,
      shields: profile.shields
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/gamification/use-shield ───────────────────────────────────────

router.post('/use-shield', async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.body;
    const profile = await GamificationProfile.findOne({ userId });
    if (!profile || profile.shields <= 0) {
      return res.status(400).json({ error: 'No shields available' });
    }
    if (!profile.shieldProtectedDates.includes(date)) {
      profile.shieldProtectedDates.push(date);
    }
    profile.shields -= 1;
    await profile.save();
    res.json({ shields: profile.shields, shieldProtectedDates: profile.shieldProtectedDates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/gamification/claim-challenge ──────────────────────────────────

router.post('/claim-challenge', async (req, res) => {
  try {
    const userId = req.userId;
    const { challengeId } = req.body;
    const weekKey = getWeekKey();
    const challenges = getWeeklyChallenges(weekKey);
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    let profile = await GamificationProfile.findOne({ userId });
    if (!profile) profile = await GamificationProfile.create({ userId });

    // Init or reset week
    if (profile.weeklyChallenge?.weekKey !== weekKey) {
      profile.weeklyChallenge = { weekKey, claimedIds: [] };
    }
    if (profile.weeklyChallenge.claimedIds.includes(challengeId)) {
      return res.status(400).json({ error: 'Already claimed' });
    }

    // Verify completion
    const [withProgress] = await computeChallengeProgress(userId, [challenge]);
    if (withProgress.progress < challenge.target) {
      return res.status(400).json({ error: 'Challenge not yet completed' });
    }

    profile.weeklyChallenge.claimedIds.push(challengeId);
    const oldLevel = getLevel(profile.xp);
    profile.xp += challenge.xpReward;
    const newLevel = getLevel(profile.xp);
    profile.level = newLevel;
    if (newLevel > oldLevel && newLevel % 5 === 0) {
      profile.shields = Math.min((profile.shields || 0) + 1, 5);
    }
    profile.markModified('weeklyChallenge');
    await profile.save();

    const newBadges = await checkAndAwardBadges(userId, profile);
    await profile.save();

    res.json({
      xpGained: challenge.xpReward,
      totalXP: profile.xp,
      level: newLevel,
      leveledUp: newLevel > oldLevel,
      newBadges,
      shields: profile.shields
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
