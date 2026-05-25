const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['Cardio', 'Strength', 'Flexibility', 'Sports'],
    required: true
  },
  metValue: { type: Number, required: true },
  description: { type: String, default: '' }
}, {
  timestamps: true
});

exerciseSchema.index({ name: 'text', category: 'text' });
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ category: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
