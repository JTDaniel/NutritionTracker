const express = require('express');
const router = express.Router();
const WaterLog = require('../models/WaterLog');

// GET /api/water?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });
    const log = await WaterLog.findOne({ userId, date }).lean();
    res.json({ log: log || { userId, date, totalMl: 0, entries: [] } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/water/add — upsert, push entry, update totalMl
router.post('/add', async (req, res) => {
  try {
    const userId = req.userId;
    const { date, ml } = req.body;
    if (!date || !ml) return res.status(400).json({ error: 'date and ml are required' });
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const log = await WaterLog.findOneAndUpdate(
      { userId, date },
      {
        $inc: { totalMl: ml },
        $push: { entries: { ml, time } }
      },
      { upsert: true, new: true }
    ).lean();
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/water/:id
router.delete('/:id', async (req, res) => {
  try {
    await WaterLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
