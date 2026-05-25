const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');

// GET /api/measurements
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const measurements = await Measurement.find({ userId }).sort({ date: -1 }).lean();
    res.json({ measurements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/measurements — upsert by userId+date
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { date, ...fields } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });
    const measurement = await Measurement.findOneAndUpdate(
      { userId, date },
      { userId, date, ...fields },
      { upsert: true, new: true }
    ).lean();
    res.json({ measurement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/measurements/:id
router.delete('/:id', async (req, res) => {
  try {
    await Measurement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
