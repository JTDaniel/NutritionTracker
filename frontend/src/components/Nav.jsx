import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext.js';
import { GamificationContext } from '../context/GamificationContext.js';
import { useAuth } from '../context/AuthContext';

const mainNav = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/log', label: 'Daily Log', icon: '📋' },
  { path: '/search/food', label: 'Food', icon: '🥗' },
  { path: '/search/exercise', label: 'Exercise', icon: '🏃' },
  { path: '/search/barcode', label: 'Scanner', icon: '📷' },
  { path: '/weight', label: 'Weight', icon: '⚖️' },
  { path: '/water', label: 'Water', icon: '💧' },
  { path: '/fasting', label: 'Fasting', icon: '⏱️' }
];

const moreNav = [
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/analytics/weekly', label: 'Weekly Summary', icon: '📅' },
  { path: '/streaks', label: 'Streaks', icon: '🔥' },
  { path: '/badges', label: 'Badges', icon: '🏅' },
  { path: '/measurements', label: 'Body Measurements', icon: '📏' },
  { path: '/custom-foods', label: 'My Foods', icon: '🥘' },
  { path: '/recipes', label: 'Recipes', icon: '📖' },
  { path: '/diet', label: 'Diet', icon: '🥗' },
  { path: '/profile', label: 'Profile', icon: '👤' }
];

const allMobileNav = [
  { section: 'Main', items: mainNav },
  { section: 'More', items: moreNav }
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [dark, setDark] = useContext(ThemeContext);
  const { profile } = useContext(GamificationContext);
  const { logout } = useAuth();
  const moreRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
      isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-green-400 text-2xl">🥦</span>
            <span className="font-bold text-xl tracking-tight hidden sm:block">
              Nutrition<span className="text-green-400">Tracker</span>
            </span>
            {profile && (
              <span className="text-xs bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                Lv.{profile.level}
              </span>
            )}
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center flex-wrap">
            {mainNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                title={item.label}
                className={navLinkClass}
              >
                <span>{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(o => !o)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${moreOpen ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                <span>⋯</span>
                <span className="hidden lg:inline">More</span>
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-1">
                  {moreNav.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                      }
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                  <div className="border-t border-gray-700 mt-1 pt-1">
                    <button
                      onClick={() => { setMoreOpen(false); logout(); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors"
                    >
                      <span>🚪</span>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-1">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-300 hover:bg-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="md:hidden pb-3">
            {allMobileNav.map(section => (
              <div key={section.section} className="mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider px-3 py-1.5 mt-2">{section.section}</p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                      }
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t border-gray-700 mt-2 pt-2">
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors duration-200"
              >
                <span>🚪</span>
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
