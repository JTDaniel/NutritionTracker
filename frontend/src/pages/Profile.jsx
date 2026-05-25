import React, { useState, useEffect } from 'react';
import { getUser, updateUser } from '../api.js';
import { DIETS } from '../utils/dietUtils.js';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise', multiplier: 1.2 },
  { value: 'lightly_active', label: 'Lightly Active', description: '1-3 days/week', multiplier: 1.375 },
  { value: 'moderately_active', label: 'Moderately Active', description: '3-5 days/week', multiplier: 1.55 },
  { value: 'very_active', label: 'Very Active', description: '6-7 days/week', multiplier: 1.725 },
  { value: 'extremely_active', label: 'Extremely Active', description: 'Hard exercise + physical job', multiplier: 1.9 }
];

// Convert between measurement systems
const cmToFtIn = (cm) => {
  const totalInches = cm / 2.54;
  return { ft: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
};
const ftInToCm = (ft, inches) => Math.round((parseInt(ft || 0) * 12 + parseInt(inches || 0)) * 2.54);
const kgToLbs = (kg) => Math.round(kg * 2.20462 * 10) / 10;
const lbsToKg = (lbs) => Math.round(lbs / 2.20462 * 100) / 100;

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [useImperial, setUseImperial] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: '',
    age: 30,
    gender: 'male',
    heightCm: 170,
    weightKg: 70,
    activityLevel: 'moderately_active',
    goalWeightKg: null,
    weeklyWeightGoalLbs: -1.0,
    dietType: 'none'
  });

  // Imperial form state
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(7);
  const [weightLbs, setWeightLbs] = useState(154);
  const [goalWeightLbs, setGoalWeightLbs] = useState('');

  const BACKUP_KEY = 'nt-profile-backup';

  const applyProfile = (data) => {
    const f = {
      name: data.name || '',
      age: data.age || 30,
      gender: data.gender || 'male',
      heightCm: data.heightCm || 170,
      weightKg: data.weightKg || 70,
      activityLevel: data.activityLevel || 'moderately_active',
      goalWeightKg: data.goalWeightKg ?? null,
      weeklyWeightGoalLbs: data.weeklyWeightGoalLbs ?? -1.0,
      dietType: data.dietType || 'none'
    };
    setForm(f);
    const { ft, inches } = cmToFtIn(f.heightCm);
    setHeightFt(ft);
    setHeightIn(inches);
    setWeightLbs(kgToLbs(f.weightKg));
    if (f.goalWeightKg) setGoalWeightLbs(kgToLbs(f.goalWeightKg));
    return f;
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        let data = await getUser();
        // createdAt is only present when the document actually exists in MongoDB
        if (!data.createdAt) {
          const backup = localStorage.getItem(BACKUP_KEY);
          if (backup) {
            try {
              const backupData = JSON.parse(backup);
              // Silently restore backup to MongoDB
              data = await updateUser(backupData);
            } catch (_) {}
          }
        }
        setUser(data);
        applyProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleHeightImperialChange = (ft, inches) => {
    const cm = ftInToCm(ft, inches);
    setHeightFt(ft);
    setHeightIn(inches);
    setForm(prev => ({ ...prev, heightCm: cm }));
  };

  const handleWeightImperialChange = (lbs) => {
    setWeightLbs(lbs);
    setForm(prev => ({ ...prev, weightKg: lbsToKg(lbs) }));
  };

  const handleGoalWeightChange = (val) => {
    if (useImperial) {
      setGoalWeightLbs(val);
      setForm(prev => ({ ...prev, goalWeightKg: val ? lbsToKg(parseFloat(val)) : null }));
    } else {
      setForm(prev => ({ ...prev, goalWeightKg: val ? parseFloat(val) : null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateUser(form);
      setUser(updated);
      localStorage.setItem(BACKUP_KEY, JSON.stringify(form));
      localStorage.setItem('nt-diet', form.dietType);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tdee = user?.tdee;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile & TDEE</h1>
        <button
          onClick={() => setUseImperial(!useImperial)}
          className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors"
        >
          {useImperial ? '🇺🇸 Imperial' : '🌍 Metric'}
        </button>
      </div>

      {/* TDEE Results */}
      {tdee && (
        <div className="card bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Your TDEE Results</h2>
            {tdee.recommendedCalories && (
              <div className="bg-white bg-opacity-25 rounded-lg px-3 py-1.5 text-center">
                <p className="text-green-100 text-xs">Your Target</p>
                <p className="text-xl font-bold">{tdee.recommendedCalories} kcal</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <p className="text-green-100 text-xs uppercase tracking-wide mb-1">BMR</p>
              <p className="text-2xl font-bold">{tdee.bmr}</p>
              <p className="text-green-200 text-xs">kcal/day</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <p className="text-green-100 text-xs uppercase tracking-wide mb-1">TDEE</p>
              <p className="text-2xl font-bold">{tdee.tdee}</p>
              <p className="text-green-200 text-xs">maintain</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center col-span-2">
              <p className="text-green-100 text-xs uppercase tracking-wide mb-2">Loss / Gain Targets</p>
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-green-200">−1.5 lb/week</span>
                  <span className="font-bold">{tdee.targets.lose_one_half_lb}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-200">−1 lb/week</span>
                  <span className="font-bold">{tdee.targets.lose_one_lb}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-200">−0.5 lb/week</span>
                  <span className="font-bold">{tdee.targets.lose_half_lb}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-white border-opacity-20 pt-1 mt-1">
                  <span className="text-green-200">+0.5 lb/week</span>
                  <span className="font-bold">{tdee.targets.gain_half_lb}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-200">+1 lb/week</span>
                  <span className="font-bold">{tdee.targets.gain_one_lb}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-200">+1.5 lb/week</span>
                  <span className="font-bold">{tdee.targets.gain_one_half_lb}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-green-200 text-xs mt-3">
            Activity: {ACTIVITY_LEVELS.find(a => a.value === form.activityLevel)?.label} (×{ACTIVITY_LEVELS.find(a => a.value === form.activityLevel)?.multiplier})
          </p>
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>

        {/* Name */}
        <div>
          <label className="label">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Your name"
            className="input"
          />
        </div>

        {/* Age & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Age</label>
            <input
              type="number"
              min="10"
              max="120"
              value={form.age}
              onChange={(e) => handleFieldChange('age', parseInt(e.target.value) || 30)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              className="input"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Height */}
        <div>
          <label className="label">Height</label>
          {useImperial ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={heightFt}
                  onChange={(e) => handleHeightImperialChange(e.target.value, heightIn)}
                  className="input pr-8"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">ft</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={heightIn}
                  onChange={(e) => handleHeightImperialChange(heightFt, e.target.value)}
                  className="input pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">in</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                min="100"
                max="250"
                value={form.heightCm}
                onChange={(e) => handleFieldChange('heightCm', parseFloat(e.target.value) || 170)}
                className="input pr-10"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">cm</span>
            </div>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {useImperial ? `= ${form.heightCm} cm` : `= ${cmToFtIn(form.heightCm).ft}ft ${cmToFtIn(form.heightCm).inches}in`}
          </p>
        </div>

        {/* Weight */}
        <div>
          <label className="label">Weight</label>
          {useImperial ? (
            <div className="relative">
              <input
                type="number"
                min="50"
                max="600"
                step="0.1"
                value={weightLbs}
                onChange={(e) => handleWeightImperialChange(e.target.value)}
                className="input pr-10"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">lbs</span>
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={form.weightKg}
                onChange={(e) => handleFieldChange('weightKg', parseFloat(e.target.value) || 70)}
                className="input pr-10"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">kg</span>
            </div>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {useImperial ? `= ${form.weightKg} kg` : `= ${kgToLbs(form.weightKg)} lbs`}
          </p>
        </div>

        {/* Activity Level */}
        <div>
          <label className="label">Activity Level</label>
          <div className="space-y-2 mt-1">
            {ACTIVITY_LEVELS.map(level => (
              <label
                key={level.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.activityLevel === level.value
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700/50'
                }`}
              >
                <input
                  type="radio"
                  name="activityLevel"
                  value={level.value}
                  checked={form.activityLevel === level.value}
                  onChange={(e) => handleFieldChange('activityLevel', e.target.value)}
                  className="mt-0.5 accent-green-600"
                />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{level.label}
                    <span className="text-gray-400 dark:text-gray-500 font-normal"> (×{level.multiplier})</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{level.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Diet Type */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Diet Type</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Sets compliance indicators on food search and diet-specific daily metrics.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DIETS.map(diet => (
              <label
                key={diet.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.dietType === diet.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700/50'
                }`}
              >
                <input
                  type="radio"
                  name="dietType"
                  value={diet.id}
                  checked={form.dietType === diet.id}
                  onChange={(e) => handleFieldChange('dietType', e.target.value)}
                  className="mt-0.5 accent-green-600 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {diet.icon} {diet.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5 line-clamp-2">{diet.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Weight Goal */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Weight Goal</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Goal Weight ({useImperial ? 'lbs' : 'kg'}) — optional</label>
              {useImperial ? (
                <input
                  type="number" step="0.1" min="50" max="700"
                  value={goalWeightLbs}
                  onChange={(e) => handleGoalWeightChange(e.target.value)}
                  placeholder="e.g. 160"
                  className="input"
                />
              ) : (
                <input
                  type="number" step="0.1" min="20" max="320"
                  value={form.goalWeightKg ?? ''}
                  onChange={(e) => handleGoalWeightChange(e.target.value)}
                  placeholder="e.g. 72.5"
                  className="input"
                />
              )}
            </div>

            <div>
              <label className="label">Weekly Goal</label>
              <select
                value={form.weeklyWeightGoalLbs}
                onChange={(e) => handleFieldChange('weeklyWeightGoalLbs', parseFloat(e.target.value))}
                className="input"
              >
                <option value={-1.5}>Lose 1.5 lbs/week (aggressive)</option>
                <option value={-1.0}>Lose 1 lb/week (recommended)</option>
                <option value={-0.5}>Lose 0.5 lbs/week (gentle)</option>
                <option value={0}>Maintain weight</option>
                <option value={0.5}>Gain 0.5 lbs/week (lean bulk)</option>
                <option value={1.0}>Gain 1 lb/week</option>
                <option value={1.5}>Gain 1.5 lbs/week (bulk)</option>
              </select>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Daily target: <strong>{tdee ? Math.max(1200, tdee.tdee + Math.round(form.weeklyWeightGoalLbs * 500)) : '—'} kcal</strong>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
            <span>✓</span> Profile saved successfully! TDEE updated above.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3 text-base"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save Profile & Calculate TDEE'}
        </button>
      </form>

      {/* BMR formula explanation */}
      <div className="card bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">How it's calculated</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Mifflin-St Jeor BMR:</strong></p>
          <p className="font-mono bg-white dark:bg-gray-800 rounded px-2 py-1">
            {form.gender === 'male'
              ? 'BMR = 10×kg + 6.25×cm − 5×age + 5'
              : 'BMR = 10×kg + 6.25×cm − 5×age − 161'}
          </p>
          <p className="mt-2"><strong>TDEE</strong> = BMR × Activity Multiplier</p>
          <p><strong>Weight loss</strong>: −3500 kcal = −1 lb (−500 kcal/day for 1 lb/week)</p>
        </div>
      </div>
    </div>
  );
}
