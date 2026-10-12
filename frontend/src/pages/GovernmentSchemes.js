import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ExternalLink, ShieldCheck, Building2, IndianRupee, Droplet, Sprout, Truck, RefreshCw } from 'lucide-react';
import schemesData from '../data/governmentSchemes.json';

const GovernmentSchemes = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGov, setSelectedGov] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [farmerState, setFarmerState] = useState('Maharashtra');
  const [farmerDistrict, setFarmerDistrict] = useState('Kolhapur');

  const categories = [
    'All',
    'Farmer Income Support',
    'Insurance',
    'Irrigation',
    'Loans / Financial Support',
    'Equipment',
    'Soil / Fertilizer'
  ];

  // Helper function to get localized text for a scheme
  const getSchemeField = (scheme, field) => {
    if (scheme.translations && scheme.translations[currentLang] && scheme.translations[currentLang][field]) {
      return scheme.translations[currentLang][field];
    }
    // Fallback if currentLang starts with mr, hi, etc.
    const langPrefix = currentLang.split('-')[0];
    if (scheme.translations && scheme.translations[langPrefix] && scheme.translations[langPrefix][field]) {
      return scheme.translations[langPrefix][field];
    }
    return scheme[field];
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Farmer Income Support':
        return <IndianRupee size={18} className="text-emerald-600" />;
      case 'Insurance':
        return <ShieldCheck size={18} className="text-blue-600" />;
      case 'Irrigation':
        return <Droplet size={18} className="text-cyan-600" />;
      case 'Loans / Financial Support':
        return <Building2 size={18} className="text-purple-600" />;
      case 'Equipment':
        return <Truck size={18} className="text-orange-600" />;
      default:
        return <Sprout size={18} className="text-green-600" />;
    }
  };

  const filteredSchemes = useMemo(() => {
    return schemesData.filter((scheme) => {
      const localizedName = getSchemeField(scheme, 'name') || '';
      const localizedDesc = getSchemeField(scheme, 'description') || '';
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        q === '' ||
        scheme.name.toLowerCase().includes(q) ||
        localizedName.toLowerCase().includes(q) ||
        scheme.description.toLowerCase().includes(q) ||
        localizedDesc.toLowerCase().includes(q) ||
        scheme.category.toLowerCase().includes(q) ||
        scheme.government.toLowerCase().includes(q);

      const matchesGov =
        selectedGov === 'All' || scheme.government.toLowerCase() === selectedGov.toLowerCase();

      const matchesCategory =
        selectedCategory === 'All' || scheme.category === selectedCategory;

      return matchesSearch && matchesGov && matchesCategory;
    });
  }, [searchQuery, selectedGov, selectedCategory, currentLang]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-emerald-900/80 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-3 inline-block border border-emerald-500/30">
            🏛️ {t('schemes.title')}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            {t('schemes.title')}
          </h1>
          <p className="text-emerald-100 text-base md:text-lg max-w-3xl leading-relaxed">
            {t('schemes.subtitle')}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('schemes.searchPlaceholder')}
            className="w-full p-4 pl-12 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base text-gray-800"
          />
          <Search size={22} className="absolute left-4 top-4 text-gray-400" />
        </div>

        {/* Farmer State & District Selector Bar */}
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <span>📍 {t('schemes.labels.location', { defaultValue: 'शेतकरी स्थान / ठिकाण' })}:</span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-800">
              {farmerDistrict}, {farmerState}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 font-medium text-gray-700">
              <span>{t('schemes.labels.state', { defaultValue: 'राज्य' })}:</span>
              <select
                value={farmerState}
                onChange={(e) => setFarmerState(e.target.value)}
                className="p-1 border border-gray-300 rounded text-xs bg-white text-gray-800 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (उत्तर प्रदेश)</option>
                <option value="Karnataka">Karnataka (कर्नाटक)</option>
                <option value="Tamil Nadu">Tamil Nadu (தமிழ்நாடு)</option>
                <option value="All India">All India / इतर राज्ये</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 font-medium text-gray-700">
              <span>{t('schemes.labels.district', { defaultValue: 'जिल्हा' })}:</span>
              <select
                value={farmerDistrict}
                onChange={(e) => setFarmerDistrict(e.target.value)}
                className="p-1 border border-gray-300 rounded text-xs bg-white text-gray-800 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Kolhapur">Kolhapur (कोल्हापूर)</option>
                <option value="Pune">Pune (पुणे)</option>
                <option value="Sangli">Sangli (सांगली)</option>
                <option value="Satara">Satara (सातारा)</option>
                <option value="Solapur">Solapur (सोलापूर)</option>
                <option value="Ahmednagar">Ahmednagar (अहमदनगर)</option>
                <option value="Nashik">Nashik (नाशिक)</option>
                <option value="Other">{t('schemes.labels.otherDistrict', { defaultValue: 'इतर जिल्हा' })}</option>
              </select>
            </label>

            <span className="text-emerald-700 font-semibold hidden sm:inline">
              ✓ {t('schemes.labels.showingEligible', { defaultValue: 'पात्र योजना व लाभ दाखवत आहे' })}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          {/* Government Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter size={14} /> {t('schemes.labels.government')}:
            </span>
            {['All', 'Central', 'Maharashtra'].map((gov) => (
              <button
                key={gov}
                onClick={() => setSelectedGov(gov)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedGov === gov
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {gov === 'All'
                  ? t('schemes.allGovernments')
                  : gov === 'Central'
                  ? t('schemes.centralGov')
                  : t('schemes.stateGov')}
              </button>
            ))}
          </div>

          {/* Category Dropdown/Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              {t('schemes.labels.category')}:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? t('schemes.allCategories') : t(`schemes.categories.${cat}`, { defaultValue: cat })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:border-emerald-200 transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    scheme.government === 'Central'
                      ? 'bg-orange-50 text-orange-800 border-orange-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {scheme.government === 'Central' ? t('schemes.centralGov') : t('schemes.stateGov')}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {getCategoryIcon(scheme.category)}
                    <span>{t(`schemes.categories.${scheme.category}`, { defaultValue: getSchemeField(scheme, 'category') || scheme.category })}</span>
                  </span>
                </div>

                {/* Scheme Title & Description */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-snug mb-2">
                    {getSchemeField(scheme, 'name')}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {getSchemeField(scheme, 'description')}
                  </p>
                </div>

                {/* Eligibility */}
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    {t('schemes.labels.eligibility')}
                  </h4>
                  <ul className="space-y-1">
                    {(getSchemeField(scheme, 'eligibility') || []).map((el, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-700">
                        <span className="text-emerald-600 font-bold mr-1.5">•</span>
                        <span>{el}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                    {t('schemes.labels.benefits')}
                  </h4>
                  <ul className="space-y-1">
                    {(getSchemeField(scheme, 'benefits') || []).map((ben, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-800">
                        <span className="text-emerald-600 font-bold mr-1.5">✓</span>
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How to Apply */}
                {getSchemeField(scheme, 'howToApply') && (
                  <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                      {t('schemes.labels.howToApply')}
                    </h4>
                    <ul className="space-y-1">
                      {(getSchemeField(scheme, 'howToApply') || []).map((step, idx) => (
                        <li key={idx} className="flex items-start text-xs text-blue-900">
                          <span className="text-blue-600 font-bold mr-1.5">→</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-medium">
                  {t('schemes.verifiedOn')}: {scheme.lastVerified}
                </span>
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
                >
                  <span>{t('schemes.viewOfficialBtn')}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100 space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">{t('schemes.noMatch')}</h3>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGov('All');
              setSelectedCategory('All');
            }}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            <span>{t('schemes.clearSearch')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;
