export const DIETS = [
  {
    id: 'none',
    name: 'No specific diet',
    icon: '🍽️',
    description: 'Track nutrition without dietary restrictions.',
    color: 'gray',
    macroSplit: null,
    dailyLimits: {},
    keyMetrics: ['calories', 'protein', 'carbs', 'fat'],
    tips: []
  },
  {
    id: 'keto',
    name: 'Ketogenic',
    icon: '🥑',
    description: 'Very low carb (under 25g net carbs/day), high fat. Designed to put your body into ketosis for fat burning.',
    color: 'orange',
    macroSplit: { protein: 20, fat: 75, carbs: 5 },
    dailyLimits: { netCarbs: 25 },
    keyMetrics: ['net_carbs', 'fat', 'protein'],
    tips: [
      'Keep net carbs under 25g per day (net carbs = total carbs − fiber)',
      'Focus on: fatty meats, eggs, cheese, avocados, nuts, olive oil',
      'Avoid: bread, pasta, rice, sugar, most fruit, starchy vegetables',
      'Drink plenty of water and replenish electrolytes (sodium, potassium, magnesium)'
    ]
  },
  {
    id: 'low_carb',
    name: 'Low Carb',
    icon: '🥩',
    description: 'Reduced carbohydrate intake (under 100g net carbs/day). Less strict than keto but still effective for weight loss.',
    color: 'yellow',
    macroSplit: { protein: 35, fat: 40, carbs: 25 },
    dailyLimits: { netCarbs: 100 },
    keyMetrics: ['net_carbs', 'protein'],
    tips: [
      'Keep net carbs under 100g per day',
      'Focus on lean proteins, vegetables, and healthy fats',
      'Limit: bread, pasta, rice, sugary drinks and snacks'
    ]
  },
  {
    id: 'vegan',
    name: 'Vegan',
    icon: '🌱',
    description: 'No animal products of any kind. Plant-based whole foods for health and ethical reasons.',
    color: 'green',
    macroSplit: null,
    dailyLimits: {},
    keyMetrics: ['protein', 'fiber', 'calories'],
    tips: [
      'Aim for 0.8–1.2g protein per kg bodyweight from plant sources',
      'Supplement B12 — it cannot be obtained from plant foods alone',
      'Monitor iron, calcium, zinc, and omega-3 (flaxseed, walnuts, algae oil)',
      'Combine protein sources (e.g. rice + beans) for complete amino acid profiles'
    ]
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    icon: '🥕',
    description: 'No meat or fish, but dairy and eggs are included.',
    color: 'green',
    macroSplit: null,
    dailyLimits: {},
    keyMetrics: ['protein', 'calories', 'fiber'],
    tips: [
      'Great protein sources: eggs, Greek yogurt, cheese, legumes, tofu',
      'Monitor iron — plant-based iron is less bioavailable than from meat',
      'Pair iron-rich foods with vitamin C for better absorption'
    ]
  },
  {
    id: 'pescatarian',
    name: 'Pescatarian',
    icon: '🐟',
    description: 'Vegetarian diet with fish and seafood included. Combines plant-based eating with the benefits of fish.',
    color: 'blue',
    macroSplit: null,
    dailyLimits: {},
    keyMetrics: ['protein', 'calories', 'fat'],
    tips: [
      'Aim for 2–3 servings of fatty fish per week (salmon, mackerel, sardines)',
      'Rich in omega-3 fatty acids for heart and brain health',
      'Diversify protein: fish, eggs, legumes, dairy'
    ]
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    icon: '🫒',
    description: 'Heart-healthy diet rich in olive oil, fish, vegetables, legumes, and whole grains. Consistently ranked #1 by nutritionists.',
    color: 'blue',
    macroSplit: { protein: 20, fat: 35, carbs: 45 },
    dailyLimits: {},
    keyMetrics: ['fiber', 'fat', 'calories'],
    tips: [
      'Use olive oil as your primary cooking fat',
      'Eat fish 2–3 times per week, limit red meat to a few times per month',
      'Eat plenty of vegetables, legumes, and whole grains every day',
      'A small amount of red wine with meals is traditional (optional)'
    ]
  },
  {
    id: 'paleo',
    name: 'Paleo',
    icon: '🦕',
    description: 'Eat like our ancestors — whole foods only, no grains, legumes, or dairy.',
    color: 'amber',
    macroSplit: { protein: 30, fat: 40, carbs: 30 },
    dailyLimits: { sugar: 50 },
    keyMetrics: ['protein', 'sugar', 'calories'],
    tips: [
      'Eat: meat, fish, eggs, vegetables, fruit, nuts, seeds',
      'Avoid: grains, legumes, dairy, refined sugar, processed foods, vegetable oils',
      'Focus on food quality — grass-fed, pasture-raised, and wild-caught when possible'
    ]
  },
  {
    id: 'dash',
    name: 'DASH',
    icon: '❤️',
    description: 'Dietary Approaches to Stop Hypertension. Low sodium, high in fruits, vegetables, and whole grains for heart health.',
    color: 'red',
    macroSplit: { protein: 18, fat: 27, carbs: 55 },
    dailyLimits: { sodium: 2300 },
    keyMetrics: ['sodium', 'fiber', 'calories'],
    tips: [
      'Keep sodium under 2,300mg per day (ideally under 1,500mg)',
      'Eat plenty of fruits, vegetables, and whole grains daily',
      'Choose low-fat dairy, poultry, fish, and nuts',
      'Limit red meat, sweets, and sugary beverages'
    ]
  },
  {
    id: 'high_protein',
    name: 'High Protein',
    icon: '💪',
    description: 'Optimized for muscle building and recovery. Higher protein intake supports strength training and body recomposition.',
    color: 'blue',
    macroSplit: { protein: 40, fat: 30, carbs: 30 },
    dailyLimits: {},
    keyMetrics: ['protein', 'calories', 'carbs'],
    tips: [
      'Aim for 1.6–2.2g protein per kg bodyweight',
      'Spread protein across 4–5 meals for optimal muscle protein synthesis',
      'Post-workout: fast-digesting protein like whey or eggs within 1–2 hours',
      'Ensure adequate carbs to fuel workouts'
    ]
  },
  {
    id: 'whole30',
    name: 'Whole30',
    icon: '🌿',
    description: '30-day elimination diet removing sugar, alcohol, grains, legumes, dairy, and soy to reset your relationship with food.',
    color: 'green',
    macroSplit: null,
    dailyLimits: { sugar: 0 },
    keyMetrics: ['sugar', 'calories', 'protein'],
    tips: [
      'Eliminate for 30 days: added sugar, alcohol, grains, legumes, dairy, soy',
      'Read every label — sugar hides in unexpected places',
      'Focus on: meat, fish, eggs, vegetables, fruit, nuts, and healthy fats',
      'After 30 days, slowly reintroduce eliminated foods one at a time'
    ]
  },
  {
    id: 'gluten_free',
    name: 'Gluten Free',
    icon: '🌾',
    description: 'No gluten-containing foods. Essential for celiac disease; also chosen by those with gluten sensitivity.',
    color: 'amber',
    macroSplit: null,
    dailyLimits: {},
    keyMetrics: ['calories', 'fiber', 'protein'],
    tips: [
      'Avoid: wheat, barley, rye, and most oats (unless certified GF)',
      'Safe grains: rice, quinoa, corn, buckwheat, millet, certified GF oats',
      'Check labels carefully — gluten hides in sauces, seasonings, and dressings',
      'Many naturally gluten-free foods: meat, fish, eggs, fruits, vegetables, legumes'
    ]
  }
];

