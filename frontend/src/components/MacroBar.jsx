import React from 'react';

/**
 * MacroBar - Shows calories and macro progress bars
 * @param {object} consumed - { calories, protein, carbs, fat, fiber }
 * @param {number} calorieTarget - daily calorie target
 */
export default function MacroBar({ consumed = {}, calorieTarget = 2000 }) {
  const cal = consumed.calories || 0;
  const protein = consumed.protein || 0;
  const carbs = consumed.carbs || 0;
  const fat = consumed.fat || 0;

  // Standard macro targets based on calorie target
  const proteinTargetCal = calorieTarget * 0.25;
  const carbsTargetCal = calorieTarget * 0.50;
  const fatTargetCal = calorieTarget * 0.25;

  const proteinTargetG = Math.round(proteinTargetCal / 4);
  const carbsTargetG = Math.round(carbsTargetCal / 4);
  const fatTargetG = Math.round(fatTargetCal / 9);

  const calPercent = Math.min((cal / calorieTarget) * 100, 100);
  const proteinPercent = Math.min((protein / proteinTargetG) * 100, 100);
  const carbsPercent = Math.min((carbs / carbsTargetG) * 100, 100);
  const fatPercent = Math.min((fat / fatTargetG) * 100, 100);

  const macros = [
    {
      label: 'Protein',
      value: Math.round(protein),
      target: proteinTargetG,
      unit: 'g',
      percent: proteinPercent,
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Carbs',
      value: Math.round(carbs),
      target: carbsTargetG,
      unit: 'g',
      percent: carbsPercent,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    {
      label: 'Fat',
      value: Math.round(fat),
      target: fatTargetG,
      unit: 'g',
      percent: fatPercent,
      color: 'bg-red-400',
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    }
  ];

  return (
    <div className="space-y-3">
      {/* Calories */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Calories</span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            <span className={`font-bold ${cal > calorieTarget ? 'text-red-600' : 'text-green-600'}`}>
              {Math.round(cal)}
            </span>
            {' / '}
            <span className="text-gray-500 dark:text-gray-400">{Math.round(calorieTarget)} kcal</span>
          </span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${cal > calorieTarget ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${calPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 text-right">
          {Math.max(0, Math.round(calorieTarget - cal))} kcal remaining
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        {macros.map((macro) => (
          <div key={macro.label} className={`${macro.bgColor} rounded-lg p-3`}>
            <div className="flex justify-between items-start mb-1.5">
              <span className={`text-xs font-semibold ${macro.textColor}`}>{macro.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{macro.value}/{macro.target}g</span>
            </div>
            <div className="h-2 bg-white dark:bg-gray-800 bg-opacity-60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${macro.color}`}
                style={{ width: `${macro.percent}%` }}
              />
            </div>
            <div className={`text-xs font-bold mt-1 ${macro.textColor}`}>
              {Math.round(macro.percent)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
