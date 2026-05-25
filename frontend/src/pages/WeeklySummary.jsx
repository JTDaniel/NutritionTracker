import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { getWeeklySummary } from '../api.js';
import { ThemeContext } from '../context/ThemeContext.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function WeeklySummary() {
  const [dark] = useContext(ThemeContext);
  const [weeks, setWeeks] = useState(8);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWeeklySummary(weeks);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => { loadData(); }, [loadData]);

  const tickColor = dark ? '#9ca3af' : '#6b7280';
  const gridColor = dark ? '#374151' : '#e5e7eb';

  const weeklyData = data?.weeklyData || [];
  const calorieTarget = data?.calorieTarget || 2000;

  const labels = weeklyData.map(w => {
    const d = new Date(w.weekStart + 'T12:00:00');
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  });

  const barData = {
    labels,
    datasets: [
      {
        label: 'Avg Calories',
        data: weeklyData.map(w => w.avgCalories),
        backgroundColor: weeklyData.map(w =>
          Math.abs(w.avgCalories - calorieTarget) <= 150
            ? 'rgba(34,197,94,0.7)'
            : w.avgCalories > calorieTarget
              ? 'rgba(239,68,68,0.7)'
              : 'rgba(59,130,246,0.7)'
        ),
        borderRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: tickColor } },
      tooltip: { mode: 'index' }
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: {
        ticks: { color: tickColor }, grid: { color: gridColor },
        title: { display: true, text: 'kcal', color: tickColor }
      }
    }
  };

  const bestWeek = weeklyData.reduce((best, w) => (!best || w.avgCalories > best.avgCalories) ? w : best, null);
  const mostConsistent = weeklyData.reduce((best, w) => (!best || w.daysOnTarget > best.daysOnTarget) ? w : best, null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Summary</h1>
        <div className="flex gap-2">
          {[4, 8, 12].map(w => (
            <button
              key={w}
              onClick={() => setWeeks(w)}
              className={weeks === w ? 'btn-primary px-4 py-1.5 text-sm' : 'btn-secondary px-4 py-1.5 text-sm'}
            >
              {w} Weeks
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadData} className="btn-primary mt-3">Retry</button>
        </div>
      ) : weeklyData.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 dark:text-gray-400">No weekly data yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start logging food to see weekly summaries.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bestWeek && (
              <div className="card">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Highest Avg Calories Week</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Week of {new Date(bestWeek.weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">{bestWeek.avgCalories} kcal avg · {bestWeek.daysLogged} days</p>
              </div>
            )}
            {mostConsistent && (
              <div className="card">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Most Consistent Week</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Week of {new Date(mostConsistent.weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{mostConsistent.daysOnTarget} days on target · {mostConsistent.daysLogged} days logged</p>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Avg Daily Calories by Week</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Target: {calorieTarget} kcal</p>
            <div className="h-64 sm:h-80">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-x-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Breakdown</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4">Week Of</th>
                  <th className="pb-2 pr-4 text-right">Avg Cal</th>
                  <th className="pb-2 pr-4 text-right">Days Logged</th>
                  <th className="pb-2 pr-4 text-right">On Target</th>
                  <th className="pb-2 text-right">Avg Protein</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {[...weeklyData].reverse().map((w, i) => (
                  <tr key={i} className="text-gray-700 dark:text-gray-200">
                    <td className="py-2 pr-4">
                      {new Date(w.weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className={`py-2 pr-4 text-right font-semibold ${Math.abs(w.avgCalories - calorieTarget) <= 150 ? 'text-green-600 dark:text-green-400' : w.avgCalories > calorieTarget ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {w.avgCalories}
                    </td>
                    <td className="py-2 pr-4 text-right">{w.daysLogged}</td>
                    <td className="py-2 pr-4 text-right">{w.daysOnTarget}</td>
                    <td className="py-2 text-right">{w.avgProtein}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
