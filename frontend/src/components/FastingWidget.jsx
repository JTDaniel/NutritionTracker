import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getActiveFasting, startFasting, stopFasting } from '../api.js';

const pad = (n) => String(n).padStart(2, '0');
const formatDuration = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export default function FastingWidget() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [acting, setActing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getActiveFasting()
      .then(data => {
        setSession(data.session);
        if (data.session) setElapsed(Date.now() - new Date(data.session.startTime).getTime());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - new Date(session.startTime).getTime());
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [session]);

  const handleStart = async () => {
    setActing(true);
    try {
      const data = await startFasting(16);
      setSession(data.session);
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
      await stopFasting();
      setSession(null);
      setElapsed(0);
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  };

  const pct = session ? Math.min(100, Math.round((elapsed / ((session.targetHours || 16) * 3600000)) * 100)) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fasting</h2>
        <Link to="/fasting" className="text-sm text-amber-600 hover:text-amber-700 font-medium">Details →</Link>
      </div>
      {loading ? (
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      ) : session ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-mono font-bold text-gray-900 dark:text-white">{formatDuration(elapsed)}</span>
                <span className="text-gray-400 dark:text-gray-500">{session.targetHours}h goal · {pct}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${pct >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
          <button onClick={handleStop} disabled={acting} className="btn-danger w-full text-sm py-1.5">
            {acting ? 'Stopping...' : 'Stop Fast'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-gray-400 dark:text-gray-500 text-sm flex-1">No active fast</span>
          <button onClick={handleStart} disabled={acting} className="btn-secondary text-xs px-4 py-2">
            {acting ? '...' : 'Start 16:8'}
          </button>
        </div>
      )}
    </div>
  );
}
