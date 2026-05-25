const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  passwordHash: { type: String },
  name: { type: String, default: '' },
  age: { type: Number, default: 30 },
  gender: { type: String, enum: ['male', 'female'], default: 'male' },
  heightCm: { type: Number, default: 170 },
  weightKg: { type: Number, default: 70 },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
    default: 'moderately_active'
  },
  goalWeightKg: { type: Number, default: null },
  weeklyWeightGoalLbs: { type: Number, default: -1.0 },
  dietType: { type: String, default: 'none' }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
