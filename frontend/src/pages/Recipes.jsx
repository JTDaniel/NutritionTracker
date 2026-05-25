import React, { useState, useEffect, useCallback, useContext } from 'react';
import { getRecipes, createRecipe, updateRecipe, deleteRecipe, searchFoods, addFoodLog } from '../api.js';

const today = () => new Date().toISOString().split('T')[0];

const calcNutrition = (ingredients) => {
  return ingredients.reduce((acc, ing) => {
    const scale = (ing.servingSize || 100) / 100;
    acc.calories += (ing.calories || 0) * scale;
    acc.protein += (ing.protein || 0) * scale;
    acc.carbs += (ing.carbs || 0) * scale;
    acc.fat += (ing.fat || 0) * scale;
    acc.fiber += (ing.fiber || 0) * scale;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
};

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Ingredient search state
  const [ingSearch, setIngSearch] = useState('');
  const [ingResults, setIngResults] = useState([]);
  const [ingSearching, setIngSearching] = useState(false);
  const [selectedGrams, setSelectedGrams] = useState(100);

  // Log recipe state
  const [logModalRecipe, setLogModalRecipe] = useState(null);
  const [logServings, setLogServings] = useState(1);
  const [logDate, setLogDate] = useState(today());
  const [logging, setLogging] = useState(false);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecipes();
      setRecipes(data.recipes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  const handleIngSearch = async (q) => {
    setIngSearch(q);
    if (!q.trim()) { setIngResults([]); return; }
    setIngSearching(true);
    try {
      const data = await searchFoods(q, 10);
      setIngResults(data.foods || []);
    } catch (_) {}
    setIngSearching(false);
  };

  const addIngredient = (food) => {
    setIngredients(prev => [...prev, {
      fdcId: food.fdcId,
      name: food.name,
      servingSize: selectedGrams,
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      fiber: food.fiber || 0
    }]);
    setIngSearch('');
    setIngResults([]);
    setSelectedGrams(100);
  };

  const removeIngredient = (idx) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const openEdit = (recipe) => {
    setEditId(recipe._id);
    setRecipeName(recipe.name);
    setServings(recipe.servings || 1);
    setIngredients(recipe.ingredients || []);
    setShowForm(true);
    setFormError(null);
  };

  const openNew = () => {
    setEditId(null);
    setRecipeName('');
    setServings(1);
    setIngredients([]);
    setIngSearch('');
    setIngResults([]);
    setShowForm(true);
    setFormError(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipeName.trim()) return setFormError('Recipe name is required');
    if (ingredients.length === 0) return setFormError('Add at least one ingredient');
    setSaving(true);
    setFormError(null);
    try {
      const payload = { name: recipeName.trim(), servings: Number(servings), ingredients };
      if (editId) {
        await updateRecipe(editId, payload);
      } else {
        await createRecipe(payload);
      }
      setShowForm(false);
      await loadRecipes();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await deleteRecipe(id);
      setRecipes(r => r.filter(r => r._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleLogRecipe = async () => {
    if (!logModalRecipe) return;
    setLogging(true);
    try {
      const scale = logServings / (logModalRecipe.servings || 1);
      for (const ing of logModalRecipe.ingredients) {
        const scaledGrams = Math.round((ing.servingSize || 100) * scale);
        await addFoodLog(logDate, {
          fdcId: ing.fdcId || '',
          name: `${ing.name} (from ${logModalRecipe.name})`,
          servingSize: scaledGrams,
          calories: ing.calories || 0,
          protein: ing.protein || 0,
          carbs: ing.carbs || 0,
          fat: ing.fat || 0,
          fiber: ing.fiber || 0
        });
      }
      setLogModalRecipe(null);
      alert(`Logged ${logModalRecipe.name} to ${logDate}`);
    } catch (err) {
      alert('Log failed: ' + err.message);
    } finally {
      setLogging(false);
    }
  };

  const liveNutrition = calcNutrition(ingredients);
  const perServing = servings > 0 ? {
    calories: Math.round(liveNutrition.calories / servings),
    protein: Math.round(liveNutrition.protein / servings * 10) / 10,
    carbs: Math.round(liveNutrition.carbs / servings * 10) / 10,
    fat: Math.round(liveNutrition.fat / servings * 10) / 10
  } : liveNutrition;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recipes</h1>
        {!showForm && (
          <button className="btn-primary" onClick={openNew}>+ New Recipe</button>
        )}
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editId ? 'Edit Recipe' : 'New Recipe'}</h2>
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Recipe Name <span className="text-red-500">*</span></label>
                <input type="text" className="input" value={recipeName} onChange={e => setRecipeName(e.target.value)} placeholder="e.g. Chicken Stir Fry" required />
              </div>
              <div>
                <label className="label">Servings</label>
                <input type="number" className="input" value={servings} min="1" step="1" onChange={e => setServings(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
            </div>

            {/* Ingredient Search */}
            <div>
              <label className="label">Add Ingredient</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={ingSearch}
                  onChange={e => handleIngSearch(e.target.value)}
                  placeholder="Search foods..."
                />
                <input
                  type="number"
                  className="input w-24"
                  value={selectedGrams}
                  min="1"
                  step="1"
                  onChange={e => setSelectedGrams(Math.max(1, parseInt(e.target.value) || 100))}
                  title="Amount in grams"
                />
                <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 px-1">g</span>
              </div>
              {ingSearching && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Searching...</p>}
              {ingResults.length > 0 && (
                <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {ingResults.map((food, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addIngredient(food)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 text-gray-800 dark:text-gray-200"
                    >
                      <span className="font-medium">{food.name}</span>
                      {food.brandName && <span className="text-gray-400 ml-1 text-xs">({food.brandName})</span>}
                      <span className="text-gray-400 dark:text-gray-500 ml-2 text-xs">{food.calories} kcal/100g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredient List */}
            {ingredients.length > 0 && (
              <div>
                <p className="label mb-2">Ingredients ({ingredients.length})</p>
                <div className="space-y-2">
                  {ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
                      <div>
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{ing.name}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-2">{ing.servingSize}g</span>
                        <span className="text-green-600 dark:text-green-400 ml-2">
                          {Math.round((ing.calories || 0) * (ing.servingSize / 100))} kcal
                        </span>
                      </div>
                      <button type="button" onClick={() => removeIngredient(i)} className="text-red-500 hover:text-red-600 ml-2 text-lg leading-none">&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Nutrition Summary */}
            {ingredients.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Per Serving ({servings} serving{servings !== 1 ? 's' : ''})</p>
                <div className="flex flex-wrap gap-3">
                  <span className="font-bold text-green-700 dark:text-green-400">{perServing.calories} kcal</span>
                  <span className="text-blue-600 dark:text-blue-400">P: {perServing.protein}g</span>
                  <span className="text-yellow-600 dark:text-yellow-400">C: {perServing.carbs}g</span>
                  <span className="text-red-500 dark:text-red-400">F: {perServing.fat}g</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update Recipe' : 'Save Recipe'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadRecipes} className="btn-primary mt-3">Retry</button>
        </div>
      ) : recipes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-gray-500 dark:text-gray-400">No recipes yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Save your favorite meals to log them quickly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map(recipe => {
            const nutrition = calcNutrition(recipe.ingredients || []);
            const ps = recipe.servings > 0 ? {
              calories: Math.round(nutrition.calories / recipe.servings),
              protein: Math.round(nutrition.protein / recipe.servings * 10) / 10,
              carbs: Math.round(nutrition.carbs / recipe.servings * 10) / 10,
              fat: Math.round(nutrition.fat / recipe.servings * 10) / 10
            } : nutrition;
            return (
              <div key={recipe._id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{recipe.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''} · {(recipe.ingredients || []).length} ingredients</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      <span className="font-semibold text-green-600 dark:text-green-400">{ps.calories} kcal/serving</span>
                      <span className="text-blue-600 dark:text-blue-400">P: {ps.protein}g</span>
                      <span className="text-yellow-600 dark:text-yellow-400">C: {ps.carbs}g</span>
                      <span className="text-red-500 dark:text-red-400">F: {ps.fat}g</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button onClick={() => { setLogModalRecipe(recipe); setLogServings(1); setLogDate(today()); }} className="btn-primary text-xs px-3 py-1.5">Log</button>
                    <button onClick={() => openEdit(recipe)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
                    <button onClick={() => handleDelete(recipe._id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
                  </div>
                </div>
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.map((ing, i) => (
                        <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                          {ing.name} ({ing.servingSize}g)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Log Recipe Modal */}
      {logModalRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Log "{logModalRecipe.name}"</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={logDate} onChange={e => setLogDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Number of Servings</label>
                <input type="number" className="input" min="0.25" step="0.25" value={logServings} onChange={e => setLogServings(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                {(() => {
                  const n = calcNutrition(logModalRecipe.ingredients || []);
                  const scale = logServings / (logModalRecipe.servings || 1);
                  return (
                    <div className="flex flex-wrap gap-3">
                      <span className="font-bold text-green-600 dark:text-green-400">{Math.round(n.calories * scale)} kcal</span>
                      <span className="text-blue-600 dark:text-blue-400">P: {Math.round(n.protein * scale * 10) / 10}g</span>
                      <span className="text-yellow-600 dark:text-yellow-400">C: {Math.round(n.carbs * scale * 10) / 10}g</span>
                      <span className="text-red-500 dark:text-red-400">F: {Math.round(n.fat * scale * 10) / 10}g</span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn-primary flex-1" onClick={handleLogRecipe} disabled={logging}>
                {logging ? 'Logging...' : 'Log to Food Diary'}
              </button>
              <button className="btn-secondary" onClick={() => setLogModalRecipe(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
