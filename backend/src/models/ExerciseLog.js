const mongoose = require('mongoose');

const exerciseItemSchema = new mongoose.Schema({
  exerciseId: { type: String },
  name: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  caloriesBurned: { type: Number, default: 0 },
  category: { type: String, default: '' },
  metValue: { type: Number, default: 3.5 }
}, { _id: false });

const exerciseLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  exercises: [exerciseItemSchema]
}, {
  timestamps: true
});

exerciseLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ExerciseLog', exerciseLogSchema);
