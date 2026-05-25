const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

// GET /api/recipes
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const recipes = await Recipe.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({ recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recipes
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { name, ...rest } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const recipe = await Recipe.create({ userId, name, ...rest });
    res.status(201).json({ recipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/recipes/:id
router.put('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ recipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/recipes/:id
router.delete('/:id', async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recipes/:id/nutrition
router.get('/:id/nutrition', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).lean();
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const totals = recipe.ingredients.reduce((acc, ing) => {
      const scale = (ing.servingSize || 100) / 100;
      acc.calories += (ing.calories || 0) * scale;
      acc.protein += (ing.protein || 0) * scale;
      acc.carbs += (ing.carbs || 0) * scale;
      acc.fat += (ing.fat || 0) * scale;
      acc.fiber += (ing.fiber || 0) * scale;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const servings = recipe.servings || 1;
    const perServing = {
      calories: Math.round(totals.calories / servings),
      protein: Math.round(totals.protein / servings * 10) / 10,
      carbs: Math.round(totals.carbs / servings * 10) / 10,
      fat: Math.round(totals.fat / servings * 10) / 10,
      fiber: Math.round(totals.fiber / servings * 10) / 10
    };

    res.json({
      perServing,
      total: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        fiber: Math.round(totals.fiber * 10) / 10
      },
      servings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
