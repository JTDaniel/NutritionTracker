const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/barcode/:barcode
router.get('/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await axios.get(url, { timeout: 8000 });
    const data = response.data;
    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const p = data.product;
    const n = p.nutriments || {};
    const servingSize = parseFloat(p.serving_quantity) || 100;
    // OFF stores nutrients per 100g
    const scale = servingSize / 100;
    const food = {
      fdcId: `barcode-${barcode}`,
      name: p.product_name || p.generic_name || 'Unknown Product',
      brandName: p.brands || '',
      servingSize,
      householdServing: p.serving_size || `${servingSize}g`,
      calories: Math.round((n['energy-kcal_100g'] || (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0) || 0) * scale),
      protein: Math.round((n.proteins_100g || 0) * scale * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g || 0) * scale * 10) / 10,
      fat: Math.round((n.fat_100g || 0) * scale * 10) / 10,
      fiber: Math.round((n.fiber_100g || 0) * scale * 10) / 10,
      sodium: Math.round((n.sodium_100g || 0) * 1000 * scale), // mg
      sugar: Math.round((n.sugars_100g || 0) * scale * 10) / 10
    };
    res.json({ food });
  } catch (err) {
    if (err.response?.status === 404) return res.status(404).json({ error: 'Product not found' });
    res.status(500).json({ error: 'Barcode lookup failed', message: err.message });
  }
});

module.exports = router;
