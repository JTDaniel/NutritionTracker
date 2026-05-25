const express = require('express');
const router = express.Router();
const FoodLog = require('../models/FoodLog');
const ExerciseLog = require('../models/ExerciseLog');
const WeightLog = require('../models/WeightLog');
const User = require('../models/User');
const { calculateUserTDEE } = require('../utils/tdee');

const getCalorieTarget = async (userId) => {
  try {
    const user = await User.findOne({ userId }).lean();
    if (user && user.weightKg && user.heightCm && user.age) {
      const result = calculateUserTDEE(user);
      return result.recommendedCalories;
    }
  } catch (_) {}
  return 2000;
};

// GET /api/analytics/calories?days=30
router.get('/calories', async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startStr = startDate.toISOString().split('T')[0];

    const logs = await FoodLog.find({ userId, date: { $gte: startStr } }).lean();
    const calorieTarget = await getCalorieTarget(userId);

    const data = logs.map(log => ({
      date: log.date,
      calories: log.foods.reduce((sum, f) => sum + Math.round((f.calories || 0) * ((f.servingSize || 100) / 100)), 0),
      protein: log.foods.reduce((sum, f) => sum + Math.round((f.protein || 0) * ((f.servingSize || 100) / 100) * 10) / 10, 0),
      carbs: log.foods.reduce((sum, f) => sum + Math.round((f.carbs || 0) * ((f.servingSize || 100) / 100) * 10) / 10, 0),
      fat: log.foods.reduce((sum, f) => sum + Math.round((f.fat || 0) * ((f.servingSize || 100) / 100) * 10) / 10, 0)
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({ data, calorieTarget, days: parseInt(days) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/weekly?weeks=8
router.get('/weekly', async (req, res) => {
  try {
    const userId = req.userId;
    const { weeks = 8 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(weeks) * 7);
    const startStr = startDate.toISOString().split('T')[0];

    const [foodLogs, exerciseLogs, weightLogs] = await Promise.all([
      FoodLog.find({ userId, date: { $gte: startStr } }).lean(),
      ExerciseLog.find({ userId, date: { $gte: startStr } }).lean(),
      WeightLog.find({ userId, date: { $gte: startStr } }).sort({ date: 1 }).lean()
    ]);

    const calorieTarget = await getCalorieTarget(userId);

    // Group by ISO week
    const weekMap = {};
    for (const log of foodLogs) {
      const d = new Date(log.date + 'T12:00:00');
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Sunday
      const key = weekStart.toISOString().split('T')[0];
      if (!weekMap[key]) weekMap[key] = { weekStart: key, totalCalories: 0, daysLogged: 0, daysOnTarget: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
      const dayCalories = log.foods.reduce((sum, f) => sum + Math.round((f.calories || 0) * ((f.servingSize || 100) / 100)), 0);
      weekMap[key].totalCalories += dayCalories;
      weekMap[key].daysLogged += 1;
      if (Math.abs(dayCalories - calorieTarget) <= 150) weekMap[key].daysOnTarget += 1;
      weekMap[key].totalProtein += log.foods.reduce((sum, f) => sum + (f.protein || 0) * ((f.servingSize || 100) / 100), 0);
    }

    const weeklyData = Object.values(weekMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart)).map(w => ({
      ...w,
      avgCalories: w.daysLogged > 0 ? Math.round(w.totalCalories / w.daysLogged) : 0,
      avgProtein: w.daysLogged > 0 ? Math.round(w.totalProtein / w.daysLogged) : 0
    }));

    res.json({ weeklyData, calorieTarget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/streaks
router.get('/streaks', async (req, res) => {
  try {
    const userId = req.userId;

    const [foodLogs, weightLogs, exerciseLogs] = await Promise.all([
      FoodLog.find({ userId }).lean(),
      WeightLog.find({ userId }).lean(),
      ExerciseLog.find({ userId }).lean()
    ]);

    const calorieTarget = await getCalorieTarget(userId);

    const calcStreak = (dates) => {
      if (dates.length === 0) return { current: 0, best: 0 };
      const sorted = [...new Set(dates)].sort();
      const today = new Date().toISOString().split('T')[0];
      let best = 0;
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) { streak++; }
        else { best = Math.max(best, streak); streak = 1; }
      }
      best = Math.max(best, streak);
      // Check if streak includes today or yesterday
      const lastDate = sorted[sorted.length - 1];
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      let current = 0;
      if (lastDate === today || lastDate === yesterdayStr) current = streak;
      return { current, best };
    };

    const loggingDates = foodLogs.map(l => l.date);
    const weighInDates = weightLogs.map(l => l.date);
    const exerciseDates = exerciseLogs.map(l => l.date);
    const onTargetDates = foodLogs.filter(log => {
      const cals = log.foods.reduce((sum, f) => sum + Math.round((f.calories || 0) * ((f.servingSize || 100) / 100)), 0);
      return Math.abs(cals - calorieTarget) <= 150;
    }).map(l => l.date);

    res.json({
      logging: calcStreak(loggingDates),
      weighIn: calcStreak(weighInDates),
      exercise: calcStreak(exerciseDates),
      onTarget: calcStreak(onTargetDates),
      totalLoggedDays: new Set(loggingDates).size,
      totalWeighIns: weighInDates.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
