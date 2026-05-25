const mongoose = require('mongoose');
const measurementSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  waistCm: Number,
  hipsCm: Number,
  chestCm: Number,
  neckCm: Number,
  armsLeftCm: Number,
  armsRightCm: Number,
  thighsLeftCm: Number,
  thighsRightCm: Number
}, { timestamps: false });
measurementSchema.index({ userId: 1, date: -1 });
module.exports = mongoose.model('Measurement', measurementSchema);
