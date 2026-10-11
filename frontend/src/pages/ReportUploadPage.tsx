import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { BigButton } from '../components/BigButton';
import { VoiceAssistant } from '../components/VoiceAssistant';

export const ReportUploadPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    soil_ph: string;
    lab_name: string;
  } | null>(null);

  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Client-side file type & size check
      const validExts = ['.pdf', '.png', '.jpg', '.jpeg', '.txt'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validExts.includes(fileExt)) {
        setErrorMsg('Invalid file format. Please choose a PDF, PNG, or JPG file.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File size exceeds the 5 MB limit. Please select a smaller document.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setErrorMsg(null);
    setUploading(true);

    try {
      const res = await api.soilTests.uploadReport(selectedFile);
      setReportId(res.report_id);
      setExtractionStatus(res.extraction_status);
      setStatusMessage(res.message);

      // Prepopulate editable confirmation form
      setExtractedData({
        nitrogen: res.extracted_data.nitrogen_mg_kg?.toString() || '110',
        phosphorus: res.extracted_data.phosphorus_mg_kg?.toString() || '18',
        potassium: res.extracted_data.potassium_mg_kg?.toString() || '150',
        soil_ph: res.extracted_data.soil_ph?.toString() || '6.8',
        lab_name: res.extracted_data.lab_name || 'Government Diagnostic Lab',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload failed. Please try again or use manual entry.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedData) return;

    const n = parseFloat(extractedData.nitrogen);
    const p = parseFloat(extractedData.phosphorus);
    const k = parseFloat(extractedData.potassium);
    const ph = parseFloat(extractedData.soil_ph);

    if (isNaN(n) || isNaN(p) || isNaN(k) || isNaN(ph)) {
      setErrorMsg('Please ensure all numbers are valid before proceeding.');
      return;
    }

    if (isAuthenticated) {
      try {
        await api.soilTests.create({
          nitrogen_mg_kg: n,
          phosphorus_mg_kg: p,
          potassium_mg_kg: k,
          soil_ph: ph,
          lab_name: extractedData.lab_name,
          report_id: reportId || undefined,
          notes: 'Extracted from uploaded report & verified by farmer.'
        });
      } catch (err) {
        console.error('Failed to save verified test:', err);
      }
    }

    // Forward to fertilizer recommendation
    navigate(
      `/fertilizer-recommendation?crop=Rice&area=2.0&unit=acres&n=${n}&p=${p}&k=${k}&ph=${ph}`
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-full text-base font-bold">
          <Upload className="w-5 h-5 text-emerald-700" />
          <span>{t.navUploadReport}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          భూసార పరీక్ష రిపోర్టు అప్‌లోడ్ (Upload Soil Report)
        </h1>
        <p className="text-gray-600 text-lg">
          Upload your official laboratory Soil Health Card in PDF, JPG, or PNG format. Our system will extract the N-P-K and pH readings for your review.
        </p>

        <VoiceAssistant
          textToSpeak={
            language === 'te'
              ? 'మీ భూసార పరీక్ష కాగితాన్ని ఫోటో తీసి లేదా పిడిఎఫ్ ఫైల్ అప్‌లోడ్ చేయండి. అందులోని విలువలను మీరు స్వయంగా సరిచూసుకోవచ్చు.'
              : 'Upload your soil test document in PDF or photo format. You can verify and edit the extracted numbers.'
          }
        />
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      {!extractedData && (
        <div className="farmer-card p-8 bg-white border-dashed border-4 border-emerald-300 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900">
              Select or Drag File Here / ఫైల్ ఎంచుకోండి
            </h3>
            <p className="text-gray-600 text-base">
              Accepted: PDF, PNG, JPG (Maximum size: 5 MB)
            </p>
          </div>

          <input
            type="file"
            id="file-upload"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <label
            htmlFor="file-upload"
            className="inline-block cursor-pointer px-6 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-lg shadow-md transition-all active:scale-95"
          >
            {selectedFile ? `Selected: ${selectedFile.name}` : '📁 Choose File from Device / ఫోటో ఎంచుకోండి'}
          </label>

          {selectedFile && (
            <div className="pt-4">
              <BigButton
                onClick={handleUpload}
                disabled={uploading}
                variant="accent"
                className="w-full sm:w-auto mx-auto text-xl"
                icon={<Upload className="w-7 h-7 text-emerald-950" />}
              >
                {uploading ? 'Analyzing Document (పరిశీలిస్తున్నాము)...' : 'Upload & Extract Values (వివరాలు గుర్తించు)'}
              </BigButton>
            </div>
          )}

          <div className="text-xs text-gray-500 flex items-center justify-center gap-1.5 pt-4 border-t">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Reports are stored securely and never made accessible publicly.</span>
          </div>
        </div>
      )}

      {/* Editable Confirmation Form (Critical requirement!) */}
      {extractedData && (
        <div className="farmer-card p-8 bg-white space-y-6 border-emerald-500 shadow-lg">
          <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border-2 border-amber-300">
            <AlertTriangle className="w-7 h-7 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950 text-lg">
                Farmer Verification Required / వివరాలు సరిచూసుకోండి
              </h4>
              <p className="text-amber-900 text-base">
                {statusMessage ||
                  'Please verify the extracted nutrient numbers against your physical report before generating recommendations.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleConfirmAndProceed} className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-emerald-700" />
              <span>Extracted Soil Values (Editable)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  Nitrogen (N) - mg/kg
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={extractedData.nitrogen}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, nitrogen: e.target.value })
                  }
                  className="w-full px-4 py-3.5 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  Phosphorus (P) - mg/kg
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={extractedData.phosphorus}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, phosphorus: e.target.value })
                  }
                  className="w-full px-4 py-3.5 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  Potassium (K) - mg/kg
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={extractedData.potassium}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, potassium: e.target.value })
                  }
                  className="w-full px-4 py-3.5 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  Soil pH (0 – 14)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  required
                  value={extractedData.soil_ph}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, soil_ph: e.target.value })
                  }
                  className="w-full px-4 py-3.5 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                Testing Center / ల్యాబ్
              </label>
              <input
                type="text"
                value={extractedData.lab_name}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, lab_name: e.target.value })
                }
                className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-gray-300 focus:border-emerald-600"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <BigButton
                type="submit"
                variant="primary"
                className="flex-1 text-xl"
                icon={<ArrowRight className="w-7 h-7" />}
              >
                Confirm & Generate Recommendations
              </BigButton>

              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl text-lg"
              >
                Upload Another Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
