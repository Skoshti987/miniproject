import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Layers, 
  Save, 
  Edit3, 
  X, 
  Globe
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SUGARCANE_VARIETIES = [
  'Co 86032 (Nayan)',
  'CoM 0265 (Phule 265)',
  'Co 0238 (Karan 4)',
  'Co 94012 (Phule Savitri)',
  'Co 11015',
  'MS 10001',
  'CoC 671',
  'Co 8014 (Mahalaxmi)',
  'VSI 434',
  'Other Local Variety'
];

const MAHARASHTRA_DISTRICTS = [
  'Kolhapur',
  'Sangli',
  'Satara',
  'Pune',
  'Solapur',
  'Ahmednagar',
  'Nashik',
  'Aurangabad (Chhatrapati Sambhajinagar)',
  'Jalna',
  'Beed',
  'Osmanabad (Dharashiv)',
  'Nanded',
  'Other District'
];

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile: saveProfileToContext } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // All 11 Required Fields + Preferences
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    state: 'Maharashtra',
    district: 'Kolhapur',
    village: '',
    farmLocation: '',
    totalLand: '0',
    sugarcaneArea: '0',
    sugarcaneVariety: 'Co 86032 (Nayan)',
    farmingExperience: '0',
    language: 'en',
    crops: ['Sugarcane'],
    notifications: {
      weather: true,
      advisories: true,
      diseases: true,
      market: false
    }
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api('/profile');
      if (res && res.user) {
        populateForm(res.user);
      } else if (user) {
        populateForm(user);
      }
    } catch (err) {
      console.warn('Could not fetch /profile directly, falling back to auth user:', err.message);
      if (user) populateForm(user);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data) => {
    setFormData({
      name: data.name || '',
      email: data.email || '',
      mobileNumber: data.mobileNumber || '',
      state: data.state || 'Maharashtra',
      district: data.district || 'Kolhapur',
      village: data.village || '',
      farmLocation: data.farmLocation || '',
      totalLand: String(data.totalLand || '0'),
      sugarcaneArea: String(data.sugarcaneArea || '0'),
      sugarcaneVariety: data.sugarcaneVariety || 'Co 86032 (Nayan)',
      farmingExperience: String(data.farmingExperience || '0'),
      language: data.language || i18n.language || 'en',
      crops: data.crops?.length ? data.crops : ['Sugarcane'],
      notifications: data.notifications || {
        weather: true,
        advisories: true,
        diseases: true,
        market: false
      }
    });
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = t('profile.valNameRequired', { defaultValue: 'Full name is required' });
    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) {
      errors.mobileNumber = t('profile.valMobileInvalid', { defaultValue: 'Please enter a valid 10-digit mobile number' });
    }
    if (Number(formData.totalLand) < 0) errors.totalLand = t('profile.valLandNegative', { defaultValue: 'Land area cannot be negative' });
    if (Number(formData.sugarcaneArea) < 0) errors.sugarcaneArea = t('profile.valAreaNegative', { defaultValue: 'Sugarcane area cannot be negative' });
    if (Number(formData.sugarcaneArea) > Number(formData.totalLand) && Number(formData.totalLand) > 0) {
      errors.sugarcaneArea = t('profile.valAreaExceed', { defaultValue: 'Sugarcane area cannot exceed total agricultural land' });
    }
    if (Number(formData.farmingExperience) < 0) errors.farmingExperience = t('profile.valExpNegative', { defaultValue: 'Experience cannot be negative' });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNotificationToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t('profile.validationErrors', { defaultValue: 'Please correct the validation errors before saving.' }));
      return;
    }

    try {
      setSaving(true);
      const res = await api('/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (res && res.user) {
        populateForm(res.user);
        if (saveProfileToContext) saveProfileToContext(res.user);
      }

      if (formData.language && formData.language !== i18n.language) {
        i18n.changeLanguage(formData.language);
      }

      setIsEditing(false);
      toast.success(t('profile.saveSuccess', { defaultValue: 'Farmer profile updated and saved to MongoDB successfully!' }));
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err?.message || t('profile.saveError', { defaultValue: 'Failed to update profile' }));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <User size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            {t('profile.signInRequiredTitle', { defaultValue: 'Sign In to Access Farmer Profile' })}
          </h2>
          <p className="text-gray-600 max-w-md mx-auto text-base">
            {t('profile.signInRequiredDesc', { defaultValue: 'Save your farm location, sugarcane varieties, land acreage, and preferences permanently to receive personalized advisories and disease tracking.' })}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all"
            >
              {t('profile.signInBtn', { defaultValue: 'Sign In to My Profile' })}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 rounded-3xl shadow-xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="bg-emerald-900/80 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-2 inline-block border border-emerald-500/30">
            {t('profile.headerBadge', { defaultValue: '🌾 Farmer Profile & Agronomic Data' })}
          </span>
          <h1 className="text-3xl font-black">
            {formData.name || t('profile.defaultTitle', { defaultValue: 'Farmer Profile' })}
          </h1>
          <p className="text-emerald-100 text-sm">
            {formData.village ? `${formData.village}, ` : ''}{formData.district}, {formData.state}
          </p>
        </div>

        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl shadow transition-all flex items-center space-x-2 text-sm"
            >
              <Edit3 size={16} />
              <span>{t('profile.editBtn', { defaultValue: 'Edit Farm Profile' })}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                loadProfile();
              }}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 text-sm"
            >
              <X size={16} />
              <span>{t('profile.cancelBtn', { defaultValue: 'Cancel' })}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Form Card */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* SECTION 1: Personal Details */}
          <div>
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
              <User size={18} className="text-emerald-600" />
              <span>{t('profile.section1', { defaultValue: '1. Farmer Personal Information' })}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.fullName', { defaultValue: 'Full Name' })} *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('profile.fullNamePlaceholder', { defaultValue: 'Enter full name' })}
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium`}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 font-semibold text-sm border border-gray-100">
                    {formData.name || t('profile.notProvided', { defaultValue: 'Not provided' })}
                  </div>
                )}
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.email', { defaultValue: 'Email Address' })}
                </label>
                <div className="p-3 bg-gray-50 rounded-xl text-gray-600 text-sm border border-gray-100 font-medium">
                  {formData.email}
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.mobileNumber', { defaultValue: 'Mobile Number' })}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => handleChange('mobileNumber', e.target.value)}
                    placeholder={t('profile.mobilePlaceholder', { defaultValue: 'e.g. 9876543210' })}
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.mobileNumber ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium`}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.mobileNumber || t('profile.notProvided', { defaultValue: 'Not provided' })}
                  </div>
                )}
                {formErrors.mobileNumber && <p className="text-xs text-red-600 mt-1">{formErrors.mobileNumber}</p>}
              </div>

              {/* Farming Experience */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.farmingExperience', { defaultValue: 'Farming Experience (Years)' })}
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="80"
                    value={formData.farmingExperience}
                    onChange={(e) => handleChange('farmingExperience', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.farmingExperience} {t('profile.years', { defaultValue: 'Years' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Location & Address */}
          <div>
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
              <MapPin size={18} className="text-emerald-600" />
              <span>{t('profile.section2', { defaultValue: '2. Farm Location & Region' })}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* State */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.state', { defaultValue: 'State' })}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.state}
                  </div>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.district', { defaultValue: 'District' })}
                </label>
                {isEditing ? (
                  <select
                    value={formData.district}
                    onChange={(e) => handleChange('district', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium bg-white"
                  >
                    {MAHARASHTRA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.district}
                  </div>
                )}
              </div>

              {/* Village */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.village', { defaultValue: 'Village / Gram Panchayat' })}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => handleChange('village', e.target.value)}
                    placeholder={t('profile.villagePlaceholder', { defaultValue: 'e.g. Shirol, Hatkanangale, Karveer' })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.village || t('profile.notSpecified', { defaultValue: 'Not specified' })}
                  </div>
                )}
              </div>

              {/* Farm Location / Survey No. */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.farmLocation', { defaultValue: 'Farm Location / Survey No.' })}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.farmLocation}
                    onChange={(e) => handleChange('farmLocation', e.target.value)}
                    placeholder={t('profile.farmLocationPlaceholder', { defaultValue: 'e.g. Survey No. 199, Gat No. 45' })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.farmLocation || t('profile.notSpecified', { defaultValue: 'Not specified' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Farm Land & Sugarcane Cultivation Data */}
          <div>
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
              <Layers size={18} className="text-emerald-600" />
              <span>{t('profile.section3', { defaultValue: '3. Sugarcane Cultivation & Land Holdings' })}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total Agricultural Land */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.totalLand', { defaultValue: 'Total Agricultural Land (Acres)' })}
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.totalLand}
                    onChange={(e) => handleChange('totalLand', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.totalLand ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium`}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.totalLand} {t('profile.acres', { defaultValue: 'Acres' })}
                  </div>
                )}
                {formErrors.totalLand && <p className="text-xs text-red-600 mt-1">{formErrors.totalLand}</p>}
              </div>

              {/* Sugarcane Cultivation Area */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.sugarcaneArea', { defaultValue: 'Sugarcane Cultivation Area (Acres)' })}
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.sugarcaneArea}
                    onChange={(e) => handleChange('sugarcaneArea', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.sugarcaneArea ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium`}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.sugarcaneArea} {t('profile.acres', { defaultValue: 'Acres' })}
                  </div>
                )}
                {formErrors.sugarcaneArea && <p className="text-xs text-red-600 mt-1">{formErrors.sugarcaneArea}</p>}
              </div>

              {/* Sugarcane Variety */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.sugarcaneVariety', { defaultValue: 'Primary Sugarcane Variety' })}
                </label>
                {isEditing ? (
                  <select
                    value={formData.sugarcaneVariety}
                    onChange={(e) => handleChange('sugarcaneVariety', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium bg-white"
                  >
                    {SUGARCANE_VARIETIES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-950 text-sm rounded-xl border border-emerald-200 font-extrabold">
                    🌱 {formData.sugarcaneVariety}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: Language & Notification Preferences */}
          <div>
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
              <Globe size={18} className="text-emerald-600" />
              <span>{t('profile.section4', { defaultValue: '4. App Language & Notification Preferences' })}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('profile.preferredLanguage', { defaultValue: 'Preferred Language' })}
                </label>
                {isEditing ? (
                  <select
                    value={formData.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium bg-white"
                  >
                    <option value="en">English (English)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="ml">മലയാളം (Malayalam)</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 text-sm border border-gray-100 font-semibold">
                    {formData.language === 'mr' ? 'मराठी (Marathi)' : formData.language === 'hi' ? 'हिंदी (Hindi)' : formData.language === 'ml' ? 'മലയാളം (Malayalam)' : 'English'}
                  </div>
                )}
              </div>

              {/* Notification Toggles */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('profile.activeAlerts', { defaultValue: 'Active Alerts' })}
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.weather}
                      disabled={!isEditing}
                      onChange={() => handleNotificationToggle('weather')}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>{t('profile.weatherAlerts', { defaultValue: 'Weather Alerts' })}</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.diseases}
                      disabled={!isEditing}
                      onChange={() => handleNotificationToggle('diseases')}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>{t('profile.diseaseWarnings', { defaultValue: 'Disease Warnings' })}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons in Edit Mode */}
          {isEditing && (
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  loadProfile();
                }}
                className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
              >
                {t('profile.cancelBtn', { defaultValue: 'Cancel' })}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center space-x-2 disabled:bg-gray-400"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('profile.savingBtn', { defaultValue: 'Saving to MongoDB...' })}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{t('profile.saveBtn', { defaultValue: 'Save Farm Profile' })}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
