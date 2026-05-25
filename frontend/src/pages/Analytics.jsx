import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { getCalorieHistory } from '../api.js';
import { ThemeContext } from '../context/ThemeContext.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

export default function Analytics() {
  const [dark] = useContext(ThemeContext);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCalorieHistory(days);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadData(); }, [loadData]);

  const tickColor = dark ? '#9ca3af' : '#6b7280';
  const gridColor = dark ? '#374151' : '#e5e7eb';

  const chartData = data?.data || [];
  const labels = chartData.map(d => {
    const date = new Date(d.date + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const calorieTarget = data?.calorieTarget || 2000;

  const barChartData = {
    labels,
    datasets: [
      {
        label: 'Calories',
        data: chartData.map(d => d.calories),
        backgroundColor: chartData.map(d =>
          Math.abs(d.calories - calorieTarget) <= 150
            ? 'rgba(34,197,94,0.7)'
            : d.calories > calorieTarget
              ? 'rgba(239,68,68,0.7)'
              : 'rgba(59,130,246,0.7)'
        ),
        borderRadius: 4
      }
    ]
  };

  const macroChartData = {
    labels,
    datasets: [
      { label: 'Protein (g)', data: chartData.map(d => d.protein), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.3, fill: false, pointRadius: 2 },
      { label: 'Carbs (g)', data: chartData.map(d => d.carbs), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.3, fill: false, pointRadius: 2 },
      { label: 'Fat (g)', data: chartData.map(d => d.fat), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.3, fill: false, pointRadius: 2 }
    ]
  };

  const chartOptions = (yLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: tickColor } },
      tooltip: { mode: 'index' }
    },
    scales: {
      x: { ticks: { color: tickColor, maxTicksLimit: 10 }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { color: gridColor }, title: { display: true, text: yLabel, color: tickColor } }
    }
  });

  const barOptions = {
    ...chartOptions('kcal'),
    plugins: {
      ...chartOptions('kcal').plugins,
      annotation: undefined
    },
    scales: {
      ...chartOptions('kcal').scales,
    }
  };

  // Stats
  const avgCalories = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.calories, 0) / chartData.length)
    : 0;
  const daysLogged = chartData.length;
  const daysOnTarget = chartData.filter(d => Math.abs(d.calories - calorieTarget) <= 150).length;
  const bestDay = chartData.reduce((best, d) => (!best || (Math.abs(d.calories - calorieTarget) < Math.abs(best.calories - calorieTarget))) ? d : best, null);
  const worstDay = chartData.reduce((worst, d) => (!worst || (Math.abs(d.calories - calorieTarget) > Math.abs(worst.calories - calorieTarget))) ? d : worst, null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <div className="flex gap-2">
          {[30, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={days === d ? 'btn-primary px-4 py-1.5 text-sm' : 'btn-secondary px-4 py-1.5 text-sm'}
            >
              {d} Days
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
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Avg Calories</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{avgCalories}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">kcal/day</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Days Logged</p>
              <p className="text-xl font-bold text-green-600">{daysLogged}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">of {days}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">On Target</p>
              <p className="text-xl font-bold text-blue-600">{daysOnTarget}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">days ±150 kcal</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Target</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{calorieTarget}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">kcal/day</p>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">📈</p>
              <p className="text-gray-500 dark:text-gray-400">No data for the selected period.</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start logging food to see your calorie history.</p>
            </div>
          ) : (
            <>
              {/* Calorie Bar Chart */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Daily Calories</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Green = on target (±150 kcal), Blue = under, Red = over. Target: {calorieTarget} kcal
                </p>
                <div className="h-64 sm:h-80">
                  <Bar data={barChartData} options={barOptions} />
                </div>
              </div>

              {/* Macro Line Chart */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Macro Trends</h2>
                <div className="h-64 sm:h-80">
                  <Line data={macroChartData} options={chartOptions('grams')} />
                </div>
              </div>

              {/* Best/Worst Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bestDay && (
                  <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Best Day</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(bestDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{bestDay.calories} kcal ({bestDay.calories > calorieTarget ? '+' : ''}{bestDay.calories - calorieTarget} vs target)</p>
                  </div>
                )}
                {worstDay && (
                  <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">Furthest from Target</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(worstDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{worstDay.calories} kcal ({worstDay.calories > calorieTarget ? '+' : ''}{worstDay.calories - calorieTarget} vs target)</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
