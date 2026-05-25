const express = require('express');
const router = express.Router();
const FoodItem = require('../models/FoodItem');
const CustomFood = require('../models/CustomFood');
const { seedingStatus } = require('../seed');

const formatFood = (f) => ({
  fdcId: f.fdcId,
  name: f.name,
  brandName: f.brandName || '',
  servingSize: f.servingSize || 100,
  servingUnit: 'g',
  householdServing: f.householdServing || '',
  calories: f.calories,
  protein: f.protein,
  carbs: f.carbs,
  fat: f.fat,
  fiber: f.fiber,
  sodium: f.sodium || 0,
  sugar: f.sugar || 0,
  cholesterol: f.cholesterol || 0,
  saturatedFat: f.saturatedFat || 0,
  vitaminA: f.vitaminA || 0,
  vitaminC: f.vitaminC || 0,
  vitaminD: f.vitaminD || 0,
  calcium: f.calcium || 0,
  iron: f.iron || 0,
  potassium: f.potassium || 0
});

// GET /api/foods/seed-status
router.get('/seed-status', async (req, res) => {
  try {
    const totalFoods = await FoodItem.countDocuments();
    res.json({ ...seedingStatus, totalFoods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/foods/search?q=query&limit=20&userId=X
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, userId } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const totalFoods = await FoodItem.countDocuments();
    if (totalFoods === 0) {
      return res.json({ foods: [], totalHits: 0, query: q.trim(), seeding: true });
    }

    const results = await FoodItem.find(
      { $text: { $search: q.trim() } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.min(parseInt(limit) || 20, 50))
      .lean();

    // Fall back to prefix search if text index returns nothing
    const dbFoods = results.length > 0 ? results : await FoodItem.find({
      name: { $regex: q.trim(), $options: 'i' }
    }).limit(20).lean();

    // Also fetch matching custom foods for this user
    let customFoods = [];
    if (userId) {
      const regex = new RegExp(q.trim(), 'i');
      const customs = await CustomFood.find({
        userId,
        $or: [{ name: regex }, { brandName: regex }]
      }).limit(10).lean();
      customFoods = customs.map(cf => ({
        fdcId: `custom-${cf._id}`,
        customFoodId: String(cf._id),
        name: cf.name,
        brandName: cf.brandName || '',
        servingSize: cf.servingSize || 100,
        servingUnit: 'g',
        householdServing: cf.householdServing || '',
        calories: cf.calories || 0,
        protein: cf.protein || 0,
        carbs: cf.carbs || 0,
        fat: cf.fat || 0,
        fiber: cf.fiber || 0,
        sodium: cf.sodium || 0,
        sugar: cf.sugar || 0,
        isCustom: true
      }));
    }

    const foods = [...customFoods, ...dbFoods.map(formatFood)];

    res.json({
      foods,
      totalHits: foods.length,
      query: q.trim(),
      seeding: seedingStatus.brandedInProgress,
      totalFoods
    });
  } catch (err) {
    console.error('Food search error:', err.message);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

// GET /api/foods/:fdcId  — look up a specific food by ID
router.get('/:fdcId', async (req, res) => {
  try {
    const food = await FoodItem.findOne({ fdcId: req.params.fdcId }).lean();
    if (!food) return res.status(404).json({ error: 'Food not found' });
    res.json(formatFood(food));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
