const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  fdcId: { type: String },
  name: { type: String, required: true },
  brandName: { type: String, default: '' },
  servingSize: { type: Number, default: 100 },
  servingUnit: { type: String, default: 'g' },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  cholesterol: { type: Number, default: 0 },
  saturatedFat: { type: Number, default: 0 },
  vitaminA: { type: Number, default: 0 },
  vitaminC: { type: Number, default: 0 },
  vitaminD: { type: Number, default: 0 },
  calcium: { type: Number, default: 0 },
  iron: { type: Number, default: 0 },
  potassium: { type: Number, default: 0 }
}, { _id: false });

const foodLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  foods: [foodItemSchema]
}, {
  timestamps: true
});

foodLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('FoodLog', foodLogSchema);
