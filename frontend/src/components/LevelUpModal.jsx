import React from 'react';

export default function LevelUpModal({ data, onClose }) {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-8 text-center shadow-2xl border border-yellow-500 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-yellow-400 mb-1">Level Up!</h2>
        <p className="text-4xl font-bold text-white mb-2">Level {data.level}</p>
        <p className="text-yellow-300 text-lg font-medium mb-6">{data.title}</p>
        <button onClick={onClose} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-8 rounded-xl transition-colors">
          Awesome!
        </button>
      </div>
    </div>
  );
}
