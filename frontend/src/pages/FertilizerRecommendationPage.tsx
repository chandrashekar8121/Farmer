import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sprout,
  Calendar,
  ShieldAlert,
  Printer,
  Receipt,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { VoiceAssistant } from '../components/VoiceAssistant';
import type { FertilizerRecommendation } from '../types';

export const FertilizerRecommendationPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [cropName, setCropName] = useState<string>(searchParams.get('crop') || 'Rice');
  const [targetArea, setTargetArea] = useState<number>(parseFloat(searchParams.get('area') || '2.0'));
  const [areaUnit, setAreaUnit] = useState<string>(searchParams.get('unit') || 'acres');
  const [nitrogen, setNitrogen] = useState<number>(parseFloat(searchParams.get('n') || '100'));
  const [phosphorus, setPhosphorus] = useState<number>(parseFloat(searchParams.get('p') || '18'));
  const [potassium, setPotassium] = useState<number>(parseFloat(searchParams.get('k') || '150'));
  const [soilPh, setSoilPh] = useState<number>(parseFloat(searchParams.get('ph') || '6.8'));
  const [growthStage, setGrowthStage] = useState<string>(
    searchParams.get('stage') || 'Basal (Land Preparation / Sowing)'
  );
  const [sowingDate, setSowingDate] = useState<string>(
    searchParams.get('sowing') || new Date().toISOString().split('T')[0]
  );

  const [recommendation, setRecommendation] = useState<FertilizerRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calculateDose = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.fertilizerRecommendations.calculate({
        crop_name: cropName,
        growth_stage: growthStage,
        target_area: targetArea,
        area_unit: areaUnit,
        nitrogen_mg_kg: nitrogen,
        phosphorus_mg_kg: phosphorus,
        potassium_mg_kg: potassium,
        soil_ph: soilPh,
        sowing_date: sowingDate
      });
      setRecommendation(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate fertilizer recommendation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateDose();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const voiceSpeechText = recommendation
    ? language === 'te'
      ? `${recommendation.crop_name} పంటకు ${recommendation.target_area} ${recommendation.area_unit} విస్తీర్ణానికి మొత్తం అంచనా వ్యయం ₹${recommendation.total_estimated_cost_inr}. ఎరువుల మోతాదు వివరాలు చూడండి.`
      : language === 'hi'
      ? `${recommendation.crop_name} के लिए ${recommendation.target_area} ${recommendation.area_unit} में अनुमानित उर्वरक लागत ₹${recommendation.total_estimated_cost_inr} है।`
      : `Fertilizer recommendation for ${recommendation.crop_name} on ${recommendation.target_area} ${recommendation.area_unit}. Total estimated cost is ₹${recommendation.total_estimated_cost_inr}.`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 print:p-0">
      {/* Header */}
      <div className="space-y-3 print:hidden">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-full text-base font-bold">
          <Sprout className="w-5 h-5 text-emerald-700" />
          <span>{t.fertTitle}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
              ఎరువుల మోతాదు మరియు ఖర్చు (Fertilizer Doses & Cost)
            </h1>
            <p className="text-gray-600 text-lg">
              Official ICAR Soil Test Crop Response (STCR) calculation engine.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border-2 border-emerald-700 text-emerald-900 font-bold hover:bg-emerald-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Printer className="w-6 h-6" />
            <span>Print Report</span>
          </button>
        </div>

        {recommendation && (
          <VoiceAssistant textToSpeak={voiceSpeechText} />
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-lg">
          {errorMsg}
        </div>
      )}

      {recommendation && (
        <div className="space-y-8">
          {/* Farm & Crop Summary Card */}
          <div className="farmer-card p-6 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white border-2 border-emerald-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <span className="text-emerald-300 text-sm font-bold uppercase tracking-wider">
                Target Crop & Area
              </span>
              <h2 className="text-3xl font-black">{recommendation.crop_name}</h2>
              <p className="text-emerald-100 text-lg">
                Field Size: <strong>{recommendation.target_area} {recommendation.area_unit}</strong> ({recommendation.target_area_hectares} Hectares)
              </p>
            </div>

            <div className="bg-emerald-950/60 p-5 rounded-2xl border border-emerald-700 text-right">
              <span className="text-xs text-emerald-300 font-bold block">{t.totalCostTitle}</span>
              <span className="text-3xl sm:text-4xl font-black text-amber-300">
                ₹{recommendation.total_estimated_cost_inr.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-200 block">Subsidized MRP</span>
            </div>
          </div>

          {/* Section 1: Nutrient Health Interpretation */}
          <div className="farmer-card p-6 bg-white space-y-4">
            <h3 className="text-2xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
              <span>{t.nutrientStatus} (Soil Test Diagnostic)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50">
                <span className="text-xs font-bold text-gray-500 uppercase block">Nitrogen (N)</span>
                <span className="text-2xl font-black text-emerald-900 block mt-1">
                  {recommendation.nutrient_status.nitrogen.status}
                </span>
                <p className="text-xs text-gray-600 mt-1 leading-snug">
                  {recommendation.nutrient_status.nitrogen.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50">
                <span className="text-xs font-bold text-gray-500 uppercase block">Phosphorus (P)</span>
                <span className="text-2xl font-black text-amber-900 block mt-1">
                  {recommendation.nutrient_status.phosphorus.status}
                </span>
                <p className="text-xs text-gray-600 mt-1 leading-snug">
                  {recommendation.nutrient_status.phosphorus.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50">
                <span className="text-xs font-bold text-gray-500 uppercase block">Potassium (K)</span>
                <span className="text-2xl font-black text-blue-900 block mt-1">
                  {recommendation.nutrient_status.potassium.status}
                </span>
                <p className="text-xs text-gray-600 mt-1 leading-snug">
                  {recommendation.nutrient_status.potassium.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl border-2 border-purple-200 bg-purple-50/50">
                <span className="text-xs font-bold text-gray-500 uppercase block">Soil pH ({recommendation.nutrient_status.ph.value})</span>
                <span className="text-2xl font-black text-purple-900 block mt-1">
                  {recommendation.nutrient_status.ph.status}
                </span>
                <p className="text-xs text-gray-600 mt-1 leading-snug">
                  {recommendation.nutrient_status.ph.description}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Recommended Products, Bags & Costs */}
          <div className="farmer-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-emerald-700" />
                <span>{t.recommendedDose}</span>
              </h3>
              <span className="text-xs text-gray-500 font-semibold hidden sm:inline">
                Field Area: {recommendation.target_area} {recommendation.area_unit}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-600 text-sm font-bold uppercase">
                    <th className="py-3 px-2">Fertilizer Product</th>
                    <th className="py-3 px-2">Weight (kg)</th>
                    <th className="py-3 px-2">Estimated Bags</th>
                    <th className="py-3 px-2">Subsidized MRP</th>
                    <th className="py-3 px-2 text-right">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {recommendation.recommended_products.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30">
                      <td className="py-4 px-2">
                        <strong className="text-gray-900 text-lg block">{prod.product_name}</strong>
                        <span className="text-xs text-gray-500">{prod.application_method}</span>
                      </td>
                      <td className="py-4 px-2 font-bold text-gray-800 text-lg">
                        {prod.quantity_kg} kg
                      </td>
                      <td className="py-4 px-2">
                        <span className="bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full font-black text-base">
                          {prod.bags} bags
                        </span>
                        <span className="text-xs text-gray-500 block mt-0.5">({prod.bag_size_kg} kg/bag)</span>
                      </td>
                      <td className="py-4 px-2 text-gray-700 text-sm">
                        ₹{prod.unit_price_inr} / bag
                      </td>
                      <td className="py-4 px-2 text-right font-black text-lg text-emerald-950">
                        ₹{prod.subtotal_inr.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-900 font-black text-xl text-gray-900">
                    <td colSpan={4} className="py-4 px-2 text-right">
                      {t.totalCostTitle}:
                    </td>
                    <td className="py-4 px-2 text-right text-emerald-800 text-2xl font-black">
                      ₹{recommendation.total_estimated_cost_inr.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-200">
              {t.govtSubsidizedNotice}
            </p>
          </div>

          {/* Section 3: Split Application Calendar Schedule */}
          {recommendation.split_schedule && recommendation.split_schedule.length > 0 && (
            <div className="farmer-card p-6 bg-white space-y-4">
              <h3 className="text-2xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                <Clock className="w-6 h-6 text-emerald-700" />
                <span>{t.splitScheduleTitle}</span>
              </h3>

              <div className="space-y-4">
                {recommendation.split_schedule.map((split, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border-2 border-emerald-900/10 bg-emerald-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                          Stage {idx + 1}
                        </span>
                        {split.due_date && (
                          <span className="text-sm font-bold text-gray-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            {split.due_date} (+{split.days_from_sowing} days)
                          </span>
                        )}
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">{split.stage}</h4>
                      <p className="text-base text-gray-700 font-medium">
                        Dose: <strong className="text-emerald-900">{split.product_name}</strong> ({split.quantity_kg} kg)
                      </p>
                      <p className="text-sm text-gray-600 leading-snug">{split.instructions}</p>
                    </div>

                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500 font-semibold block text-left sm:text-right">
                        Method:
                      </span>
                      <span className="text-sm font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 inline-block">
                        {split.method}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Safety & Handling Instructions */}
          <div className="farmer-card p-6 bg-amber-50 border-2 border-amber-300 space-y-3">
            <h3 className="text-xl font-black text-amber-950 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
              <span>{t.safetyTitle} (రైతు భద్రతా జాగ్రత్తలు)</span>
            </h3>
            <div className="text-amber-900 text-base leading-relaxed whitespace-pre-line font-medium">
              {recommendation.safety_instructions}
            </div>
            <div className="pt-2 text-xs text-amber-800 border-t border-amber-200">
              <strong>Source:</strong> {recommendation.recommendation_source} | <strong>Assumptions:</strong> {recommendation.assumptions}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
