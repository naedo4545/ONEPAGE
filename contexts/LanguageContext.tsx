import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ko } from '../locales/ko';
import { en } from '../locales/en';
import { ja } from '../locales/ja';

export type Language = 'ko' | 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string>) => string;
  tWithFallback: (key: string, fallback: string, variables?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ko,
  en,
  ja,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onepage-language') as Language;
      if (saved && ['ko', 'en', 'ja'].includes(saved)) {
        return saved;
      }
    }
    return 'ko';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('onepage-language', lang);
    }
  };

  const t = (key: string, variables?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    let result = typeof value === 'string' ? value : key;
    
    // Replace variables if provided
    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        result = result.replace(new RegExp(`{${varKey}}`, 'g'), varValue);
      });
    }
    
    return result;
  };

  const tWithFallback = (key: string, fallback: string, variables?: Record<string, string>): string => {
    const translation = t(key, variables);
    return translation !== key ? translation : fallback;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tWithFallback }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
