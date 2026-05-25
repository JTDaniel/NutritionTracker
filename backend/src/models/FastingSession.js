const mongoose = require('mongoose');
const fastingSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  targetHours: { type: Number, default: 16 },
  completed: { type: Boolean, default: false },
  note: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('FastingSession', fastingSessionSchema);
