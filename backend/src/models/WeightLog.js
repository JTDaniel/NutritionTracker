const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  weightKg: { type: Number, required: true }
}, { timestamps: false });

weightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WeightLog', weightLogSchema);
