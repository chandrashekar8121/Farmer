import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Wind,
  Droplets,
  AlertTriangle,
  MapPin,
  Calendar,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { WeatherData } from '../types';

const DISTRICT_LOCATIONS = [
  { name: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
  { name: 'Guntur, Andhra Pradesh', lat: 16.3067, lon: 80.4365 },
  { name: 'Warangal, Telangana', lat: 17.9689, lon: 79.5941 },
  { name: 'Kurnool, Andhra Pradesh', lat: 15.8281, lon: 78.0373 },
  { name: 'Karimnagar, Telangana', lat: 18.4386, lon: 79.1288 },
  { name: 'Nellore, Andhra Pradesh', lat: 14.4426, lon: 79.9865 },
  { name: 'Nizamabad, Telangana', lat: 18.6725, lon: 78.0941 },
  { name: 'Anantapur, Andhra Pradesh', lat: 14.6819, lon: 77.6006 },
];

export const WeatherPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedLoc, setSelectedLoc] = useState(DISTRICT_LOCATIONS[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to request browser geolocation permission once
  const requestBrowserLocation = (): Promise<{ lat: number; lon: number; name: string }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by this browser.'));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Simple reverse lookup: match nearest preset district
          const nearest = DISTRICT_LOCATIONS.reduce((prev, cur) => {
            const dist = Math.hypot(cur.lat - latitude, cur.lon - longitude);
            return dist < prev.dist ? { loc: cur, dist } : prev;
          }, { loc: DISTRICT_LOCATIONS[0], dist: Infinity });
          resolve({ lat: latitude, lon: longitude, name: nearest.loc.name });
        },
        (err) => reject(new Error(err.message || 'Location permission denied'))
      );
    });

  const fetchWeather = async (loc = selectedLoc) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.weather.get(loc.lat, loc.lon, loc.name);
      setWeather(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch weather observations.');
    } finally {
      setLoading(false);
    }
  };

  // Button handler to refresh location on demand
  const handleUseCurrentLocation = async () => {
    try {
      const loc = await requestBrowserLocation();
      setSelectedLoc(loc);
      localStorage.setItem('krishi_location', JSON.stringify(loc));
      fetchWeather(loc);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // Load stored location or ask once on component mount
  useEffect(() => {
    const stored = localStorage.getItem('krishi_location');
    if (stored) {
      const loc = JSON.parse(stored) as { lat: number; lon: number; name: string };
      setSelectedLoc(loc);
      fetchWeather(loc);
    } else {
      // Prompt for location permission silently; if denied, keep default
      requestBrowserLocation()
        .then((loc) => {
          setSelectedLoc(loc);
          localStorage.setItem('krishi_location', JSON.stringify(loc));
          fetchWeather(loc);
        })
        .catch(() => {
          // Permission denied or error – fallback to default district
          fetchWeather(selectedLoc);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const voiceSpeechText = weather
    ? language === 'te'
      ? `${weather.location} లో ఉష్ణోగ్రత ${weather.current.temperature_c} డిగ్రీలు. పిచికారీ సలహా: ${weather.current.spray_advisory}`
      : `Weather for ${weather.location}: Temperature is ${weather.current.temperature_c}°C. Spraying advisory: ${weather.current.spray_advisory}`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-3.5 py-1.5 rounded-full text-base font-bold">
          <CloudSun className="w-5 h-5 text-blue-700" />
          <span>{t.weatherTitle}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
              వాతావరణం మరియు ఎరువుల పిచికారీ సలహా (Weather & Spraying)
            </h1>
            <p className="text-gray-600 text-lg">
              Live meteorological observations directly from OpenWeather satellites.
            </p>
          </div>
          <button
            onClick={() => fetchWeather(selectedLoc)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {weather && (
          <VoiceAssistant textToSpeak={voiceSpeechText} />
        )}
      </div>

      {/* District / Location Selector */}
      <div className="farmer-card p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
          <MapPin className="w-6 h-6 text-emerald-700 flex-shrink-0" />
          <span>Select District / జిల్లా ఎంచుకోండి:</span>
        </div>
        <select
          value={selectedLoc.name}
          onChange={(e) => {
            const found = DISTRICT_LOCATIONS.find((d) => d.name === e.target.value);
            if (found) setSelectedLoc(found);
          }}
          className="w-full sm:w-auto px-4 py-3 rounded-xl border-2 border-emerald-600 text-base font-bold bg-white text-emerald-950 focus:ring-0"
        >
          {DISTRICT_LOCATIONS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-lg">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500 text-lg font-medium">
          Loading satellite meteorological feed...
        </div>
      ) : weather ? (
        <div className="space-y-6">
          {/* Main Weather Card */}
          <div className="farmer-card p-8 bg-gradient-to-br from-blue-700 to-blue-900 text-white border-2 border-blue-950 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-blue-200 text-sm font-bold uppercase tracking-wider block">
                  {weather.location}
                </span>
                <span className="text-5xl sm:text-6xl font-black text-white block mt-1">
                  {weather.current.temperature_c}°C
                </span>
                <span className="text-xl text-blue-100 font-semibold block mt-1">
                  {weather.current.description}
                </span>
              </div>

              <div className="flex flex-col gap-2 bg-blue-950/60 p-4 rounded-2xl border border-blue-600 sm:text-right">
                <span className="text-sm text-blue-200">
                  Feels Like: <strong>{weather.current.feels_like_c}°C</strong>
                </span>
                <span className="text-sm text-blue-200 flex items-center sm:justify-end gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Humidity: <strong>{weather.current.humidity_percent}%</strong>
                </span>
                <span className="text-sm text-blue-200 flex items-center sm:justify-end gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  Wind: <strong>{weather.current.wind_speed_kmh} km/h</strong>
                </span>
              </div>
            </div>

            {/* Spraying Advisory Box */}
            <div className="p-5 bg-white/95 text-gray-900 rounded-2xl shadow-inner border-2 border-amber-300 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xl">
                <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0" />
                <span>{t.advisoryTitle} (పిచికారీ సలహా)</span>
              </div>
              <p className="text-lg leading-relaxed text-gray-800 font-bold">
                {weather.current.spray_advisory}
              </p>
            </div>
          </div>

          {/* 3-Day Forecast */}
          {weather.forecast && weather.forecast.length > 0 && (
            <div className="farmer-card p-6 bg-white space-y-4">
              <h3 className="text-2xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-emerald-700" />
                <span>రాబోయే 3 రోజుల వాతావరణం (3-Day Outlook)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {weather.forecast.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-blue-50/50 border-2 border-blue-100 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <span className="text-sm font-bold text-blue-900 block">{item.date}</span>
                      <span className="text-2xl font-black text-gray-900 block mt-1">
                        {item.temp_max_c}° / {item.temp_min_c}°C
                      </span>
                      <span className="text-sm text-gray-600 block">{item.condition}</span>
                    </div>

                    <div className="pt-2 border-t border-blue-200 flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-semibold">{t.rainRisk}:</span>
                      <span className={`font-bold ${item.rain_probability_percent > 40 ? 'text-red-700 font-black' : 'text-blue-700'}`}>
                        {item.rain_probability_percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transparency note */}
          <div className="p-4 bg-gray-50 rounded-2xl border text-xs text-gray-600 space-y-1">
            <div className="font-bold text-gray-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Data Source: {weather.data_source}</span>
            </div>
            <p>{weather.notes}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
