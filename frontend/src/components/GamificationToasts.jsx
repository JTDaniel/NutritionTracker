import React from 'react';

export default function GamificationToasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white rounded-xl px-4 py-3 shadow-2xl border border-gray-700 animate-slide-in min-w-[200px] max-w-xs"
        >
          <span className="text-xl flex-shrink-0">
            {toast.type === 'xp' ? '⚡' : toast.type === 'badge' ? (toast.icon || '🏅') : '🎯'}
          </span>
          <div>
            <p className="font-bold text-sm text-green-400">{toast.message}</p>
            {toast.sub && <p className="text-xs text-gray-300 capitalize">{toast.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
