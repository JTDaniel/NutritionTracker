import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getWeightLog, logWeight, deleteWeightEntry, getUser } from '../api.js';
import { ThemeContext } from '../context/ThemeContext.js';
import { GamificationContext } from '../context/GamificationContext.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const kgToLbs = (kg) => +(kg * 2.20462).toFixed(1);
const lbsToKg = (lbs) => +(lbs / 2.20462).toFixed(2);
const today = () => new Date().toISOString().split('T')[0];

// Simple moving average over the last N entries (not N days)
const movingAverage = (entries, window) => {
  return entries.map((e, i) => {
    const slice = entries.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, x) => s + x.weightKg, 0) / slice.length;
    return { date: e.date, value: +avg.toFixed(2) };
  });
};

// Linear regression: returns { slope (kg/day), intercept, predict(dayIndex) }
const linearRegression = (entries) => {
  if (entries.length < 2) return null;
  const base = new Date(entries[0].date).getTime();
  const points = entries.map(e => ({
    x: (new Date(e.date).getTime() - base) / 86400000,
    y: e.weightKg
  }));
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return {
    slope,
    predict: (dayIndex) => intercept + slope * dayIndex,
    baseMs: base
  };
};

// Project date when trend line hits goalKg
const projectGoalDate = (reg, goalKg, entries) => {
  if (!reg || !goalKg) return null;
  const lastDayIndex = (new Date(entries[entries.length - 1].date).getTime() - reg.baseMs) / 86400000;
  const currentProjected = reg.predict(lastDayIndex);
  if (reg.slope === 0) return null;
  const daysToGoal = (goalKg - currentProjected) / reg.slope;
  if (daysToGoal < 0 || daysToGoal > 3650) return null;
  const goalDate = new Date(reg.baseMs + (lastDayIndex + daysToGoal) * 86400000);
  return goalDate;
};

