import React from 'react';

/**
 * FoodCard - Displays a food item with optional delete or add action
 */
export default function FoodCard({ food, onDelete, onAdd, showAdd = false, index, dietCompliance }) {
  const displayCalories = food.servingSize
    ? Math.round((food.calories || 0) * (food.servingSize / 100))
    : Math.round(food.calories || 0);

  return (
    <div className="flex items-start justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{food.name}</p>
            {food.brandName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{food.brandName}</p>
            )}
            {dietCompliance && (
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${
                dietCompliance.compliant === true
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  : dietCompliance.compliant === 'warn'
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
              }`}>
                {dietCompliance.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
            {displayCalories} kcal
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {food.householdServing
              ? `${food.householdServing} (${food.servingSize || 100}g)`
              : `${food.servingSize || 100}g`}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <span className="text-blue-600 dark:text-blue-400">P: {Math.round((food.protein || 0) * ((food.servingSize || 100) / 100))}g</span>
            <span className="text-yellow-600 dark:text-yellow-400">C: {Math.round((food.carbs || 0) * ((food.servingSize || 100) / 100))}g</span>
            <span className="text-red-500 dark:text-red-400">F: {Math.round((food.fat || 0) * ((food.servingSize || 100) / 100))}g</span>
          </div>
        </div>
      </div>

      <div className="ml-3 flex items-center gap-2 flex-shrink-0">
        {showAdd && onAdd && (
          <button
            onClick={() => onAdd(food)}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title="Add to log"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(index)}
            className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
