import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../i18n/en';
import { te } from '../i18n/te';
import { hi } from '../i18n/hi';

type Language = 'en' | 'te' | 'hi';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const translations: Record<Language, Translations> = {
  en,
  te,
  hi
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('krishi_language') as Language;
    return saved && ['en', 'te', 'hi'].includes(saved) ? saved : 'te'; // Default to Telugu for local farmers
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('krishi_language', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
