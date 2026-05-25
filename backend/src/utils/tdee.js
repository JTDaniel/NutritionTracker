const calculateBMR = (weightKg, heightCm, age, gender) => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
};

const activityMultipliers = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9
};

const calculateTDEE = (bmr, activityLevel) => {
  const multiplier = activityMultipliers[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
};

// 1 lb/week ≈ 500 kcal/day deficit or surplus
const calculateTargets = (tdee) => ({
  maintain: tdee,
  lose_half_lb: Math.max(1200, tdee - 250),
  lose_one_lb: Math.max(1200, tdee - 500),
  lose_one_half_lb: Math.max(1200, tdee - 750),
  gain_half_lb: tdee + 250,
  gain_one_lb: tdee + 500,
  gain_one_half_lb: tdee + 750
});

const calculateUserTDEE = (user) => {
  const bmr = Math.round(calculateBMR(user.weightKg, user.heightCm, user.age, user.gender));
  const tdee = calculateTDEE(bmr, user.activityLevel);
  const targets = calculateTargets(tdee);

  // Calorie target based on user's configured weekly goal
  // weeklyWeightGoalLbs: negative = loss, positive = gain, 0 = maintain
  const weeklyGoal = user.weeklyWeightGoalLbs ?? -1.0;
  const dailyAdjustment = Math.round(weeklyGoal * 500);
  const recommendedCalories = Math.max(1200, tdee + dailyAdjustment);

  return { bmr, tdee, targets, recommendedCalories, weeklyWeightGoalLbs: weeklyGoal };
};

module.exports = { calculateBMR, calculateTDEE, calculateTargets, calculateUserTDEE };
