import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { getFastingSessions, getActiveFasting, startFasting, stopFasting, deleteFastingSession } from '../api.js';
import { GamificationContext } from '../context/GamificationContext.js';

const WINDOWS = [
  { label: '12:12', hours: 12 },
  { label: '14:10', hours: 14 },
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 }
];

const pad = (n) => String(n).padStart(2, '0');

const formatDuration = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const formatHours = (ms) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export default function Fasting() {
  const { triggerAward } = useContext(GamificationContext);
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetHours, setTargetHours] = useState(16);
  const [elapsed, setElapsed] = useState(0);
  const [acting, setActing] = useState(false);
  const timerRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeData, sessionsData] = await Promise.all([
        getActiveFasting(),
        getFastingSessions()
      ]);
      setActiveSession(activeData.session);
      setSessions(sessionsData.sessions || []);
      if (activeData.session) {
        setElapsed(Date.now() - new Date(activeData.session.startTime).getTime());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - new Date(activeSession.startTime).getTime());
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeSession]);

  const handleStart = async () => {
    setActing(true);
    try {
      const data = await startFasting(targetHours);
      setActiveSession(data.session);
      setElapsed(0);
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  };

  const handleStop = async () => {
    setActing(true);
    try {
      const result = await stopFasting();
      if (result?.session?.completed) {
        triggerAward('FASTING_COMPLETE');
      }
      setActiveSession(null);
      setElapsed(0);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fasting session?')) return;
    try {
      await deleteFastingSession(id);
      setSessions(s => s.filter(x => x._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const targetMs = (activeSession?.targetHours || targetHours) * 3600000;
  const pct = activeSession ? Math.min(100, Math.round((elapsed / targetMs) * 100)) : 0;

  // Eating window
  let eatingWindowStr = '';
  if (activeSession) {
    const eatingStart = new Date(new Date(activeSession.startTime).getTime() + targetMs);
    eatingWindowStr = eatingStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  const ringRadius = 60;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - pct / 100);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fasting Timer</h1>

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
          {/* Window Selector */}
          {!activeSession && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Fasting Window</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                {WINDOWS.map(w => (
                  <button
                    key={w.hours}
                    onClick={() => setTargetHours(w.hours)}
                    className={targetHours === w.hours
                      ? 'btn-primary py-2 text-sm'
                      : 'btn-secondary py-2 text-sm'}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="label text-xs">Custom (hours)</label>
                  <input
                    type="number"
                    className="input w-24"
                    min="1"
                    max="24"
                    value={targetHours}
                    onChange={e => setTargetHours(Math.max(1, Math.min(24, parseInt(e.target.value) || 16)))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Timer */}
          <div className="card flex flex-col items-center py-8">
            <div className="relative w-44 h-44 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={ringRadius} fill="none" strokeWidth="10" className="stroke-gray-200 dark:stroke-gray-700" />
                <circle
                  cx="70" cy="70" r={ringRadius}
                  fill="none"
                  stroke={pct >= 100 ? '#22c55e' : '#f59e0b'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-mono text-gray-900 dark:text-white">
                  {activeSession ? formatDuration(elapsed) : '00:00:00'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{pct}% complete</span>
              </div>
            </div>

            {activeSession ? (
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatHours(elapsed)} of {activeSession.targetHours}h fast
                </p>
                {pct < 100 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Eating window opens at <span className="font-semibold text-amber-600 dark:text-amber-400">{eatingWindowStr}</span>
                  </p>
                ) : (
                  <p className="text-green-600 dark:text-green-400 font-semibold">Goal reached! You can break your fast.</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Started: {new Date(activeSession.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <button
                  className="btn-danger mt-2 px-8"
                  onClick={handleStop}
                  disabled={acting}
                >
                  {acting ? 'Stopping...' : 'Stop Fast'}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-gray-500 dark:text-gray-400">
                  Start a <span className="font-semibold text-gray-900 dark:text-white">{targetHours}:{24 - targetHours}</span> fasting window
                </p>
                <button
                  className="btn-primary px-10 py-3 text-lg"
                  onClick={handleStart}
                  disabled={acting}
                >
                  {acting ? 'Starting...' : 'Start Fast'}
                </button>
              </div>
            )}
          </div>

          {/* History */}
          {sessions.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Fasts</h2>
              <div className="space-y-2">
                {sessions.slice(0, 10).map(s => {
                  const duration = s.endTime
                    ? s.endTime - new Date(s.startTime).getTime()
                    : null;
                  const durationMs = s.endTime
                    ? new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
                    : null;
                  return (
                    <div key={s._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.completed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : s.endTime ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                            {!s.endTime ? 'Active' : s.completed ? 'Completed' : 'Ended Early'}
                          </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Target: {s.targetHours}h
                          {durationMs != null ? ` · Duration: ${formatHours(durationMs)}` : ''}
                        </span>
                      </div>
                      {s.endTime && (
                        <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-600 text-xs ml-3">Delete</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
