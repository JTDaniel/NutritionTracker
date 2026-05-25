import React, { useState, useEffect, useContext } from 'react';
import { searchExercises, addExerciseLog, getUser } from '../api.js';
import ExerciseCard from '../components/ExerciseCard.jsx';
import { GamificationContext } from '../context/GamificationContext.js';

const today = () => new Date().toISOString().split('T')[0];
const CATEGORIES = ['All', 'Cardio', 'Strength', 'Flexibility', 'Sports'];

export default function ExerciseSearch() {
  const { triggerAward } = useContext(GamificationContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [logDate, setLogDate] = useState(today());
  const [addSuccess, setAddSuccess] = useState(null);
  const [addError, setAddError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  // Load all exercises on mount
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [exData, userData] = await Promise.all([
          searchExercises(''),
          getUser()
        ]);
        setAllExercises(exData.exercises || []);
        setResults(exData.exercises || []);
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  const handleSearch = async (searchQuery, category) => {
    const q = searchQuery !== undefined ? searchQuery : query;
    const cat = category !== undefined ? category : activeCategory;

    setSearching(true);
    try {
      let exercises;
      if (q.trim()) {
        const data = await searchExercises(q.trim());
        exercises = data.exercises || [];
      } else {
        exercises = allExercises;
      }

      // Filter by category
      if (cat !== 'All') {
        exercises = exercises.filter(ex => ex.category === cat);
      }

      setResults(exercises);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    handleSearch(val, activeCategory);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    handleSearch(query, cat);
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
    setDurationMinutes(30);
    setAddSuccess(null);
    setAddError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToLog = async () => {
    if (!selectedExercise) return;
    setAdding(true);
    setAddError(null);
    try {
      const weightKg = user?.weightKg || 70;
      const metValue = selectedExercise.metValue || 3.5;
      const dur = Number(durationMinutes) || 30;
      const caloriesBurned = Math.round(metValue * weightKg * (dur / 60));

      await addExerciseLog(logDate, {
        exerciseId: selectedExercise._id || '',
        name: selectedExercise.name,
        metValue,
        durationMinutes: dur,
        caloriesBurned,
        category: selectedExercise.category
      });

      setAddSuccess(`Added ${selectedExercise.name} (${caloriesBurned} kcal burned)`);
      triggerAward('EXERCISE_LOG');
      setSelectedExercise(null);
      setDurationMinutes(30);
    } catch (err) {
      setAddError('Failed to add exercise: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const weightKg = user?.weightKg || 70;
  const previewCalories = selectedExercise
    ? Math.round((selectedExercise.metValue || 3.5) * weightKg * (durationMinutes / 60))
    : 0;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Exercises</h1>

      {/* Success message */}
      {addSuccess && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 flex items-center gap-3">
          <span className="text-green-500 text-xl">✓</span>
          <p className="text-green-700 dark:text-green-400 font-medium">{addSuccess}</p>
          <button onClick={() => setAddSuccess(null)} className="ml-auto text-green-500 hover:text-green-700 p-1">✕</button>
        </div>
      )}

      {/* Add exercise modal */}
      {selectedExercise && (
        <div className="card border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedExercise.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedExercise.category} • MET {selectedExercise.metValue}</p>
              {selectedExercise.description && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{selectedExercise.description}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedExercise(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none p-1"
            >✕</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  step="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Log Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Calorie Estimate</p>
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{previewCalories}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">kcal burned</p>
              </div>
              <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 space-y-1">
                <p>Formula: MET × weight × time</p>
                <p>{selectedExercise.metValue} × {weightKg}kg × {(durationMinutes / 60).toFixed(2)}hr</p>
                {!user?.weightKg && (
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium">⚠️ Using default weight (70kg). Update your profile for accuracy.</p>
                )}
              </div>
            </div>
          </div>

          {addError && <p className="text-red-600 dark:text-red-400 text-sm mt-3">{addError}</p>}

          <button
            onClick={handleAddToLog}
            disabled={adding || !durationMinutes || durationMinutes <= 0}
            className="btn-primary w-full mt-4"
          >
            {adding ? 'Adding...' : `Add ${previewCalories} kcal burned to Log`}
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search exercises (e.g., running, yoga, weight lifting)..."
          className="input flex-1"
        />
        {searching && (
          <div className="flex items-center px-3 flex-shrink-0">
            <span className="inline-block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading exercises...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">{results.length} exercise{results.length !== 1 ? 's' : ''}</p>
          {results.map((exercise) => (
            <ExerciseCard
              key={exercise._id}
              exercise={exercise}
              onAdd={handleSelectExercise}
              showAdd={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">🏋️</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No exercises found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different search term or category</p>
        </div>
      )}
    </div>
  );
}
