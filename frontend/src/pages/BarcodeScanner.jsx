import React, { useState, useEffect, useRef } from 'react';
import { lookupBarcode, addFoodLog } from '../api.js';

const today = () => new Date().toISOString().split('T')[0];

export default function BarcodeScanner() {
  const [manualBarcode, setManualBarcode] = useState('');
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [servingGrams, setServingGrams] = useState(100);
  const [logDate, setLogDate] = useState(today());
  const [logging, setLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  const handleLookup = async (barcode) => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    setFood(null);
    setLogSuccess(false);
    try {
      const data = await lookupBarcode(barcode.trim());
      setFood(data.food);
      setServingGrams(data.food.servingSize || 100);
    } catch (err) {
      setError(err.message === 'Product not found' ? 'Product not found in Open Food Facts database.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrcodeRef.current = new Html5Qrcode('qr-reader');
      await html5QrcodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          stopScanner();
          setManualBarcode(decodedText);
          handleLookup(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setCameraError('Camera access denied or not available. Use manual entry below.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (_) {}
      html5QrcodeRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleLogFood = async () => {
    if (!food) return;
    setLogging(true);
    try {
      await addFoodLog(logDate, {
        fdcId: food.fdcId || '',
        name: food.name,
        brandName: food.brandName || '',
        servingSize: servingGrams,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        fiber: food.fiber || 0,
        sodium: food.sodium || 0,
        sugar: food.sugar || 0
      });
      setLogSuccess(true);
    } catch (err) {
      alert('Failed to log food: ' + err.message);
    } finally {
      setLogging(false);
    }
  };

  const multiplier = servingGrams / (food?.servingSize || 100);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Barcode Scanner</h1>

      {/* Camera Scanner */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Scan Barcode</h2>
        {!scanning ? (
          <button
            onClick={startScanner}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📷</span> Start Camera Scanner
          </button>
        ) : (
          <div className="space-y-3">
            <div id="qr-reader" className="rounded-lg overflow-hidden" style={{ width: '100%' }} />
            <button onClick={stopScanner} className="btn-secondary w-full">Stop Scanner</button>
          </div>
        )}
        {cameraError && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            {cameraError}
          </p>
        )}
      </div>

      {/* Manual Entry */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Manual Barcode Entry</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter barcode number..."
            value={manualBarcode}
            onChange={e => setManualBarcode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup(manualBarcode)}
          />
          <button
            className="btn-primary px-5"
            onClick={() => handleLookup(manualBarcode)}
            disabled={loading || !manualBarcode.trim()}
          >
            {loading ? '...' : 'Look Up'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">Not Found</p>
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Food Result */}
      {food && (
        <div className="card space-y-4">
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{food.name}</p>
            {food.brandName && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{food.brandName}</p>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {Math.round((food.calories || 0) * multiplier)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {Math.round((food.protein || 0) * multiplier * 10) / 10}g
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {Math.round((food.carbs || 0) * multiplier * 10) / 10}g
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {Math.round((food.fat || 0) * multiplier * 10) / 10}g
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
            </div>
          </div>

          {/* Micronutrients */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {food.fiber > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Fiber</span><span className="text-gray-800 dark:text-gray-200">{Math.round(food.fiber * multiplier * 10) / 10}g</span></div>}
            {food.sodium > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Sodium</span><span className="text-gray-800 dark:text-gray-200">{Math.round(food.sodium * multiplier)}mg</span></div>}
            {food.sugar > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Sugar</span><span className="text-gray-800 dark:text-gray-200">{Math.round(food.sugar * multiplier * 10) / 10}g</span></div>}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Nutrients shown per 100g. Serving size: {food.servingSize}g
            {food.householdServing ? ` (${food.householdServing})` : ''}.
          </p>

          {/* Add to Log */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Add to Food Log</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Serving Size (g)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  value={servingGrams}
                  onChange={e => setServingGrams(Math.max(1, parseInt(e.target.value) || 100))}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={logDate} onChange={e => setLogDate(e.target.value)} />
              </div>
            </div>
            {logSuccess ? (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm font-medium">
                Added to food log!
              </div>
            ) : (
              <button className="btn-primary w-full" onClick={handleLogFood} disabled={logging}>
                {logging ? 'Logging...' : `Log ${Math.round((food.calories || 0) * multiplier)} kcal to Diary`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
