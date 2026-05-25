const axios = require('axios');
const JSONStream = require('JSONStream');
const unzipper = require('unzipper');
const Exercise = require('./models/Exercise');
const FoodItem = require('./models/FoodItem');

// ─── Seeding status (exported so the route can expose it) ────────────────────
const seedingStatus = {
  foundation: false,
  srLegacy: false,
  branded: false,
  brandedInProgress: false,
  brandedImported: 0,
  error: null
};
module.exports.seedingStatus = seedingStatus;

// ─── Nutrient helpers ─────────────────────────────────────────────────────────
const NUTRIENT_IDS = {
  energy: 1008, protein: 1003, fat: 1004, carbs: 1005, fiber: 1079,
  sodium: 1093, sugar: 1235, cholesterol: 1253, saturatedFat: 1258,
  vitaminA: 1106, vitaminC: 1162, vitaminD: 1114, calcium: 1087, iron: 1089, potassium: 1092
};

const extractNutrient = (foodNutrients, id) => {
  if (!Array.isArray(foodNutrients)) return 0;
  const entry = foodNutrients.find(n => {
    const nid = (n.nutrient && n.nutrient.id) || n.nutrientId || n.nutrientNumber;
    return Number(nid) === id;
  });
  if (!entry) return 0;
  return parseFloat(Number(entry.amount ?? entry.value ?? 0).toFixed(2));
};

const getServingInfo = (food, dataType) => {
  if (dataType === 'Branded') {
    const raw = food.servingSize || 100;
    const unit = (food.servingSizeUnit || 'g').toLowerCase();
    // Normalise to grams
    let grams = unit === 'oz' ? raw * 28.3495 : raw; // ml ≈ g for water-based foods
    grams = Math.round(grams) || 100;
    const household = (food.householdServingFullText || '').trim();
    return {
      servingSize: grams,
      householdServing: household || `${grams}g`
    };
  }
  // Foundation / SR Legacy — pull first foodPortion entry
  const portions = food.foodPortions || [];
  if (portions.length > 0) {
    const p = portions[0];
    const grams = Math.round(p.gramWeight) || 100;
    const amount = p.amount != null ? p.amount : 1;
    const desc = (p.measureDescription || p.portionDescription || '').trim();
    const household = desc
      ? `${amount === 1 ? '1' : amount} ${desc}`.trim()
      : `${grams}g`;
    return { servingSize: grams, householdServing: household };
  }
  return { servingSize: 100, householdServing: '100g' };
};

const formatFood = (food, dataType) => ({
  fdcId: String(food.fdcId),
  name: (food.description || '').trim(),
  brandName: (food.brandOwner || food.brandName || '').trim(),
  calories: extractNutrient(food.foodNutrients, NUTRIENT_IDS.energy),
  protein: extractNutrient(food.foodNutrients, NUTRIENT_IDS.protein),
  carbs: extractNutrient(food.foodNutrients, NUTRIENT_IDS.carbs),
  fat: extractNutrient(food.foodNutrients, NUTRIENT_IDS.fat),
  fiber: extractNutrient(food.foodNutrients, NUTRIENT_IDS.fiber),
  sodium: extractNutrient(food.foodNutrients, NUTRIENT_IDS.sodium),
  sugar: extractNutrient(food.foodNutrients, NUTRIENT_IDS.sugar),
  cholesterol: extractNutrient(food.foodNutrients, NUTRIENT_IDS.cholesterol),
  saturatedFat: extractNutrient(food.foodNutrients, NUTRIENT_IDS.saturatedFat),
  vitaminA: extractNutrient(food.foodNutrients, NUTRIENT_IDS.vitaminA),
  vitaminC: extractNutrient(food.foodNutrients, NUTRIENT_IDS.vitaminC),
  vitaminD: extractNutrient(food.foodNutrients, NUTRIENT_IDS.vitaminD),
  calcium: extractNutrient(food.foodNutrients, NUTRIENT_IDS.calcium),
  iron: extractNutrient(food.foodNutrients, NUTRIENT_IDS.iron),
  potassium: extractNutrient(food.foodNutrients, NUTRIENT_IDS.potassium),
  dataType,
  ...getServingInfo(food, dataType)
});

// ─── Stream: download zip → unzip → JSON parse → batch insert ────────────────
const streamImport = async (url, arrayKey, dataType, onProgress) => {
  const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 0 });

  return new Promise((resolve, reject) => {
    let count = 0;
    let batch = [];

    const flush = (stream) => {
      const docs = batch.splice(0);
      if (docs.length === 0) return Promise.resolve();
      if (stream) stream.pause();
      return FoodItem.insertMany(docs, { ordered: false })
        .catch(err => { if (err.code !== 11000) console.warn(`[${dataType}] insert warning:`, err.message); })
        .then(() => {
          count += docs.length;
          if (onProgress) onProgress(count);
          if (stream) stream.resume();
        });
    };

    const jsonStream = response.data
      .pipe(unzipper.ParseOne(/\.json$/i))
      .pipe(JSONStream.parse(`${arrayKey}.*`));

    jsonStream.on('data', (food) => {
      batch.push(formatFood(food, dataType));
      if (batch.length >= 500) flush(jsonStream);
    });

    jsonStream.on('end', async () => {
      try {
        await flush(null);
        resolve(count);
      } catch (err) {
        reject(err);
      }
    });

    jsonStream.on('error', reject);
    response.data.on('error', reject);
  });
};

