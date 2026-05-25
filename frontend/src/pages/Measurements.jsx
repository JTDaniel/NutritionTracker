import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, LineElement,
  PointElement, Title, Tooltip, Legend
} from 'chart.js';
import { getMeasurements, saveMeasurement, deleteMeasurement } from '../api.js';
import { ThemeContext } from '../context/ThemeContext.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const today = () => new Date().toISOString().split('T')[0];

const SITES = [
  { key: 'waistCm', label: 'Waist (cm)' },
  { key: 'hipsCm', label: 'Hips (cm)' },
  { key: 'chestCm', label: 'Chest (cm)' },
  { key: 'neckCm', label: 'Neck (cm)' },
  { key: 'armsLeftCm', label: 'Left Arm (cm)' },
  { key: 'armsRightCm', label: 'Right Arm (cm)' },
  { key: 'thighsLeftCm', label: 'Left Thigh (cm)' },
  { key: 'thighsRightCm', label: 'Right Thigh (cm)' }
];

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Measurements() {
  const [dark] = useContext(ThemeContext);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today() });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMeasurements();
      setMeasurements(data.measurements || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await saveMeasurement({ ...form });
      setShowForm(false);
      setForm({ date: today() });
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this measurement?')) return;
    try {
      await deleteMeasurement(id);
      setMeasurements(m => m.filter(x => x._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const tickColor = dark ? '#9ca3af' : '#6b7280';
  const gridColor = dark ? '#374151' : '#e5e7eb';

  const sortedAsc = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  const chartLabels = sortedAsc.map(m => {
    const d = new Date(m.date + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartDatasets = SITES.filter(site => sortedAsc.some(m => m[site.key] != null)).map((site, i) => ({
    label: site.label,
    data: sortedAsc.map(m => m[site.key] || null),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length] + '20',
    tension: 0.3,
    pointRadius: 3,
    spanGaps: true
  }));

  const chartData = { labels: chartLabels, datasets: chartDatasets };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: tickColor } } },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { color: gridColor }, title: { display: true, text: 'cm', color: tickColor } }
    }
  };

  const recent = measurements.slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Body Measurements</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Log Measurements</button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Log Measurements</h2>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SITES.map(site => (
                <div key={site.key}>
                  <label className="label">{site.label}</label>
                  <input
                    type="number"
                    className="input"
                    step="0.1"
                    min="0"
                    placeholder="Optional"
                    value={form[site.key] || ''}
                    onChange={e => setForm(f => ({ ...f, [site.key]: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Measurements'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError(null); setForm({ date: today() }); }}>Cancel</button>
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
          <button onClick={loadData} className="btn-primary mt-3">Retry</button>
        </div>
      ) : measurements.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📏</p>
          <p className="text-gray-500 dark:text-gray-400">No measurements logged yet.</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          {chartDatasets.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Measurement Trends</h2>
              <div className="h-64 sm:h-80">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* History Table */}
          <div className="card overflow-x-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Measurements</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3 text-right">Waist</th>
                  <th className="pb-2 pr-3 text-right">Hips</th>
                  <th className="pb-2 pr-3 text-right">Chest</th>
                  <th className="pb-2 pr-3 text-right">Neck</th>
                  <th className="pb-2 pr-3 text-right">L Arm</th>
                  <th className="pb-2 pr-3 text-right">R Arm</th>
                  <th className="pb-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recent.map(m => (
                  <tr key={m._id} className="text-gray-700 dark:text-gray-200">
                    <td className="py-2 pr-3 font-medium whitespace-nowrap">
                      {new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    {['waistCm', 'hipsCm', 'chestCm', 'neckCm', 'armsLeftCm', 'armsRightCm'].map(key => (
                      <td key={key} className="py-2 pr-3 text-right">{m[key] != null ? `${m[key]}` : '—'}</td>
                    ))}
                    <td className="py-2 text-right">
                      <button onClick={() => handleDelete(m._id)} className="text-red-500 hover:text-red-600 text-xs">Delete</button>
                    </td>
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
