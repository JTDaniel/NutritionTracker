import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DailyLog from './pages/DailyLog.jsx';
import FoodSearch from './pages/FoodSearch.jsx';
import ExerciseSearch from './pages/ExerciseSearch.jsx';
import Profile from './pages/Profile.jsx';
import WeightTracker from './pages/WeightTracker.jsx';
import BarcodeScanner from './pages/BarcodeScanner.jsx';
import CustomFoods from './pages/CustomFoods.jsx';
import Recipes from './pages/Recipes.jsx';
import Analytics from './pages/Analytics.jsx';
import WeeklySummary from './pages/WeeklySummary.jsx';
import Measurements from './pages/Measurements.jsx';
import Water from './pages/Water.jsx';
import Fasting from './pages/Fasting.jsx';
import Streaks from './pages/Streaks.jsx';
import Badges from './pages/Badges.jsx';
import Diet from './pages/Diet.jsx';
import Login from './pages/Login.jsx';
import { ThemeContext } from './context/ThemeContext.js';
import { GamificationContext } from './context/GamificationContext.js';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './hooks/useTheme.js';
import { useGamification } from './hooks/useGamification.js';
import GamificationToasts from './components/GamificationToasts.jsx';
import LevelUpModal from './components/LevelUpModal.jsx';
import MilestoneModal from './components/MilestoneModal.jsx';

function AppInner() {
  const auth = useAuth();
  const [dark, setDark] = useTheme();
  const { profile, setProfile, toasts, levelUpData, setLevelUpData, milestoneData, setMilestoneData, refreshProfile, triggerAward } = useGamification(auth.userId);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  if (!auth.isAuthenticated) {
    return (
      <ThemeContext.Provider value={[dark, setDark]}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={[dark, setDark]}>
      <GamificationContext.Provider value={{ profile, refreshProfile, triggerAward }}>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
            <Nav />
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/log" element={<DailyLog />} />
                <Route path="/search/food" element={<FoodSearch />} />
                <Route path="/search/exercise" element={<ExerciseSearch />} />
                <Route path="/search/barcode" element={<BarcodeScanner />} />
                <Route path="/weight" element={<WeightTracker />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/custom-foods" element={<CustomFoods />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/analytics/weekly" element={<WeeklySummary />} />
                <Route path="/measurements" element={<Measurements />} />
                <Route path="/water" element={<Water />} />
                <Route path="/fasting" element={<Fasting />} />
                <Route path="/streaks" element={<Streaks />} />
                <Route path="/badges" element={<Badges />} />
                <Route path="/diet" element={<Diet />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          <GamificationToasts toasts={toasts} />
          <LevelUpModal data={levelUpData} onClose={() => setLevelUpData(null)} />
          <MilestoneModal data={milestoneData} onClose={() => setMilestoneData(null)} />
        </BrowserRouter>
      </GamificationContext.Provider>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
