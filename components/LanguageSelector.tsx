import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  onLanguageSelect?: (language: Language) => void;
  showAsModal?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelect, showAsModal = false }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'ko' as Language, name: t('language.korean'), flag: '🇰🇷' },
    { code: 'en' as Language, name: t('language.english'), flag: '🇺🇸' },
    { code: 'ja' as Language, name: t('language.japanese'), flag: '🇯🇵' },
  ];

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    onLanguageSelect?.(lang);
  };

  if (showAsModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#282728] p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">ONEPAGE</h1>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('language.selectLanguage')}
            </h2>
            <p className="text-gray-600 dark:text-neutral-400">
              {t('language.chooseLanguage')}
            </p>
          </div>

          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 ${
                  language === lang.code
                    ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-neutral-800'
                    : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {lang.name}
                </span>
                {language === lang.code && (
                  <i className="fa-solid fa-check text-gray-900 dark:text-white ml-auto"></i>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => handleLanguageSelect(e.target.value as Language)}
        className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;

