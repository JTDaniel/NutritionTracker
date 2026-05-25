import React, { useState, useRef, useEffect, useContext } from 'react';
import { searchFoods, addFoodLog, getFoodSeedStatus, getRecentFoods } from '../api.js';
import FoodCard from '../components/FoodCard.jsx';
import { GamificationContext } from '../context/GamificationContext.js';
import { checkDietCompliance, getDiet } from '../utils/dietUtils.js';

const today = () => new Date().toISOString().split('T')[0];

export default function FoodSearch() {
  const { triggerAward } = useContext(GamificationContext);
  const [dietType] = useState(() => localStorage.getItem('nt-diet') || 'none');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingSize, setServingSize] = useState(100);
  const [logDate, setLogDate] = useState(today());
  const [addSuccess, setAddSuccess] = useState(null);
  const [addError, setAddError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [seedStatus, setSeedStatus] = useState(null);
  const [recentFoods, setRecentFoods] = useState([]);
  const searchTimeout = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const status = await getFoodSeedStatus();
        setSeedStatus(status);
        if (status.brandedInProgress) {
          pollRef.current = setTimeout(poll, 5000);
        }
      } catch (_) {}
    };
    poll();
    return () => clearTimeout(pollRef.current);
  }, []);

  useEffect(() => {
    getRecentFoods(25)
      .then(data => setRecentFoods(data.foods || []))
      .catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const data = await searchFoods(query.trim());
      setResults(data.foods || []);
      if ((data.foods || []).length === 0) {
        setError('No foods found. Try a different search term.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setServingSize(food.servingSize || 100);
    setAddSuccess(null);
    setAddError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToLog = async () => {
    if (!selectedFood) return;
    setAdding(true);
    setAddError(null);
    try {
      const foodToAdd = {
        ...selectedFood,
        servingSize: Number(servingSize) || 100,
        servingUnit: 'g'
      };
      await addFoodLog(logDate, foodToAdd);
      setAddSuccess(`Added ${selectedFood.name} to your log!`);
      triggerAward('FOOD_LOG');
      setSelectedFood(null);
      setServingSize(100);
      getRecentFoods(25).then(data => setRecentFoods(data.foods || [])).catch(() => {});
    } catch (err) {
      setAddError('Failed to add food: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  // Calculate scaled nutrition for preview
  const scaled = selectedFood ? {
    calories: Math.round((selectedFood.calories || 0) * (servingSize / 100)),
    protein: Math.round((selectedFood.protein || 0) * (servingSize / 100) * 10) / 10,
    carbs: Math.round((selectedFood.carbs || 0) * (servingSize / 100) * 10) / 10,
    fat: Math.round((selectedFood.fat || 0) * (servingSize / 100) * 10) / 10,
    fiber: Math.round((selectedFood.fiber || 0) * (servingSize / 100) * 10) / 10
  } : null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Foods</h1>

      {/* Seeding status banner */}
      {seedStatus && seedStatus.brandedInProgress && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 flex items-center gap-3">
          <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">Building local food database…</p>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
              Importing branded foods in the background —{' '}
              {seedStatus.brandedImported.toLocaleString()} of ~700,000 imported.
              Search already works with {seedStatus.totalFoods.toLocaleString()} foods.
            </p>
          </div>
        </div>
      )}

      {/* Success message */}
      {addSuccess && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 flex items-center gap-3">
          <span className="text-green-500 text-xl">✓</span>
          <p className="text-green-700 dark:text-green-400 font-medium">{addSuccess}</p>
          <button
            onClick={() => setAddSuccess(null)}
            className="ml-auto text-green-500 hover:text-green-700 p-1"
          >✕</button>
        </div>
      )}

      {/* Add food modal */}
      {selectedFood && (
        <div className="card border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedFood.name}</h2>
              {selectedFood.brandName && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFood.brandName}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedFood(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none p-1"
            >✕</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="label">Serving Size (grams)</label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  step="1"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  className="input"
                />
                {selectedFood.householdServing && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    1 serving = <button
                      type="button"
                      className="text-green-600 dark:text-green-400 font-medium underline"
                      onClick={() => setServingSize(selectedFood.servingSize || 100)}
                    >
                      {selectedFood.householdServing} ({selectedFood.servingSize}g)
                    </button>
                  </p>
                )}
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

            {scaled && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Nutrition for {servingSize}g</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center bg-green-50 dark:bg-green-900/30 rounded p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{scaled.calories}</p>
                  </div>
                  <div className="text-center bg-blue-50 dark:bg-blue-900/30 rounded p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{scaled.protein}g</p>
                  </div>
                  <div className="text-center bg-yellow-50 dark:bg-yellow-900/30 rounded p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{scaled.carbs}g</p>
                  </div>
                  <div className="text-center bg-red-50 dark:bg-red-900/30 rounded p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{scaled.fat}g</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {addError && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-3">{addError}</p>
          )}

          <button
            onClick={handleAddToLog}
            disabled={adding || !servingSize || servingSize <= 0}
            className="btn-primary w-full mt-4"
          >
            {adding ? 'Adding...' : 'Add to Daily Log'}
          </button>
        </div>
      )}

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a food (e.g., chicken breast, apple, oatmeal)..."
          className="input flex-1"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary px-4 sm:px-6 flex-shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">Searching</span>
            </span>
          ) : 'Search'}
        </button>
      </form>

      {/* Results */}
      {error && !loading && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-400">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">{results.length} results for "{query}"</p>
          {results.map((food) => (
            <FoodCard
              key={food.fdcId}
              food={food}
              onAdd={handleSelectFood}
              showAdd={true}
              dietCompliance={checkDietCompliance(food, dietType)}
            />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && query && (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-500 dark:text-gray-400">No results found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {!query && results.length === 0 && (
        <div className="space-y-4">
          {recentFoods.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recently added</p>
              <div className="space-y-2">
                {recentFoods.map((food, i) => (
                  <FoodCard
                    key={`${food.fdcId || food.name}-${i}`}
                    food={food}
                    onAdd={handleSelectFood}
                    showAdd={true}
                    dietCompliance={checkDietCompliance(food, dietType)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">🥗</p>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Search for any food</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Local database — {seedStatus ? seedStatus.totalFoods.toLocaleString() : '…'} foods
                {seedStatus && seedStatus.branded ? ' (fully loaded)' : ''}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Chicken Breast', 'Brown Rice', 'Banana', 'Egg', 'Almonds', 'Greek Yogurt'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); }}
                    className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {seedStatus ? seedStatus.totalFoods.toLocaleString() : '…'} foods in database
              {seedStatus && seedStatus.branded ? ' · fully loaded' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
