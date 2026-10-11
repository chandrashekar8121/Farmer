import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-white/90 p-1.5 rounded-xl border border-emerald-700/20 shadow-sm">
      <Globe className="w-5 h-5 text-emerald-700 ml-1.5 hidden sm:inline" />
      <button
        type="button"
        onClick={() => setLanguage('te')}
        className={`px-3 py-1.5 rounded-lg text-sm sm:text-base font-bold transition-all ${
          language === 'te'
            ? 'bg-emerald-700 text-white shadow-sm'
            : 'text-gray-700 hover:bg-emerald-50'
        }`}
        aria-label="తెలుగు భాషను ఎంచుకోండి"
      >
        తెలుగు
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-sm sm:text-base font-bold transition-all ${
          language === 'en'
            ? 'bg-emerald-700 text-white shadow-sm'
            : 'text-gray-700 hover:bg-emerald-50'
        }`}
        aria-label="Select English language"
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-3 py-1.5 rounded-lg text-sm sm:text-base font-bold transition-all ${
          language === 'hi'
            ? 'bg-emerald-700 text-white shadow-sm'
            : 'text-gray-700 hover:bg-emerald-50'
        }`}
        aria-label="हिंदी भाषा चुनें"
      >
        हिंदी
      </button>
    </div>
  );
};
