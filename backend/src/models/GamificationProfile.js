const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  shields: { type: Number, default: 0 },
  shieldProtectedDates: [String],
  badgesEarned: [{
    badgeId: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],
  weeklyChallenge: {
    weekKey: { type: String, default: '' },
    claimedIds: [String]
  },
  startingWeightKg: { type: Number, default: null },
  weightMilestonesEarned: [Number],
  lastXpAwards: {
    foodLog: { type: String, default: '' },
    calorieTarget: { type: String, default: '' },
    weighIn: { type: String, default: '' },
    waterGoal: { type: String, default: '' },
    exerciseDates: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('GamificationProfile', gamificationSchema);
