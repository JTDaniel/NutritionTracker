const express = require('express');
const router = express.Router();
const FastingSession = require('../models/FastingSession');

// GET /api/fasting — all sessions sorted by startTime desc
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const sessions = await FastingSession.find({ userId }).sort({ startTime: -1 }).lean();
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fasting/active
router.get('/active', async (req, res) => {
  try {
    const userId = req.userId;
    const session = await FastingSession.findOne({ userId, endTime: { $exists: false } }).lean();
    res.json({ session: session || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fasting/start
router.post('/start', async (req, res) => {
  try {
    const userId = req.userId;
    const { targetHours = 16 } = req.body;
    const existing = await FastingSession.findOne({ userId, endTime: { $exists: false } });
    if (existing) return res.status(400).json({ error: 'Already have an active fasting session' });
    const session = await FastingSession.create({ userId, startTime: new Date(), targetHours });
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fasting/stop
router.post('/stop', async (req, res) => {
  try {
    const userId = req.userId;
    const session = await FastingSession.findOne({ userId, endTime: { $exists: false } });
    if (!session) return res.status(404).json({ error: 'No active fasting session found' });
    const endTime = new Date();
    const durationHours = (endTime - session.startTime) / (1000 * 60 * 60);
    session.endTime = endTime;
    session.completed = durationHours >= session.targetHours;
    await session.save();
    res.json({ session: session.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/fasting/:id
router.delete('/:id', async (req, res) => {
  try {
    await FastingSession.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
