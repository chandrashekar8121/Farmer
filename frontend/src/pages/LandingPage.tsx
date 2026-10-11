import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Sparkles, FlaskConical, CloudSun, Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { VoiceAssistant } from '../components/VoiceAssistant';

export const LandingPage: React.FC = () => {
  const { t, language } = useLanguage();

  const welcomeVoiceText =
    language === 'te'
      ? 'కృషి సాథి కి స్వాగతం. మీ భూసార పరీక్ష వివరాలు నమోదు చేసి సరైన పంట, మరియు ఎరువుల మోతాదును తెలుసుకోండి.'
      : language === 'hi'
      ? 'कृषि साथी में आपका स्वागत है। अपनी मिट्टी की जांच विवरण दर्ज करें और सही फसल और खाद की जानकारी प्राप्त करें।'
      : 'Welcome to Krishi Saathi. Enter your soil test details to get AI crop suggestions and official fertilizer dosages.';

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-emerald-800 to-emerald-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border-4 border-emerald-950 relative overflow-hidden">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-700/80 px-4 py-2 rounded-full text-emerald-100 text-sm sm:text-base font-bold border border-emerald-600">
            <Sprout className="w-5 h-5 text-amber-300" />
            <span>AI Agricultural Assistant for Farmers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-white">
            {t.heroTitle}
          </h1>

          <p className="text-emerald-100 text-lg sm:text-2xl leading-relaxed font-medium">
            {t.heroSubtitle}
          </p>

          {/* Voice Prompt for Elders */}
          <div className="pt-2">
            <VoiceAssistant textToSpeak={welcomeVoiceText} />
          </div>

          {/* Large Touch Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/soil-input">
              <BigButton
                variant="accent"
                icon={<ArrowRight className="w-7 h-7 text-emerald-950" />}
                className="w-full sm:w-auto text-xl"
              >
                {t.heroStartBtn}
              </BigButton>
            </Link>
            <Link to="/login">
              <BigButton
                variant="secondary"
                icon={<Sprout className="w-7 h-7 text-emerald-700" />}
                className="w-full sm:w-auto text-xl"
              >
                {t.heroLoginBtn}
              </BigButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="farmer-card p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mb-4">
              <FlaskConical className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">భూసార పరీక్ష (Soil Health)</h2>
            <p className="text-gray-700 text-base leading-relaxed">
              Enter N, P, K and pH values manually or upload your laboratory Soil Health Card PDF/photo.
            </p>
          </div>
          <Link to="/soil-input" className="mt-4 text-emerald-700 font-bold flex items-center gap-1 hover:underline">
            <span>Start soil analysis</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="farmer-card p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">AI పంటల సలహా (Crop Advice)</h2>
            <p className="text-gray-700 text-base leading-relaxed">
              Machine learning model trained on 2,200 ICAR benchmark samples recommends the best crop for your soil.
            </p>
          </div>
          <Link to="/crop-recommendation" className="mt-4 text-emerald-700 font-bold flex items-center gap-1 hover:underline">
            <span>Get crop suggestions</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="farmer-card p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-green-100 text-green-800 rounded-2xl flex items-center justify-center mb-4">
              <Sprout className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">ఎరువుల లెక్క (Fertilizer Doses)</h2>
            <p className="text-gray-700 text-base leading-relaxed">
              Exact DAP, Urea, and MOP bags calculated for your field size with subsidized government prices.
            </p>
          </div>
          <Link to="/fertilizer-recommendation" className="mt-4 text-emerald-700 font-bold flex items-center gap-1 hover:underline">
            <span>Calculate bags & costs</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="farmer-card p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center mb-4">
              <CloudSun className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">వాతావరణం & పిచికారీ (Spray Alert)</h2>
            <p className="text-gray-700 text-base leading-relaxed">
              Clear advice on whether it is safe to spray fertilizer today based on rain probability and wind speed.
            </p>
          </div>
          <Link to="/weather" className="mt-4 text-emerald-700 font-bold flex items-center gap-1 hover:underline">
            <span>Check spray advisory</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Family Helper & Voice Assistant Highlight */}
      <section className="bg-amber-100/70 border-2 border-amber-300 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="w-20 h-20 bg-amber-500 text-white rounded-3xl flex items-center justify-center flex-shrink-0 shadow-md">
          <Users className="w-10 h-10" />
        </div>
        <div className="space-y-2 flex-1">
          <h2 className="text-2xl sm:text-3xl font-black text-amber-950">
            {t.familyTitle}
          </h2>
          <p className="text-amber-900 text-lg leading-relaxed">
            {t.familySubtitle}
          </p>
        </div>
        <Link to="/family">
          <BigButton variant="primary" className="whitespace-nowrap text-lg">
            {t.navFamily}
          </BigButton>
        </Link>
      </section>
    </div>
  );
};
