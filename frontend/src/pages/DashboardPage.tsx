import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  FlaskConical,
  Sparkles,
  CalendarCheck,
  CloudSun,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { SoilTest, FertilizerTask, WeatherData } from '../types';

export const DashboardPage: React.FC = () => {
  const { userName, role } = useAuth();
  const { t, language } = useLanguage();

  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [tasks, setTasks] = useState<FertilizerTask[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [testsRes, tasksRes, weatherRes] = await Promise.allSettled([
          api.soilTests.list(),
          api.schedules.list('pending'),
          api.weather.get()
        ]);

        if (testsRes.status === 'fulfilled') setSoilTests(testsRes.value);
        if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value);
        if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleCompleteTask = async (id: string) => {
    try {
      await api.schedules.updateStatus(id, 'completed');
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const latestTest = soilTests[0];

  const dashboardVoiceText =
    language === 'te'
      ? `నమస్కారం ${userName || 'రైతు'}. మీ వద్ద ${soilTests.length} భూసార పరీక్షలు మరియు ${tasks.length} రాబోయే ఎరువుల పనులు ఉన్నాయి.`
      : language === 'hi'
      ? `नमस्ते ${userName || 'किसान भाई'}। आपके पास ${soilTests.length} मिट्टी परीक्षण और ${tasks.length} आगामी कार्य हैं।`
      : `Welcome ${userName || 'Farmer'}. You have ${soilTests.length} saved soil tests and ${tasks.length} upcoming fertilizer tasks.`;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg border-2 border-emerald-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-block bg-emerald-700/80 px-3.5 py-1 rounded-full text-emerald-100 text-sm font-bold">
            {role === 'family_helper' ? t.welcomeHelper : t.welcomeFarmer}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            {userName || 'Farmer'}
          </h1>
          <p className="text-emerald-100 text-lg">
            Here is your daily farm health summary and action schedule.
          </p>
        </div>

        <div>
          <VoiceAssistant textToSpeak={dashboardVoiceText} />
        </div>
      </div>

      {/* Quick Action Touch Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Sprout className="w-7 h-7 text-emerald-700" />
          <span>{t.quickActions}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/soil-input">
            <BigButton
              variant="primary"
              icon={<FlaskConical className="w-7 h-7" />}
              className="w-full text-lg"
            >
              {t.btnAddSoilTest}
            </BigButton>
          </Link>

          <Link to="/upload-report">
            <BigButton
              variant="secondary"
              icon={<Upload className="w-7 h-7 text-emerald-700" />}
              className="w-full text-lg"
            >
              {t.btnUploadReport}
            </BigButton>
          </Link>

          <Link to="/fertilizer-recommendation">
            <BigButton
              variant="accent"
              icon={<Sparkles className="w-7 h-7 text-emerald-950" />}
              className="w-full text-lg"
            >
              {t.btnAnalyzeField}
            </BigButton>
          </Link>
        </div>
      </section>

      {/* Grid: Latest Soil Test & Weather Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Soil Test Summary */}
        <div className="farmer-card p-6 bg-white space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-emerald-700" />
                <span>{t.latestRecommendation}</span>
              </h3>
              {latestTest && (
                <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {latestTest.sample_date || 'Recent'}
                </span>
              )}
            </div>

            {latestTest ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center pt-2">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-bold block">N (Nitrogen)</span>
                    <span className="text-xl font-black text-emerald-900">{latestTest.nitrogen_mg_kg}</span>
                    <span className="text-xs text-gray-500 block">mg/kg</span>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <span className="text-xs text-amber-800 font-bold block">P (Phosphorus)</span>
                    <span className="text-xl font-black text-amber-900">{latestTest.phosphorus_mg_kg}</span>
                    <span className="text-xs text-gray-500 block">mg/kg</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <span className="text-xs text-blue-800 font-bold block">K (Potassium)</span>
                    <span className="text-xl font-black text-blue-900">{latestTest.potassium_mg_kg}</span>
                    <span className="text-xs text-gray-500 block">mg/kg</span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <span className="text-xs text-purple-800 font-bold block">Soil pH</span>
                    <span className="text-xl font-black text-purple-900">{latestTest.soil_ph}</span>
                    <span className="text-xs text-gray-500 block">scale</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  Laboratory: <strong>{latestTest.lab_name || 'Self Entry / Local KVK'}</strong>
                </p>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 space-y-3">
                <FlaskConical className="w-12 h-12 mx-auto text-gray-300" />
                <p className="text-lg">No soil test recorded yet.</p>
                <Link to="/soil-input" className="text-emerald-700 font-bold hover:underline inline-block">
                  + Add your first soil test
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/fertilizer-recommendation"
            className="flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl font-bold transition-colors"
          >
            <span>View Full Fertilizer Breakdown</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Live Weather & Agricultural Spray Alert */}
        <div className="farmer-card p-6 bg-white space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CloudSun className="w-6 h-6 text-blue-600" />
                <span>{t.todayWeather}</span>
              </h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${weather?.is_live ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {weather?.is_live ? '● Live Satellite' : 'Offline Mode'}
              </span>
            </div>

            {weather ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-blue-50/70 p-4 rounded-2xl border border-blue-200">
                  <div>
                    <span className="text-3xl font-black text-blue-950">
                      {weather.current.temperature_c}°C
                    </span>
                    <span className="text-sm text-gray-600 block">
                      {weather.current.description} • Humidity: {weather.current.humidity_percent}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-700 block">Wind: {weather.current.wind_speed_kmh} km/h</span>
                    <span className="text-xs text-gray-500">{weather.location}</span>
                  </div>
                </div>

                {/* Practical Spray Advisory */}
                <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-base mb-1">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                    <span>{t.advisoryTitle}</span>
                  </div>
                  <p className="text-base text-amber-950 leading-relaxed font-medium">
                    {weather.current.spray_advisory}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">Loading weather details...</div>
            )}
          </div>

          <Link
            to="/weather"
            className="flex items-center justify-between p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl font-bold transition-colors"
          >
            <span>Check 3-Day Forecast & Rain Risk</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Upcoming Fertilizer Tasks & Reminders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-emerald-700" />
            <span>{t.upcomingTasks}</span>
          </h2>
          <Link to="/schedules" className="text-emerald-700 font-bold hover:underline">
            View All ({tasks.length})
          </Link>
        </div>

        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="farmer-card p-5 bg-white flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Due: {task.due_date}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{task.stage_name}</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{task.task_title}</h4>
                  <p className="text-sm text-gray-600 font-medium">
                    Product: <strong>{task.product_name}</strong> ({task.quantity_kg} kg)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCompleteTask(task.id)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-colors min-w-[72px]"
                  title="Mark Completed"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                  <span className="text-xs mt-1">Done</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-2xl border-2 border-emerald-900/10 text-center text-gray-600 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-lg font-bold text-gray-800">All current fertilizer tasks completed!</p>
            <p className="text-sm text-gray-500">
              When you generate a fertilizer recommendation, scheduled splits will automatically appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
