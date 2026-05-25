const express = require('express');
const router = express.Router();
const CustomFood = require('../models/CustomFood');

// GET /api/custom-foods
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const foods = await CustomFood.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/custom-foods
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { name, ...rest } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const food = await CustomFood.create({ userId, name, ...rest });
    res.status(201).json({ food });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/custom-foods/:id
router.put('/:id', async (req, res) => {
  try {
    const food = await CustomFood.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!food) return res.status(404).json({ error: 'Custom food not found' });
    res.json({ food });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/custom-foods/:id
router.delete('/:id', async (req, res) => {
  try {
    await CustomFood.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
