const express = require('express');
const User = require('../models/User');
const { calculateUserTDEE } = require('../utils/tdee');
const router = express.Router();

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const userId = req.userId;
    let user = await User.findById(userId);

    if (!user) {
      // Return a default user profile if not found
      return res.json({
        _id: userId,
        name: '',
        age: 30,
        gender: 'male',
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'moderately_active',
        tdee: null
      });
    }

    const tdeeData = calculateUserTDEE(user);
    res.json({ ...user.toObject(), tdee: tdeeData });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ error: 'Failed to get user profile', message: err.message });
  }
});

// PUT /api/users/me
router.put('/me', async (req, res) => {
  try {
    const userId = req.userId;
    const { name, age, gender, heightCm, weightKg, activityLevel, goalWeightKg, weeklyWeightGoalLbs, dietType } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = Number(age);
    if (gender !== undefined) updateData.gender = gender;
    if (heightCm !== undefined) updateData.heightCm = Number(heightCm);
    if (weightKg !== undefined) updateData.weightKg = Number(weightKg);
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (goalWeightKg !== undefined) updateData.goalWeightKg = goalWeightKg === null ? null : Number(goalWeightKg);
    if (weeklyWeightGoalLbs !== undefined) updateData.weeklyWeightGoalLbs = Number(weeklyWeightGoalLbs);
    if (dietType !== undefined) updateData.dietType = dietType;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const tdeeData = calculateUserTDEE(user);
    res.json({ ...user.toObject(), tdee: tdeeData });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ error: 'Failed to update user profile', message: err.message });
  }
});

module.exports = router;
