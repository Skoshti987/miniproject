import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('languages.en'), flag: '🇬🇧' },
    { code: 'hi', name: t('languages.hi'), flag: '🇮🇳' },
    { code: 'mr', name: t('languages.mr'), flag: '🇮🇳' },
    { code: 'ml', name: t('languages.ml'), flag: '🇮🇳' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-20 right-4 z-40">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-white rounded-lg shadow-md px-3.5 py-2 border border-gray-200 hover:shadow-lg transition-all"
        >
          <Globe size={18} className="text-emerald-600" />
          <span className="text-sm font-semibold">{currentLanguage.flag}</span>
          <span className="text-sm font-bold text-gray-800">{currentLanguage.name}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  i18n.language === language.code
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">{language.flag}</span>
                  <span>{language.name}</span>
                </div>
                {i18n.language === language.code && (
                  <Check size={16} className="text-emerald-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;
