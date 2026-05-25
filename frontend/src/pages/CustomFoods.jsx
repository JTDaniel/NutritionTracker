import React, { useState, useEffect, useCallback } from 'react';
import { getCustomFoods, createCustomFood, updateCustomFood, deleteCustomFood } from '../api.js';

const emptyForm = {
  name: '', brandName: '', servingSize: 100, householdServing: '',
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0
};

export default function CustomFoods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomFoods();
      setFoods(data.foods || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFoods(); }, [loadFoods]);

  const handleEdit = (food) => {
    setEditId(food._id);
    setForm({
      name: food.name || '',
      brandName: food.brandName || '',
      servingSize: food.servingSize || 100,
      householdServing: food.householdServing || '',
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      fiber: food.fiber || 0,
      sodium: food.sodium || 0,
      sugar: food.sugar || 0
    });
    setShowForm(true);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) return setFormError('Name is required');
    setSaving(true);
    try {
      if (editId) {
        await updateCustomFood(editId, form);
      } else {
        await createCustomFood({ ...form });
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      await loadFoods();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this custom food?')) return;
    try {
      await deleteCustomFood(id);
      setFoods(foods.filter(f => f._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditId(null);
    setFormError(null);
  };

  const field = (label, key, type = 'number', required = false) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={type}
        className="input"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
        required={required}
        step={type === 'number' ? '0.1' : undefined}
        min={type === 'number' ? '0' : undefined}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Custom Foods</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setFormError(null); }}>
            + Add Custom Food
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editId ? 'Edit Custom Food' : 'Add Custom Food'}
          </h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Food Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Homemade Protein Shake"
                />
              </div>
              <div>
                <label className="label">Brand Name</label>
                <input
                  type="text"
                  className="input"
                  value={form.brandName}
                  onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="label">Household Serving</label>
                <input
                  type="text"
                  className="input"
                  value={form.householdServing}
                  onChange={e => setForm(f => ({ ...f, householdServing: e.target.value }))}
                  placeholder="e.g. 1 cup, 1 bar"
                />
              </div>
              {field('Serving Size (g)', 'servingSize', 'number', true)}
              {field('Calories (kcal)', 'calories')}
              {field('Protein (g)', 'protein')}
              {field('Carbs (g)', 'carbs')}
              {field('Fat (g)', 'fat')}
              {field('Fiber (g)', 'fiber')}
              {field('Sodium (mg)', 'sodium')}
              {field('Sugar (g)', 'sugar')}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update Food' : 'Add Food'}
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
          <button onClick={loadFoods} className="btn-primary mt-3">Retry</button>
        </div>
      ) : foods.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🥘</p>
          <p className="text-gray-500 dark:text-gray-400">No custom foods yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add foods that aren't in the USDA database.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {foods.map(food => (
            <div key={food._id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{food.name}</p>
                {food.brandName && <p className="text-sm text-gray-500 dark:text-gray-400">{food.brandName}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Per {food.servingSize}g{food.householdServing ? ` (${food.householdServing})` : ''}
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-sm">
                  <span className="font-semibold text-green-600 dark:text-green-400">{food.calories} kcal</span>
                  <span className="text-blue-600 dark:text-blue-400">P: {food.protein}g</span>
                  <span className="text-yellow-600 dark:text-yellow-400">C: {food.carbs}g</span>
                  <span className="text-red-500 dark:text-red-400">F: {food.fat}g</span>
                  {food.fiber > 0 && <span className="text-gray-500 dark:text-gray-400">Fiber: {food.fiber}g</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(food)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
                <button onClick={() => handleDelete(food._id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
