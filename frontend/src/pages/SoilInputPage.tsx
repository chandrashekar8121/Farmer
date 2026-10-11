import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { VoiceAssistant } from '../components/VoiceAssistant';

export const SoilInputPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [nitrogen, setNitrogen] = useState<string>('110');
  const [phosphorus, setPhosphorus] = useState<string>('18');
  const [potassium, setPotassium] = useState<string>('150');
  const [soilPh, setSoilPh] = useState<string>('6.8');
  const [soilType, setSoilType] = useState<string>('Clay Loam (నల్లరేగడి / మట్టి నేల)');
  const [cropName, setCropName] = useState<string>('Rice');
  const [targetArea, setTargetArea] = useState<string>('2.0');
  const [areaUnit, setAreaUnit] = useState<string>('acres');
  const [growthStage, setGrowthStage] = useState<string>('Basal (Land Preparation / Sowing)');
  const [sowingDate, setSowingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [irrigation, setIrrigation] = useState<string>('canal');
  const [labName, setLabName] = useState<string>('Rythu Bharosa Kendra / KVK Lab');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVoiceInput = (text: string) => {
    // Attempt parsing numbers from voice transcript (e.g. "Nitrogen 120" or "pH 7.2")
    const matchN = text.match(/nitrogen\s*([0-9.]+)/i);
    if (matchN) setNitrogen(matchN[1]);

    const matchP = text.match(/phosphorus\s*([0-9.]+)/i);
    if (matchP) setPhosphorus(matchP[1]);

    const matchK = text.match(/potassium\s*([0-9.]+)/i);
    if (matchK) setPotassium(matchK[1]);

    const matchPh = text.match(/ph\s*([0-9.]+)/i);
    if (matchPh) setSoilPh(matchPh[1]);
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const nVal = parseFloat(nitrogen);
    const pVal = parseFloat(phosphorus);
    const kVal = parseFloat(potassium);
    const phVal = parseFloat(soilPh);
    const areaVal = parseFloat(targetArea);

    // Strict client-side validation
    if (isNaN(nVal) || nVal < 0) {
      setErrorMsg('Nitrogen must be a valid positive number (mg/kg).');
      return;
    }
    if (isNaN(pVal) || pVal < 0) {
      setErrorMsg('Phosphorus must be a valid positive number (mg/kg).');
      return;
    }
    if (isNaN(kVal) || kVal < 0) {
      setErrorMsg('Potassium must be a valid positive number (mg/kg).');
      return;
    }
    if (isNaN(phVal) || phVal < 0 || phVal > 14) {
      setErrorMsg('Soil pH must be between 0.0 and 14.0.');
      return;
    }
    if (isNaN(areaVal) || areaVal <= 0) {
      setErrorMsg('Field area must be greater than 0.');
      return;
    }

    setLoading(true);
    try {
      if (isAuthenticated) {
        await api.soilTests.create({
          nitrogen_mg_kg: nVal,
          phosphorus_mg_kg: pVal,
          potassium_mg_kg: kVal,
          soil_ph: phVal,
          lab_name: labName,
          notes: `Crop: ${cropName}, Area: ${areaVal} ${areaUnit}`
        });
        setSuccessMsg(t.saveSuccess);
      }

      // Navigate to fertilizer recommendation with query parameters
      navigate(
        `/fertilizer-recommendation?crop=${encodeURIComponent(cropName)}&area=${areaVal}&unit=${areaUnit}&n=${nVal}&p=${pVal}&k=${kVal}&ph=${phVal}&stage=${encodeURIComponent(growthStage)}&sowing=${sowingDate}`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save soil test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-full text-base font-bold">
          <FlaskConical className="w-5 h-5 text-emerald-700" />
          <span>{t.soilInputTitle}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          భూమి పరీక్ష వివరాల నమోదు (Soil Details)
        </h1>
        <p className="text-gray-600 text-lg">
          {t.soilInputSubtitle}
        </p>

        {/* Voice Assistant for Speech Input */}
        <div className="pt-2">
          <VoiceAssistant
            onTranscript={handleVoiceInput}
            textToSpeak={
              language === 'te'
                ? 'మీ భూసార పరీక్ష కార్డులోని నత్రజని, భాస్వరం, పొటాష్ మరియు పి హెచ్ విలువలను నమోదు చేయండి.'
                : 'Please enter your Nitrogen, Phosphorus, Potassium, and pH numbers from your soil test card.'
            }
          />
        </div>
      </div>

      {/* Explanatory Banner on Units & ICAR Standards */}
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-emerald-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Info className="w-6 h-6 text-emerald-700 flex-shrink-0" />
          <span>Nutrient Units & Agronomic Standards (ICAR Guidelines)</span>
        </div>
        <p className="text-base leading-relaxed text-emerald-900">
          {t.unitExplanation} Soil laboratories in India typically report values in <strong>mg/kg</strong> (milligrams per kilogram soil, equivalent to parts per million / ppm). Our calculator automatically adjusts synthetic fertilizer requirements for Low, Medium, and High soil status.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border-2 border-green-300 rounded-2xl text-green-800 text-lg flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Soil Form */}
      <form onSubmit={validateAndSubmit} className="farmer-card p-8 bg-white space-y-8">
        {/* Section 1: N-P-K & pH */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900 border-b pb-2 flex items-center justify-between">
            <span>1. పోషకాల స్థాయి (Nutrient Values)</span>
            <span className="text-sm font-semibold text-gray-500">Unit: mg/kg</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                {t.nitrogenLabel} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="2000"
                  required
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  className="w-full px-4 py-3.5 pr-20 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
                <span className="absolute right-4 top-3.5 text-gray-500 font-bold text-base">
                  mg/kg
                </span>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">Normal: 125 – 250 mg/kg</span>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                {t.phosphorusLabel} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="1000"
                  required
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  className="w-full px-4 py-3.5 pr-20 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
                <span className="absolute right-4 top-3.5 text-gray-500 font-bold text-base">
                  mg/kg
                </span>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">Normal: 10 – 25 mg/kg</span>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                {t.potassiumLabel} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="2000"
                  required
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  className="w-full px-4 py-3.5 pr-20 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
                <span className="absolute right-4 top-3.5 text-gray-500 font-bold text-base">
                  mg/kg
                </span>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">Normal: 110 – 280 mg/kg</span>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                {t.phLabel} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  required
                  value={soilPh}
                  onChange={(e) => setSoilPh(e.target.value)}
                  className="w-full px-4 py-3.5 pr-20 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
                <span className="absolute right-4 top-3.5 text-gray-500 font-bold text-base">
                  pH scale
                </span>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">Optimal: 6.5 – 7.5</span>
            </div>
          </div>
        </div>

        {/* Section 2: Crop, Area & Sowing */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900 border-b pb-2">
            2. పంట మరియు పొలం కొలతలు (Crop & Field Specs)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                {t.cropLabel} *
              </label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-4 py-3.5 text-lg font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
              >
                <option value="Rice">వరి (Rice / Paddy)</option>
                <option value="Cotton">ప్రత్తి (Cotton)</option>
                <option value="Maize">మొక్కజొన్న (Maize)</option>
                <option value="Wheat">గోధుమ (Wheat)</option>
                <option value="Sugarcane">చెరకు (Sugarcane)</option>
                <option value="Groundnut">వేరుశనగ (Groundnut)</option>
                <option value="Chilli">మిరప (Chilli)</option>
                <option value="Tomato">టమోటా (Tomato)</option>
                <option value="Chickpea">శనగ (Chickpea)</option>
                <option value="Banana">అరటి (Banana)</option>
                <option value="Blackgram">మినుములు (Blackgram)</option>
                <option value="Pigeonpeas">కందులు (Pigeonpeas)</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                {t.areaLabel} & {t.areaUnitLabel} *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                  placeholder="2.0"
                  className="w-1/2 px-4 py-3.5 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value)}
                  className="w-1/2 px-3 py-3.5 text-base font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                >
                  <option value="acres">{t.acres}</option>
                  <option value="hectares">{t.hectares}</option>
                  <option value="sq_meters">{t.sqMeters}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                {t.growthStageLabel}
              </label>
              <select
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="w-full px-4 py-3.5 text-base font-semibold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
              >
                <option value="Basal (Land Preparation / Sowing)">Basal (విత్తే ముందు / దుక్కిలో)</option>
                <option value="Vegetative / Tillering Stage">Vegetative (పిలకల దశ / ఎదుగుదల దశ)</option>
                <option value="Panicle Initiation / Flowering">Reproductive (వెన్ను దశ / పూత దశ)</option>
                <option value="Grain Filling / Maturity">Grain Filling (గింజ పాలుపోసుకునే దశ)</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                {t.sowingDateLabel}
              </label>
              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="w-full px-4 py-3.5 text-lg font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Soil & Lab Meta */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900 border-b pb-2">
            3. నేల రకం & సమాచారం (Soil Type & Lab)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                Soil Type / నేల రకం
              </label>
              <input
                type="text"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-gray-300 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                Testing Center / ల్యాబ్ పేరు
              </label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-gray-300 focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <BigButton
            type="submit"
            disabled={loading}
            variant="primary"
            icon={<ArrowRight className="w-7 h-7" />}
            className="flex-1 text-xl"
          >
            {loading ? t.loading : t.submitSoilBtn}
          </BigButton>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/crop-recommendation?n=${nitrogen}&p=${phosphorus}&k=${potassium}&ph=${soilPh}`
              )
            }
            className="px-6 py-4 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black rounded-2xl text-xl flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Sparkles className="w-6 h-6" />
            <span>AI Crop Advice (ఏ పంట వేయాలి?)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