export default function WeightTracker() {
  const [dark] = useContext(ThemeContext);
  const { triggerAward } = useContext(GamificationContext);
  const [entries, setEntries] = useState([]);
  const [user, setUser] = useState(null);
  const [imperial, setImperial] = useState(true);
  const [maWindow, setMaWindow] = useState(7);
  const [inputWeight, setInputWeight] = useState('');
  const [inputDate, setInputDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wData, uData] = await Promise.all([getWeightLog(), getUser()]);
      setEntries(wData.entries || []);
      setUser(uData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLog = async (e) => {
    e.preventDefault();
    if (!inputWeight) return;
    setSaving(true);
    try {
      const kg = imperial ? lbsToKg(parseFloat(inputWeight)) : parseFloat(inputWeight);
      await logWeight(inputDate, kg);
      triggerAward('WEIGH_IN');
      setInputWeight('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteWeightEntry(id);
    await load();
  };

  const display = (kg) => imperial ? kgToLbs(kg) : +kg.toFixed(1);
  const unit = imperial ? 'lbs' : 'kg';

  const goalKg = user?.goalWeightKg ?? null;
  const goalDisplay = goalKg ? display(goalKg) : null;

  const ma = movingAverage(entries, maWindow);
  const reg = linearRegression(entries);
  const projectedDate = projectGoalDate(reg, goalKg, entries);

  // Build trend line across the data range + 30-day projection
  const trendPoints = (() => {
    if (!reg || entries.length < 2) return [];
    const base = reg.baseMs;
    const lastMs = new Date(entries[entries.length - 1].date).getTime();
    const projMs = lastMs + 30 * 86400000;
    const result = [];
    for (let ms = new Date(entries[0].date).getTime(); ms <= projMs; ms += 86400000) {
      const dayIdx = (ms - base) / 86400000;
      result.push({ date: new Date(ms).toISOString().split('T')[0], value: reg.predict(dayIdx) });
    }
    return result;
  })();

  // Collect all dates for the x-axis (data + trend projection)
  const allDates = Array.from(new Set([
    ...entries.map(e => e.date),
    ...trendPoints.map(p => p.date)
  ])).sort();

  const toMap = (arr, key = 'date', val = 'value') =>
    Object.fromEntries(arr.map(a => [a[key], a[val]]));

  const rawMap = toMap(entries, 'date', 'weightKg');
  const maMap = toMap(ma);
  const trendMap = toMap(trendPoints);

  const chartData = {
    labels: allDates,
    datasets: [
      {
        label: `Weight (${unit})`,
        data: allDates.map(d => rawMap[d] != null ? display(rawMap[d]) : null),
        borderColor: 'rgba(16,185,129,0.6)',
        backgroundColor: 'rgba(16,185,129,0.8)',
        pointRadius: 4,
        pointHoverRadius: 6,
        showLine: false,
        spanGaps: false,
        order: 3
      },
      {
        label: `${maWindow}-day Average`,
        data: allDates.map(d => maMap[d] != null ? display(maMap[d]) : null),
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.3,
        spanGaps: false,
        order: 2
      },
      {
        label: 'Trend & Projection',
        data: allDates.map(d => trendMap[d] != null ? display(trendMap[d]) : null),
        borderColor: 'rgba(245,158,11,0.8)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
        spanGaps: true,
        order: 1
      },
      ...(goalKg ? [{
        label: `Goal (${goalDisplay} ${unit})`,
        data: allDates.map(() => goalDisplay),
        borderColor: 'rgba(239,68,68,0.7)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        spanGaps: true,
        order: 0
      }] : [])
    ]
  };

  const tickColor = dark ? '#9ca3af' : '#6b7280';
  const titleColor = dark ? '#d1d5db' : '#374151';
  const gridColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tooltipBg = dark ? '#1f2937' : 'rgba(0,0,0,0.8)';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, padding: 16, font: { size: 12 }, color: titleColor }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (v == null) return null;
            return `${ctx.dataset.label}: ${v} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 10,
          maxRotation: 0,
          color: tickColor,
          callback: (_, i) => {
            const d = allDates[i];
            if (!d) return '';
            return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        },
        grid: { color: gridColor }
      },
      y: {
        ticks: { color: tickColor },
        title: { display: true, text: unit, font: { size: 11 }, color: titleColor },
        grid: { color: gridColor }
      }
    }
  };

  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weightKg : null;
  const weeklyRate = reg ? +(reg.slope * 7 * 2.20462).toFixed(2) : null;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="inline-block w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weight Tracker</h1>
        <button
          onClick={() => setImperial(v => !v)}
          className="btn-secondary text-sm"
        >
          {imperial ? 'Switch to kg' : 'Switch to lbs'}
        </button>
      </div>

      {/* Stats row */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{display(currentWeight)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{unit}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Goal</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{goalDisplay ?? '—'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{goalDisplay ? unit : 'not set'}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Weekly Trend</p>
            <p className={`text-xl sm:text-2xl font-bold ${weeklyRate > 0 ? 'text-blue-600' : weeklyRate < 0 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {weeklyRate != null ? `${weeklyRate > 0 ? '+' : ''}${weeklyRate}` : '—'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{weeklyRate != null ? `lbs/week` : 'need more data'}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Goal Date</p>
            <p className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
              {projectedDate
                ? projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{projectedDate ? 'projected' : goalKg ? 'need more data' : 'no goal set'}</p>
          </div>
        </div>
      )}

      {/* Log form */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Log Weight</h2>
        <form onSubmit={handleLog} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Date</label>
            <input type="date" value={inputDate} onChange={e => setInputDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Weight ({unit})</label>
            <input
              type="number"
              step="0.1"
              min="50"
              max={imperial ? "700" : "320"}
              value={inputWeight}
              onChange={e => setInputWeight(e.target.value)}
              placeholder={imperial ? '175.0' : '79.4'}
              className="input w-32"
            />
          </div>
          <button type="submit" disabled={saving || !inputWeight} className="btn-primary">
            {saving ? 'Saving…' : 'Log Weight'}
          </button>
        </form>
        {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Chart */}
      {entries.length >= 2 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Trend Chart</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">Moving avg window:</label>
              <select
                value={maWindow}
                onChange={e => setMaWindow(Number(e.target.value))}
                className="input py-1 w-20 text-sm"
              >
                {[3, 5, 7, 10, 14].map(n => (
                  <option key={n} value={n}>{n} days</option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-56 sm:h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
          {projectedDate && goalKg && (
            <p className="text-sm text-center text-purple-700 dark:text-purple-400 mt-3 font-medium">
              At your current rate ({weeklyRate > 0 ? '+' : ''}{weeklyRate} lbs/week), you'll reach your goal of {goalDisplay} {unit} around{' '}
              <strong>{projectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
            </p>
          )}
        </div>
      ) : entries.length === 1 ? (
        <div className="card text-center py-6 text-gray-400 dark:text-gray-500">
          <p>Log at least 2 weigh-ins to see your trend chart.</p>
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">⚖️</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No weight entries yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Log your first weigh-in above to get started.</p>
        </div>
      )}

      {/* History table */}
      {entries.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[280px]">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Change</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((e, i, arr) => {
                  const prev = arr[i + 1];
                  const diff = prev ? display(e.weightKg) - display(prev.weightKg) : null;
                  return (
                    <tr key={e._id} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <td className="py-2 text-gray-600 dark:text-gray-300">
                        {new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-2 font-semibold text-gray-900 dark:text-white">{display(e.weightKg)} {unit}</td>
                      <td className="py-2">
                        {diff != null && (
                          <span className={diff > 0 ? 'text-blue-600 dark:text-blue-400' : diff < 0 ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleDelete(e._id)}
                          className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors"
                          title="Delete entry"
                        >✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
