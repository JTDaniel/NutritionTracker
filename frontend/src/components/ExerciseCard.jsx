import React from 'react';

const categoryColors = {
  Cardio: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-400',
    badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
  },
  Strength: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  },
  Flexibility: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
  },
  Sports: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  }
};

/**
 * ExerciseCard - Displays an exercise item with optional delete or add action
 */
export default function ExerciseCard({ exercise, onDelete, onAdd, showAdd = false, index }) {
  const colors = categoryColors[exercise.category] || categoryColors.Cardio;

  return (
    <div className="flex items-start justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-medium text-gray-900 dark:text-white text-sm">{exercise.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
            {exercise.category}
          </span>
        </div>

        {exercise.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 truncate">{exercise.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {exercise.metValue && (
            <span className="text-xs text-gray-500 dark:text-gray-400">MET: {exercise.metValue}</span>
          )}
          {exercise.durationMinutes && (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
              {exercise.durationMinutes} min
            </span>
          )}
          {exercise.caloriesBurned > 0 && (
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded">
              -{exercise.caloriesBurned} kcal
            </span>
          )}
        </div>
      </div>

      <div className="ml-3 flex items-center gap-2 flex-shrink-0">
        {showAdd && onAdd && (
          <button
            onClick={() => onAdd(exercise)}
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
