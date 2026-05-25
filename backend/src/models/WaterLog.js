const mongoose = require('mongoose');
const waterLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  totalMl: { type: Number, default: 0 },
  entries: [{ ml: Number, time: String }]
}, { timestamps: false });
waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('WaterLog', waterLogSchema);
