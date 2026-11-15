import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const LanguageSelector = ({ variant = 'floating' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧', region: 'Global' },
    { code: 'mr', label: 'मराठी (Marathi)', flag: '🇮🇳', region: 'महाराष्ट्र' },
    { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳', region: 'भारत' },
    { code: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳', region: 'കേരളം' },
  ];

  const activeLangCode = (i18n.language || 'en').substring(0, 2).toLowerCase();
  const currentLanguage = languages.find(lang => lang.code === activeLangCode) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode;
    }
    setIsOpen(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'nav') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm"
          title="Change Application Language"
        >
          <Globe size={14} className="text-emerald-700" />
          <span>{currentLanguage.flag}</span>
          <span className="hidden sm:inline font-bold">{currentLanguage.label.split(' ')[0]}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in">
            <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-gray-100">
              Select Language / भाषा निवडा
            </div>
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${
                  activeLangCode === language.code
                    ? 'bg-emerald-50 text-emerald-900 font-extrabold'
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">{language.flag}</span>
                  <div className="text-left">
                    <div className="leading-tight">{language.label}</div>
                    <div className="text-[10px] text-gray-400">{language.region}</div>
                  </div>
                </div>
                {activeLangCode === language.code && (
                  <Check size={16} className="text-emerald-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Floating variant (bottom right corner or top right)
  return (
    <div className="fixed bottom-6 right-6 z-40" ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl px-4 py-2.5 border-2 border-emerald-500/40 hover:border-emerald-600 hover:shadow-2xl transition-all group scale-100 hover:scale-105"
          title="Select Language / भाषा बदला"
        >
          <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Globe size={18} />
          </div>
          <span className="text-base">{currentLanguage.flag}</span>
          <div className="text-left">
            <div className="text-xs font-black text-gray-900">{currentLanguage.label.split(' ')[0]}</div>
            <div className="text-[10px] text-emerald-700 font-bold leading-none">Language</div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute bottom-14 right-0 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 overflow-hidden animate-fade-in">
            <div className="px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800 border-b border-gray-100 bg-emerald-50/50 flex items-center justify-between">
              <span>भाषा निवडा / Select</span>
              <span className="text-[10px] font-normal text-gray-500">४ भाषा</span>
            </div>
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors ${
                  activeLangCode === language.code
                    ? 'bg-emerald-50 text-emerald-900 font-extrabold'
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{language.flag}</span>
                  <div className="text-left">
                    <div className="font-bold">{language.label}</div>
                    <div className="text-[10px] text-gray-400">{language.region}</div>
                  </div>
                </div>
                {activeLangCode === language.code && (
                  <Check size={18} className="text-emerald-600 shrink-0" />
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
