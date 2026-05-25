const mongoose = require('mongoose');
const ingredientSchema = new mongoose.Schema({
  fdcId: String,
  customFoodId: String,
  name: { type: String, required: true },
  servingSize: { type: Number, default: 100 },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 }
}, { _id: false });
const recipeSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  servings: { type: Number, default: 1 },
  ingredients: [ingredientSchema]
}, { timestamps: true });
module.exports = mongoose.model('Recipe', recipeSchema);
