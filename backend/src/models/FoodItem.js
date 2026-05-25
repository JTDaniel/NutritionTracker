const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  fdcId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brandName: { type: String, default: '' },
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
  potassium: { type: Number, default: 0 },
  dataType: { type: String, enum: ['Foundation', 'SR Legacy', 'Branded'] },
  servingSize: { type: Number, default: 100 },      // grams for one natural serving
  householdServing: { type: String, default: '' }   // e.g. "1 large egg", "1 cup", "1 bar (43g)"
}, { timestamps: false });

foodItemSchema.index({ name: 'text', brandName: 'text' }, {
  weights: { name: 10, brandName: 5 },
  name: 'food_text_index'
});

module.exports = mongoose.model('FoodItem', foodItemSchema);
