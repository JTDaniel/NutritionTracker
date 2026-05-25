const mongoose = require('mongoose');
const customFoodSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  brandName: { type: String, default: '' },
  servingSize: { type: Number, default: 100 },
  householdServing: { type: String, default: '' },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('CustomFood', customFoodSchema);
