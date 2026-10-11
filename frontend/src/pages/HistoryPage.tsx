import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History as HistoryIcon,
  FlaskConical,
  Trash2,
  Printer,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { VoiceAssistant } from '../components/VoiceAssistant';

export const HistoryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.history.get();
      setHistoryData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load agricultural history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this soil test record?')) return;
    try {
      await api.soilTests.delete(id);
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 print:p-0">
      {/* Header */}
      <div className="space-y-3 print:hidden">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-full text-base font-bold">
          <HistoryIcon className="w-5 h-5 text-emerald-700" />
          <span>{t.navHistory}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
              పొలం చరిత్ర మరియు నివేదికలు (Farm History)
            </h1>
            <p className="text-gray-600 text-lg">
              Review historical soil tests, compare nutrient fluctuations, and export field health summaries.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border-2 border-emerald-700 text-emerald-900 font-bold hover:bg-emerald-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Printer className="w-6 h-6" />
            <span>Print Historical Report</span>
          </button>
        </div>

        <VoiceAssistant
          textToSpeak={
            language === 'te'
              ? 'ఇక్కడ మీ గత భూసార పరీక్షలు మరియు ఎరువుల సిఫార్సుల చరిత్రను చూడవచ్చు.'
              : 'Here you can view and compare your historical soil tests and fertilizer recommendations.'
          }
        />
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-lg flex items-center gap-2">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500 text-lg font-medium">
          Loading farm history records...
        </div>
      ) : historyData ? (
        <div className="space-y-8">
          {/* Historical Nutrient Trend Comparison */}
          {historyData.nutrient_trends && historyData.nutrient_trends.length > 0 && (
            <div className="farmer-card p-6 bg-white space-y-4">
              <h2 className="text-2xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
                <span>భూసార మార్పుల పోలిక (Soil Nutrient Trends Over Time)</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-base">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-gray-600 text-sm font-bold uppercase">
                      <th className="py-3 px-3">Sample Date</th>
                      <th className="py-3 px-3">Nitrogen (mg/kg)</th>
                      <th className="py-3 px-3">Phosphorus (mg/kg)</th>
                      <th className="py-3 px-3">Potassium (mg/kg)</th>
                      <th className="py-3 px-3">Soil pH</th>
                      <th className="py-3 px-3">Testing Lab</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {historyData.nutrient_trends.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-emerald-50/30">
                        <td className="py-3.5 px-3 font-bold text-gray-900">{item.date}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-black ${
                              item.nitrogen_mg_kg < 125
                                ? 'text-amber-700'
                                : item.nitrogen_mg_kg <= 250
                                ? 'text-emerald-700'
                                : 'text-blue-700'
                            }`}
                          >
                            {item.nitrogen_mg_kg}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-black ${
                              item.phosphorus_mg_kg < 10
                                ? 'text-amber-700'
                                : item.phosphorus_mg_kg <= 25
                                ? 'text-emerald-700'
                                : 'text-blue-700'
                            }`}
                          >
                            {item.phosphorus_mg_kg}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-black ${
                              item.potassium_mg_kg < 110
                                ? 'text-amber-700'
                                : item.potassium_mg_kg <= 280
                                ? 'text-emerald-700'
                                : 'text-blue-700'
                            }`}
                          >
                            {item.potassium_mg_kg}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-gray-800">{item.soil_ph}</td>
                        <td className="py-3.5 px-3 text-gray-600 text-sm">{item.lab_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past Soil Tests */}
          <div className="farmer-card p-6 bg-white space-y-4">
            <h2 className="text-2xl font-black text-gray-900 border-b pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-emerald-700" />
                <span>Saved Soil Tests ({historyData.soil_tests?.length || 0})</span>
              </span>
              <Link to="/soil-input" className="text-sm text-emerald-700 font-bold hover:underline">
                + Add New Test
              </Link>
            </h2>

            {historyData.soil_tests && historyData.soil_tests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyData.soil_tests.map((test: any) => (
                  <div
                    key={test.id}
                    className="p-5 rounded-2xl border-2 border-emerald-900/10 bg-emerald-50/20 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {test.date}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTest(test.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-lg"
                          title="Delete Record"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center pt-2">
                        <div className="bg-white p-2 rounded-xl border">
                          <span className="text-xs text-gray-500 block">N</span>
                          <span className="text-lg font-black text-emerald-900">{test.nitrogen_mg_kg}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border">
                          <span className="text-xs text-gray-500 block">P</span>
                          <span className="text-lg font-black text-amber-900">{test.phosphorus_mg_kg}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border">
                          <span className="text-xs text-gray-500 block">K</span>
                          <span className="text-lg font-black text-blue-900">{test.potassium_mg_kg}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border">
                          <span className="text-xs text-gray-500 block">pH</span>
                          <span className="text-lg font-black text-purple-900">{test.soil_ph}</span>
                        </div>
                      </div>

                      {test.lab_name && (
                        <p className="text-xs text-gray-500 pt-1">
                          Lab: {test.lab_name}
                        </p>
                      )}
                    </div>

                    <Link
                      to={`/fertilizer-recommendation?n=${test.nitrogen_mg_kg}&p=${test.phosphorus_mg_kg}&k=${test.potassium_mg_kg}&ph=${test.soil_ph}`}
                      className="text-sm font-bold text-emerald-700 hover:underline flex items-center gap-1 pt-2 border-t"
                    >
                      <span>Recalculate Fertilizer</span> <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No past soil tests recorded.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