export const getDiet = (id) => DIETS.find(d => d.id === id) || DIETS[0];

// ─── Keyword lists for compliance detection ───────────────────────────────────

const NON_VEGAN = ['beef', 'chicken', 'pork', 'turkey', 'lamb', 'veal', 'bison', 'venison', 'duck', 'goose', 'rabbit', 'bacon', 'sausage', 'ham', 'salami', 'pepperoni', 'prosciutto', 'chorizo', 'lard', 'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'crab', 'lobster', 'clam', 'oyster', 'scallop', 'anchovy', 'sardine', 'herring', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'egg', 'gelatin', 'honey', 'collagen', 'albumin', 'meat', 'poultry', 'seafood'];
const NON_VEGETARIAN = ['beef', 'chicken', 'pork', 'turkey', 'lamb', 'veal', 'bison', 'venison', 'duck', 'goose', 'rabbit', 'bacon', 'sausage', 'ham', 'salami', 'pepperoni', 'prosciutto', 'chorizo', 'lard', 'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'crab', 'lobster', 'clam', 'oyster', 'scallop', 'anchovy', 'sardine', 'herring', 'gelatin', 'meat', 'poultry', 'seafood'];
const NON_PESCATARIAN = ['beef', 'chicken', 'pork', 'turkey', 'lamb', 'veal', 'bison', 'venison', 'duck', 'goose', 'rabbit', 'bacon', 'sausage', 'ham', 'salami', 'pepperoni', 'prosciutto', 'chorizo', 'lard', 'meat', 'poultry'];
const NON_PALEO = ['wheat', 'flour', 'bread', 'pasta', 'rice', 'oat', 'grain', 'cereal', 'bean', 'lentil', 'chickpea', 'soy', 'tofu', 'peanut', 'legume', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sugar', 'candy', 'corn syrup', 'maltodextrin'];
const NON_WHOLE30 = ['sugar', 'wheat', 'flour', 'bread', 'pasta', 'rice', 'oat', 'grain', 'bean', 'lentil', 'chickpea', 'soy', 'tofu', 'peanut', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'corn syrup', 'artificial'];
const NON_GLUTEN = ['wheat', 'barley', 'rye', 'malt', 'semolina', 'spelt', 'kamut', 'triticale', 'bread', 'pasta', 'couscous', 'crouton'];

export const checkDietCompliance = (food, dietId) => {
  if (!dietId || dietId === 'none') return null;

  const name = (food.name || '').toLowerCase();
  const brand = (food.brandName || '').toLowerCase();
  const text = `${name} ${brand}`;
  const has = (words) => words.some(w => text.includes(w));
  const serving = food.servingSize || 100;

  switch (dietId) {
    case 'keto': {
      const netCarbs = Math.round(((food.carbs || 0) - (food.fiber || 0)) * (serving / 100));
      if (netCarbs <= 5) return { compliant: true, label: `${netCarbs}g net carbs` };
      if (netCarbs <= 12) return { compliant: 'warn', label: `${netCarbs}g net carbs` };
      return { compliant: false, label: `${netCarbs}g net carbs` };
    }
    case 'low_carb': {
      const netCarbs = Math.round(((food.carbs || 0) - (food.fiber || 0)) * (serving / 100));
      if (netCarbs <= 15) return { compliant: true, label: `${netCarbs}g net carbs` };
      if (netCarbs <= 30) return { compliant: 'warn', label: `${netCarbs}g net carbs` };
      return { compliant: false, label: `${netCarbs}g net carbs` };
    }
    case 'vegan':
      return has(NON_VEGAN)
        ? { compliant: false, label: 'Contains animal products' }
        : { compliant: true, label: 'Plant-based ✓' };
    case 'vegetarian':
      return has(NON_VEGETARIAN)
        ? { compliant: false, label: 'Contains meat/fish' }
        : { compliant: true, label: 'Vegetarian ✓' };
    case 'pescatarian':
      return has(NON_PESCATARIAN)
        ? { compliant: false, label: 'Contains meat' }
        : { compliant: true, label: 'Pescatarian ✓' };
    case 'paleo':
      return has(NON_PALEO)
        ? { compliant: false, label: 'Not paleo' }
        : { compliant: true, label: 'Paleo ✓' };
    case 'dash': {
      const sodium = Math.round((food.sodium || 0) * (serving / 100));
      if (sodium <= 140) return { compliant: true, label: `${sodium}mg Na` };
      if (sodium <= 600) return { compliant: 'warn', label: `${sodium}mg Na` };
      return { compliant: false, label: `${sodium}mg Na — high` };
    }
    case 'whole30':
      return has(NON_WHOLE30)
        ? { compliant: false, label: 'Not Whole30' }
        : { compliant: true, label: 'Whole30 ✓' };
    case 'gluten_free':
      return has(NON_GLUTEN)
        ? { compliant: false, label: 'Contains gluten' }
        : { compliant: true, label: 'Gluten-free ✓' };
    case 'high_protein': {
      const protein = Math.round((food.protein || 0) * (serving / 100));
      const calories = Math.round((food.calories || 0) * (serving / 100));
      const pct = calories > 0 ? Math.round((protein * 4 / calories) * 100) : 0;
      if (pct >= 30) return { compliant: true, label: `${pct}% protein` };
      if (pct >= 20) return { compliant: 'warn', label: `${pct}% protein` };
      return { compliant: false, label: `${pct}% protein` };
    }
    case 'mediterranean':
    case 'vegetarian':
    default:
      return null;
  }
};

export const getDietDailyMetrics = (foods, diet, calorieTarget) => {
  if (!diet || diet.id === 'none') return null;
  const scale = (f, val) => (val || 0) * ((f.servingSize || 100) / 100);

  const totals = foods.reduce((acc, f) => {
    acc.calories += scale(f, f.calories);
    acc.protein += scale(f, f.protein);
    acc.carbs += scale(f, f.carbs);
    acc.fat += scale(f, f.fat);
    acc.fiber += scale(f, f.fiber);
    acc.sodium += scale(f, f.sodium);
    acc.sugar += scale(f, f.sugar);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0 });

  const netCarbs = Math.max(0, totals.carbs - totals.fiber);
  const metrics = [];

  if (diet.id === 'keto' || diet.id === 'low_carb') {
    const limit = diet.dailyLimits.netCarbs;
    metrics.push({ label: 'Net Carbs', value: Math.round(netCarbs), unit: 'g', limit, color: netCarbs > limit ? 'red' : netCarbs > limit * 0.8 ? 'yellow' : 'green' });
  }
  if (diet.id === 'dash' || diet.dailyLimits.sodium) {
    const limit = diet.dailyLimits.sodium || 2300;
    metrics.push({ label: 'Sodium', value: Math.round(totals.sodium), unit: 'mg', limit, color: totals.sodium > limit ? 'red' : totals.sodium > limit * 0.8 ? 'yellow' : 'green' });
  }
  if (diet.keyMetrics.includes('fiber')) {
    metrics.push({ label: 'Fiber', value: Math.round(totals.fiber * 10) / 10, unit: 'g', limit: 30, color: totals.fiber >= 25 ? 'green' : 'blue' });
  }
  if (diet.keyMetrics.includes('sugar') && diet.dailyLimits.sugar !== undefined) {
    const limit = diet.dailyLimits.sugar || 50;
    metrics.push({ label: 'Sugar', value: Math.round(totals.sugar * 10) / 10, unit: 'g', limit, color: totals.sugar > limit ? 'red' : 'green' });
  }
  if (diet.macroSplit) {
    const targetProteinPct = diet.macroSplit.protein;
    const actualPct = totals.calories > 0 ? Math.round((totals.protein * 4 / totals.calories) * 100) : 0;
    metrics.push({ label: 'Protein %', value: actualPct, unit: '%', limit: 100, target: targetProteinPct, color: Math.abs(actualPct - targetProteinPct) <= 5 ? 'green' : 'yellow' });
    const targetFatPct = diet.macroSplit.fat;
    const fatPct = totals.calories > 0 ? Math.round((totals.fat * 9 / totals.calories) * 100) : 0;
    metrics.push({ label: 'Fat %', value: fatPct, unit: '%', limit: 100, target: targetFatPct, color: Math.abs(fatPct - targetFatPct) <= 5 ? 'green' : 'yellow' });
  }

  return metrics.length > 0 ? metrics : null;
};
