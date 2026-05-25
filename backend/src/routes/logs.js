const express = require('express');
const FoodLog = require('../models/FoodLog');
const ExerciseLog = require('../models/ExerciseLog');
const User = require('../models/User');
const router = express.Router();

// ============ FOOD LOGS ============

// GET /api/logs/food?date=YYYY-MM-DD
router.get('/food', async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const log = await FoodLog.findOne({ userId, date });
    if (!log) {
      return res.json({ userId, date, foods: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } });
    }

    const totals = log.foods.reduce((acc, food) => {
      const multiplier = food.servingSize / 100;
      acc.calories += (food.calories || 0) * multiplier;
      acc.protein += (food.protein || 0) * multiplier;
      acc.carbs += (food.carbs || 0) * multiplier;
      acc.fat += (food.fat || 0) * multiplier;
      acc.fiber += (food.fiber || 0) * multiplier;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    // Round totals
    Object.keys(totals).forEach(k => { totals[k] = Math.round(totals[k] * 10) / 10; });

    res.json({ ...log.toObject(), totals });
  } catch (err) {
    console.error('Get food log error:', err.message);
    res.status(500).json({ error: 'Failed to get food log', message: err.message });
  }
});

// POST /api/logs/food
router.post('/food', async (req, res) => {
  try {
    const userId = req.userId;
    const { date, food } = req.body;
    if (!date || !food) {
      return res.status(400).json({ error: 'date and food are required' });
    }

    const foodItem = {
      fdcId: food.fdcId || '',
      name: food.name || '',
      brandName: food.brandName || '',
      servingSize: Number(food.servingSize) || 100,
      servingUnit: food.servingUnit || 'g',
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
      carbs: Number(food.carbs) || 0,
      fat: Number(food.fat) || 0,
      fiber: Number(food.fiber) || 0
    };

    const log = await FoodLog.findOneAndUpdate(
      { userId, date },
      { $push: { foods: foodItem } },
      { new: true, upsert: true }
    );

    res.status(201).json(log);
  } catch (err) {
    console.error('Add food log error:', err.message);
    res.status(500).json({ error: 'Failed to add food to log', message: err.message });
  }
});

// GET /api/logs/food/recent?limit=25
router.get('/food/recent', async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 25 } = req.query;

    // Fetch recent logs sorted by date desc, look back up to 90 days of logs
    const logs = await FoodLog.find({ userId })
      .sort({ date: -1 })
      .limit(60)
      .lean();

    // Flatten foods, deduplicate by normalized name, preserve insertion order (most recent first)
    const seen = new Set();
    const recent = [];
    for (const log of logs) {
      for (let i = log.foods.length - 1; i >= 0; i--) {
        const food = log.foods[i];
        const key = (food.name || '').toLowerCase().trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          recent.push(food);
          if (recent.length >= parseInt(limit)) break;
        }
      }
      if (recent.length >= parseInt(limit)) break;
    }

    res.json({ foods: recent });
  } catch (err) {
    console.error('Get recent foods error:', err.message);
    res.status(500).json({ error: 'Failed to get recent foods', message: err.message });
  }
});

// DELETE /api/logs/food/:logId/item/:itemIndex
router.delete('/food/:logId/item/:itemIndex', async (req, res) => {
  try {
    const { logId, itemIndex } = req.params;
    const idx = parseInt(itemIndex);

    const log = await FoodLog.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Food log not found' });
    }

    if (idx < 0 || idx >= log.foods.length) {
      return res.status(400).json({ error: 'Invalid item index' });
    }

    log.foods.splice(idx, 1);
    await log.save();

    res.json(log);
  } catch (err) {
    console.error('Delete food item error:', err.message);
    res.status(500).json({ error: 'Failed to delete food item', message: err.message });
  }
});

// ============ EXERCISE LOGS ============

// GET /api/logs/exercise?date=YYYY-MM-DD
router.get('/exercise', async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const log = await ExerciseLog.findOne({ userId, date });
    if (!log) {
      return res.json({ userId, date, exercises: [], totalCaloriesBurned: 0 });
    }

    const totalCaloriesBurned = log.exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
    res.json({ ...log.toObject(), totalCaloriesBurned });
  } catch (err) {
    console.error('Get exercise log error:', err.message);
    res.status(500).json({ error: 'Failed to get exercise log', message: err.message });
  }
});

// POST /api/logs/exercise
router.post('/exercise', async (req, res) => {
  try {
    const userId = req.userId;
    const { date, exercise } = req.body;
    if (!date || !exercise) {
      return res.status(400).json({ error: 'date and exercise are required' });
    }

    // Get user weight for calorie calculation
    let weightKg = 70; // default
    const user = await User.findById(userId);
    if (user && user.weightKg) {
      weightKg = user.weightKg;
    }

    const metValue = Number(exercise.metValue) || 3.5;
    const durationMinutes = Number(exercise.durationMinutes) || 30;
    const caloriesBurned = Math.round(metValue * weightKg * (durationMinutes / 60));

    const exerciseItem = {
      exerciseId: exercise.exerciseId || exercise._id || '',
      name: exercise.name || '',
      durationMinutes,
      caloriesBurned,
      category: exercise.category || '',
      metValue
    };

    const log = await ExerciseLog.findOneAndUpdate(
      { userId, date },
      { $push: { exercises: exerciseItem } },
      { new: true, upsert: true }
    );

    res.status(201).json(log);
  } catch (err) {
    console.error('Add exercise log error:', err.message);
    res.status(500).json({ error: 'Failed to add exercise to log', message: err.message });
  }
});

// DELETE /api/logs/exercise/:logId/item/:itemIndex
router.delete('/exercise/:logId/item/:itemIndex', async (req, res) => {
  try {
    const { logId, itemIndex } = req.params;
    const idx = parseInt(itemIndex);

    const log = await ExerciseLog.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Exercise log not found' });
    }

    if (idx < 0 || idx >= log.exercises.length) {
      return res.status(400).json({ error: 'Invalid item index' });
    }

    log.exercises.splice(idx, 1);
    await log.save();

    res.json(log);
  } catch (err) {
    console.error('Delete exercise item error:', err.message);
    res.status(500).json({ error: 'Failed to delete exercise item', message: err.message });
  }
});

module.exports = router;