// ─── Food seeding ─────────────────────────────────────────────────────────────

const seedEssentialFoods = async () => {
  const count = await FoodItem.countDocuments();

  // Already seeded from a prior run
  if (count >= 9000) {
    seedingStatus.foundation = true;
    seedingStatus.srLegacy = true;
    console.log(`Food DB: ${count} foods present (Foundation + SR Legacy already seeded).`);
    return;
  }

  console.log('Downloading USDA Foundation Foods...');
  const foundationCount = await streamImport(
    'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2026-04-30.zip',
    'FoundationFoods',
    'Foundation'
  );
  seedingStatus.foundation = true;
  console.log(`Foundation Foods: ${foundationCount} foods imported.`);

  console.log('Downloading USDA SR Legacy Foods...');
  const srCount = await streamImport(
    'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip',
    'SRLegacyFoods',
    'SR Legacy'
  );
  seedingStatus.srLegacy = true;
  console.log(`SR Legacy: ${srCount} foods imported.`);
};

const seedBrandedFoods = async () => {
  const count = await FoodItem.countDocuments();
  if (count > 50000) {
    seedingStatus.branded = true;
    console.log(`Food DB: Branded foods already seeded (${count} total).`);
    return;
  }

  seedingStatus.brandedInProgress = true;
  console.log('Downloading Branded Foods (~700k items, running in background)...');

  try {
    const total = await streamImport(
      'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_json_2026-04-30.zip',
      'BrandedFoods',
      'Branded',
      (n) => {
        seedingStatus.brandedImported = n;
        if (n % 50000 === 0) console.log(`[Branded] ${n} foods imported...`);
      }
    );
    seedingStatus.branded = true;
    seedingStatus.brandedInProgress = false;
    console.log(`Branded Foods complete: ${total} foods imported.`);
  } catch (err) {
    seedingStatus.brandedInProgress = false;
    seedingStatus.error = err.message;
    console.error('Branded Foods seed error:', err.message);
  }
};

