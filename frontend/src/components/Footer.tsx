import React from 'react';
import { Phone, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-emerald-950 text-emerald-200 border-t-4 border-emerald-800 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{t.appName}</h3>
            <p className="text-emerald-300 text-base leading-relaxed">
              {t.appTagline}
            </p>
            <p className="text-xs text-emerald-400 mt-2">
              Based on official ICAR and TNAU agronomic standards.
            </p>
          </div>

          <div className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-800">
            <div className="flex items-center gap-3 text-white font-bold text-lg mb-1">
              <Phone className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <span>Kisan Call Center (Toll Free)</span>
            </div>
            <p className="text-2xl font-black text-amber-300 tracking-wide">
              1800-180-1551
            </p>
            <p className="text-xs text-emerald-300 mt-1">
              Call free from any mobile phone in India for direct expert agricultural advice.
            </p>
          </div>

          <div className="text-sm space-y-2 text-emerald-300 md:text-right">
            <div className="flex items-center md:justify-end gap-1.5 text-white font-medium">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Free & Open Source Agricultural Tool</span>
            </div>
            <p>© 2026 Krishi Saathi. Empowering farmers with accessible technology.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
