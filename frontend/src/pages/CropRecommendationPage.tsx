import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Sprout,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { CropRecommendation } from '../types';

export const CropRecommendationPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();

  // Inputs
  const [nitrogen, setNitrogen] = useState<string>(searchParams.get('n') || '90');
  const [phosphorus, setPhosphorus] = useState<string>(searchParams.get('p') || '45');
  const [potassium, setPotassium] = useState<string>(searchParams.get('k') || '40');
  const [soilPh, setSoilPh] = useState<string>(searchParams.get('ph') || '6.5');
  const [rainfall, setRainfall] = useState<string>('200');
  const [temperature, setTemperature] = useState<string>('25');
  const [humidity, setHumidity] = useState<string>('80');

  const [recommendation, setRecommendation] = useState<CropRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCropRecommendation = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.cropRecommendations.predict({
        nitrogen_mg_kg: parseFloat(nitrogen),
        phosphorus_mg_kg: parseFloat(phosphorus),
        potassium_mg_kg: parseFloat(potassium),
        soil_ph: parseFloat(soilPh),
        rainfall: parseFloat(rainfall),
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity)
      });
      setRecommendation(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to predict crop recommendation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCropRecommendation();
  }, []);

  const voiceSpeechText = recommendation
    ? language === 'te'
      ? `మీ నేలకు అనుకూలమైన ప్రధాన పంట: ${recommendation.predicted_crop}. ${recommendation.explanation}`
      : language === 'hi'
      ? `आपकी मिट्टी के लिए सर्वोत्तम अनुशंसित फसल: ${recommendation.predicted_crop}. ${recommendation.explanation}`
      : `Recommended crop: ${recommendation.predicted_crop}. ${recommendation.explanation}`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-3.5 py-1.5 rounded-full text-base font-bold">
          <Sparkles className="w-5 h-5 text-amber-700" />
          <span>{t.cropRecTitle}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          ఏ పంట వేయాలి? (AI Crop Recommendation)
        </h1>
        <p className="text-gray-600 text-lg">
          Powered by a Random Forest Machine Learning model fitted on 2,200 ICAR benchmark agricultural samples.
        </p>

        {recommendation && (
          <VoiceAssistant textToSpeak={voiceSpeechText} />
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-lg">
          {errorMsg}
        </div>
      )}

      {/* Primary Crop Card */}
      {recommendation && (
        <div className="space-y-6">
          <div className="farmer-card p-8 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white border-4 border-emerald-900 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-700/80 pb-6">
              <div>
                <span className="text-emerald-300 text-base font-bold block mb-1">
                  {t.primaryCrop}
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  {recommendation.predicted_crop}
                </h2>
              </div>

              <div className="bg-emerald-700/70 p-4 rounded-2xl border border-emerald-500/50 text-center sm:text-right flex-shrink-0">
                <span className="text-xs text-emerald-200 font-bold block">{t.confidence}</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-300">
                  {recommendation.confidence_score}%
                </span>
                <span className="text-xs text-emerald-200 block">AI Probability</span>
              </div>
            </div>

            {/* Explanation & Advisory */}
            <div className="space-y-4 text-emerald-100 text-lg leading-relaxed">
              <div className="bg-emerald-900/60 p-5 rounded-2xl border border-emerald-800 space-y-2">
                <h3 className="font-bold text-white text-xl flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span>{t.agronomicExplanation}</span>
                </h3>
                <p>{recommendation.explanation}</p>
              </div>

              {recommendation.seasonal_advisory && (
                <div className="bg-emerald-900/60 p-5 rounded-2xl border border-emerald-800 space-y-2">
                  <h3 className="font-bold text-white text-xl flex items-center gap-2">
                    <Sprout className="w-6 h-6 text-amber-400" />
                    <span>{t.seasonalAdvisory}</span>
                  </h3>
                  <p>{recommendation.seasonal_advisory}</p>
                </div>
              )}
            </div>

            {/* Action to proceed to Fertilizer Calculator */}
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Link
                to={`/fertilizer-recommendation?crop=${encodeURIComponent(recommendation.predicted_crop.split(' ')[0])}&area=2.0&unit=acres&n=${nitrogen}&p=${phosphorus}&k=${potassium}&ph=${soilPh}`}
                className="flex-1"
              >
                <BigButton
                  variant="accent"
                  icon={<ArrowRight className="w-7 h-7 text-emerald-950" />}
                  className="w-full text-xl"
                >
                  Calculate Fertilizer for {recommendation.predicted_crop.split(' ')[0]}
                </BigButton>
              </Link>
            </div>
          </div>

          {/* Secondary Crop Options */}
          {recommendation.secondary_crops && recommendation.secondary_crops.length > 0 && (
            <div className="farmer-card p-6 bg-white space-y-4">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
                <span>{t.secondaryCrops} (Alternative Crop Options)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendation.secondary_crops.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-emerald-50/50 rounded-2xl border-2 border-emerald-200 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xl font-black text-emerald-950">{item.crop}</h4>
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mt-1">
                        {item.suitability}
                      </span>
                    </div>
                    <div className="mt-3 text-right">
                      <span className="text-sm font-bold text-emerald-900">
                        {item.confidence}% Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations and Model Transparency Banner */}
          <div className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-300 text-amber-950 text-base space-y-1">
            <div className="flex items-center gap-2 font-bold text-lg text-amber-900">
              <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0" />
              <span>Scientific Disclaimer & Agronomic Limitations</span>
            </div>
            <p className="leading-relaxed">
              {recommendation.limitations} This system provides educational decision support. Local market demands, seed variety availability, and irrigation water supply should be factored in before sowing.
            </p>
          </div>
        </div>
      )}

      {/* Adjustable Parameters Drawer */}
      <div className="farmer-card p-6 bg-white space-y-4">
        <h3 className="text-xl font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
          <span>Adjust Soil & Weather Features</span>
          <button
            onClick={fetchCropRecommendation}
            disabled={loading}
            className="text-sm text-emerald-700 font-bold hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" /> Recalculate
          </button>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Nitrogen (mg/kg)</label>
            <input
              type="number"
              value={nitrogen}
              onChange={(e) => setNitrogen(e.target.value)}
              className="w-full p-2.5 rounded-lg border text-base font-bold"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Phosphorus (mg/kg)</label>
            <input
              type="number"
              value={phosphorus}
              onChange={(e) => setPhosphorus(e.target.value)}
              className="w-full p-2.5 rounded-lg border text-base font-bold"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Potassium (mg/kg)</label>
            <input
              type="number"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
              className="w-full p-2.5 rounded-lg border text-base font-bold"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Soil pH</label>
            <input
              type="number"
              step="0.1"
              value={soilPh}
              onChange={(e) => setSoilPh(e.target.value)}
              className="w-full p-2.5 rounded-lg border text-base font-bold"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Rainfall (mm)</label>
            <input
              type="number"
              value={rainfall}
              onChange={(e) => setRainfall(e.target.value)}
              className="w-full p-2.5 rounded-lg border text-base font-bold"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Temperature (°C)</label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full p-2.5 rounded-lg border text-base font-bold"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Humidity (%)</label>
            <input
              type="number"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              className="w-full p-2.5 rounded-lg border text-base font-bold"
            />
          </div>
          <div className="flex items-end">
            <BigButton
              onClick={fetchCropRecommendation}
              disabled={loading}
              className="w-full !py-2.5 text-base"
            >
              Update
            </BigButton>
          </div>
        </div>
      </div>
    </div>
  );
};