// ─── Exercise seeding ─────────────────────────────────────────────────────────
const exercises = [
  // Cardio
  { name: 'Running', category: 'Cardio', metValue: 8.0, description: 'Moderate-pace running at 6 mph' },
  { name: 'Jogging', category: 'Cardio', metValue: 7.0, description: 'Light jogging at 5 mph' },
  { name: 'Walking', category: 'Cardio', metValue: 3.5, description: 'Brisk walking at 3.5 mph' },
  { name: 'Speed Walking', category: 'Cardio', metValue: 4.3, description: 'Fast walking at 4.5 mph' },
  { name: 'Cycling', category: 'Cardio', metValue: 6.0, description: 'Moderate-effort cycling at 12-14 mph' },
  { name: 'Swimming', category: 'Cardio', metValue: 6.0, description: 'Freestyle swimming, moderate effort' },
  { name: 'Jump Rope', category: 'Cardio', metValue: 11.0, description: 'Continuous jump rope, moderate pace' },
  { name: 'Rowing', category: 'Cardio', metValue: 7.0, description: 'Rowing machine, moderate effort' },
  { name: 'Elliptical', category: 'Cardio', metValue: 5.0, description: 'Elliptical trainer, moderate effort' },
  { name: 'Stair Climbing', category: 'Cardio', metValue: 9.0, description: 'Stair stepper machine or climbing stairs' },
  { name: 'HIIT', category: 'Cardio', metValue: 8.0, description: 'High intensity interval training' },
  { name: 'Hiking', category: 'Cardio', metValue: 6.0, description: 'Hiking cross-country with light pack' },
  { name: 'Dancing', category: 'Cardio', metValue: 5.5, description: 'Aerobic dancing, general' },
  { name: 'Kickboxing', category: 'Cardio', metValue: 7.5, description: 'Kickboxing cardio class' },
  { name: 'Zumba', category: 'Cardio', metValue: 6.5, description: 'Zumba or aerobic dance class' },
  { name: 'Cycling (Stationary)', category: 'Cardio', metValue: 5.5, description: 'Stationary bike, moderate effort' },
  { name: 'Cross-Country Skiing', category: 'Cardio', metValue: 7.5, description: 'Cross-country skiing, moderate effort' },
  { name: 'Water Aerobics', category: 'Cardio', metValue: 4.0, description: 'Water aerobics class' },
  // Strength
  { name: 'Weight Lifting', category: 'Strength', metValue: 3.5, description: 'General weight training' },
  { name: 'Bodyweight Exercises', category: 'Strength', metValue: 3.8, description: 'General bodyweight exercises (push-ups, sit-ups)' },
  { name: 'CrossFit', category: 'Strength', metValue: 8.0, description: 'CrossFit WOD, vigorous effort' },
  { name: 'Resistance Training', category: 'Strength', metValue: 4.0, description: 'Resistance band training, moderate effort' },
  { name: 'Push-ups', category: 'Strength', metValue: 3.8, description: 'Push-up exercises' },
  { name: 'Pull-ups', category: 'Strength', metValue: 4.0, description: 'Pull-up and chin-up exercises' },
  { name: 'Squats', category: 'Strength', metValue: 5.0, description: 'Squat exercises with or without weight' },
  { name: 'Deadlifts', category: 'Strength', metValue: 4.5, description: 'Deadlift strength training' },
  { name: 'Bench Press', category: 'Strength', metValue: 3.5, description: 'Bench press, moderate effort' },
  { name: 'Circuit Training', category: 'Strength', metValue: 6.0, description: 'Circuit training with weights' },
  { name: 'Kettlebell Training', category: 'Strength', metValue: 5.5, description: 'Kettlebell swings and exercises' },
  { name: 'Olympic Lifting', category: 'Strength', metValue: 6.0, description: 'Olympic-style weightlifting' },
  { name: 'Powerlifting', category: 'Strength', metValue: 4.0, description: 'Powerlifting competition lifts' },
  { name: 'TRX / Suspension Training', category: 'Strength', metValue: 4.5, description: 'Suspension strap training' },
  // Flexibility
  { name: 'Yoga', category: 'Flexibility', metValue: 2.5, description: 'Hatha yoga, gentle poses' },
  { name: 'Power Yoga', category: 'Flexibility', metValue: 4.0, description: 'Power or Vinyasa yoga, vigorous' },
  { name: 'Stretching', category: 'Flexibility', metValue: 2.3, description: 'General stretching and flexibility exercises' },
  { name: 'Pilates', category: 'Flexibility', metValue: 3.0, description: 'Pilates mat exercises' },
  { name: 'Tai Chi', category: 'Flexibility', metValue: 3.0, description: 'Tai Chi, slow movements' },
  { name: 'Foam Rolling', category: 'Flexibility', metValue: 2.0, description: 'Self-myofascial release with foam roller' },
  { name: 'Ballet / Barre', category: 'Flexibility', metValue: 4.0, description: 'Ballet or barre workout class' },
  // Sports
  { name: 'Basketball', category: 'Sports', metValue: 6.5, description: 'Basketball game, competitive' },
  { name: 'Soccer', category: 'Sports', metValue: 7.0, description: 'Soccer / football game, competitive' },
  { name: 'Tennis', category: 'Sports', metValue: 7.3, description: 'Tennis singles, competitive' },
  { name: 'Volleyball', category: 'Sports', metValue: 4.0, description: 'Volleyball, non-competitive' },
  { name: 'Baseball', category: 'Sports', metValue: 4.5, description: 'Baseball or softball game' },
  { name: 'Golf', category: 'Sports', metValue: 3.5, description: 'Golf, walking and carrying clubs' },
  { name: 'Martial Arts', category: 'Sports', metValue: 10.0, description: 'Martial arts training (karate, judo, etc.)' },
  { name: 'Rock Climbing', category: 'Sports', metValue: 8.0, description: 'Rock climbing, ascending' },
  { name: 'Skiing', category: 'Sports', metValue: 6.0, description: 'Downhill skiing, moderate effort' },
  { name: 'Surfing', category: 'Sports', metValue: 3.0, description: 'Surfing, body or board' },
  { name: 'Football', category: 'Sports', metValue: 8.0, description: 'American football game, competitive' },
  { name: 'Hockey', category: 'Sports', metValue: 8.0, description: 'Ice hockey game' },
  { name: 'Racquetball', category: 'Sports', metValue: 7.0, description: 'Racquetball, casual' },
  { name: 'Badminton', category: 'Sports', metValue: 5.5, description: 'Badminton, social play' },
  { name: 'Table Tennis', category: 'Sports', metValue: 4.0, description: 'Table tennis / ping pong' },
  { name: 'Boxing', category: 'Sports', metValue: 9.0, description: 'Boxing sparring or heavy bag' }
];

const seedExercises = async () => {
  try {
    const count = await Exercise.countDocuments();
    if (count === 0) {
      await Exercise.insertMany(exercises);
      console.log(`Exercises seeded: ${exercises.length} added.`);
    }
  } catch (err) {
    console.error('Error seeding exercises:', err.message);
  }
};

module.exports.seedExercises = seedExercises;
module.exports.seedEssentialFoods = seedEssentialFoods;
module.exports.seedBrandedFoods = seedBrandedFoods;
