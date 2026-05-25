const express = require('express');
const Exercise = require('../models/Exercise');
const router = express.Router();

// GET /api/exercises/search?q=query
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    let exercises;
    if (!q || q.trim() === '') {
      // Return all exercises if no query
      exercises = await Exercise.find({}).sort({ category: 1, name: 1 }).limit(100);
    } else {
      // Search by name using regex for partial match
      const searchRegex = new RegExp(q.trim(), 'i');
      exercises = await Exercise.find({
        $or: [
          { name: searchRegex },
          { category: searchRegex },
          { description: searchRegex }
        ]
      }).sort({ name: 1 }).limit(50);
    }

    res.json({ exercises });
  } catch (err) {
    console.error('Exercise search error:', err.message);
    res.status(500).json({ error: 'Failed to search exercises', message: err.message });
  }
});

// GET /api/exercises - list all exercises grouped by category
router.get('/', async (req, res) => {
  try {
    const exercises = await Exercise.find({}).sort({ category: 1, name: 1 });
    res.json({ exercises });
  } catch (err) {
    console.error('Exercise list error:', err.message);
    res.status(500).json({ error: 'Failed to list exercises', message: err.message });
  }
});

module.exports = router;
