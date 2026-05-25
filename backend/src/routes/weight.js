const express = require('express');
const router = express.Router();
const WeightLog = require('../models/WeightLog');

// GET /api/weight — all entries sorted by date
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const entries = await WeightLog.find({ userId }).sort({ date: 1 }).lean();
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/weight  — upsert entry for date
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { date, weightKg } = req.body;
    if (!date || weightKg == null) {
      return res.status(400).json({ error: 'date and weightKg required' });
    }
    const entry = await WeightLog.findOneAndUpdate(
      { userId, date },
      { weightKg: parseFloat(weightKg) },
      { upsert: true, new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/weight/:id
router.delete('/:id', async (req, res) => {
  try {
    await WeightLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
