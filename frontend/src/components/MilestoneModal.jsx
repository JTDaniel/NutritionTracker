import React from 'react';

export default function MilestoneModal({ data, onClose }) {
  if (!data) return null;
  const MESSAGES = {
    5: ['Down 5 lbs!', '🎯', 'Great start — you\'re building real momentum!'],
    10: ['Down 10 lbs!', '🌟', 'Double digits! Your hard work is showing.'],
    25: ['Down 25 lbs!', '🏆', 'Incredible achievement. You\'ve changed your life!']
  };
  const [title, emoji, msg] = MESSAGES[data.lbs] || [`Down ${data.lbs} lbs!`, '📉', 'Amazing progress!'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-8 text-center shadow-2xl border border-green-500 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-green-400 mb-2">{title}</h2>
        <p className="text-gray-300 mb-6">{msg}</p>
        <button onClick={onClose} className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-8 rounded-xl transition-colors">
          Keep Going!
        </button>
      </div>
    </div>
  );
}
