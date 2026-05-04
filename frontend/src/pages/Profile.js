import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, MapPin, Crop, Bell, Settings, Globe, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile: saveProfileToApi } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || 'Farmer Name',
    location: user?.location || '',
    language: user?.language || i18n.language,
    crops: user?.crops?.length ? user.crops : ['Rice', 'Coconut', 'Banana'],
    notifications: user?.notifications || { weather: true, advisories: true, diseases: true, market: false }
  });

  const [tempProfile, setTempProfile] = useState(profile);

  useEffect(() => {
    if (!user) return;
    const nextProfile = {
      name: user.name || 'Farmer Name',
      location: user.location || '',
      language: user.language || i18n.language,
      crops: user.crops?.length ? user.crops : ['Rice', 'Coconut', 'Banana'],
      notifications: user.notifications || { weather: true, advisories: true, diseases: true, market: false }
    };
    setProfile(nextProfile);
    setTempProfile(nextProfile);
  }, [user, i18n.language]);

  const handleEdit = () => {
    setTempProfile(profile);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const updated = await saveProfileToApi(tempProfile);
      setProfile({
        name: updated.name || '',
        location: updated.location || '',
        language: updated.language || i18n.language,
        crops: updated.crops || [],
        notifications: updated.notifications || tempProfile.notifications
      });
      i18n.changeLanguage(tempProfile.language);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (key, value) => {
    setTempProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const addCrop = (crop) => {
    if (crop && !tempProfile.crops.includes(crop)) {
      setTempProfile(prev => ({
        ...prev,
        crops: [...prev.crops, crop]
      }));
    }
  };

  const removeCrop = (crop) => {
    setTempProfile(prev => ({
      ...prev,
      crops: prev.crops.filter(c => c !== crop)
    }));
  };

  const commonCrops = [
    'Rice', 'Wheat', 'Maize', 'Coconut', 'Banana', 'Tapioca', 
    'Rubber', 'Tea', 'Coffee', 'Spices', 'Vegetables', 'Fruits'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t('profile.title')}
        </h1>
        <p className="text-gray-600">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <User className="mr-2 text-green-600" size={24} />
            Personal Information
          </h2>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-1"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={tempProfile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                {profile.name}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="mr-1" size={16} />
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={tempProfile.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                {profile.location || 'Not set'}
              </div>
            )}
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Globe className="mr-1" size={16} />
              {t('profile.language')}
            </label>
            {isEditing ? (
              <select
                value={tempProfile.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ml">മലയാളം</option>
                <option value="mr">मराठी</option>
              </select>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                {t(`languages.${profile.language}`)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Crops */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Crop className="mr-2 text-green-600" size={24} />
          {t('profile.crops')}
        </h2>

        <div className="space-y-4">
          {/* Current Crops */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Crops
            </label>
            <div className="flex flex-wrap gap-2">
              {tempProfile.crops.map((crop, index) => (
                <div
                  key={index}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{crop}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeCrop(crop)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Crops */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Crops
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonCrops
                  .filter(crop => !tempProfile.crops.includes(crop))
                  .map((crop, index) => (
                    <button
                      key={index}
                      onClick={() => addCrop(crop)}
                      className="bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      + {crop}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Bell className="mr-2 text-green-600" size={24} />
          {t('profile.notifications')}
        </h2>

        <div className="space-y-4">
          {Object.entries(tempProfile.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800 capitalize">
                  {key.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-600">
                  {key === 'weather' && 'Weather updates and alerts'}
                  {key === 'advisories' && 'Agricultural advisories and recommendations'}
                  {key === 'diseases' && 'Disease outbreak notifications'}
                  {key === 'market' && 'Market prices and trends'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Settings className="mr-2 text-green-600" size={24} />
          {t('profile.settings')}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-800">Data Usage</div>
              <div className="text-sm text-gray-600">Optimize for low bandwidth</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-800">Voice Recognition</div>
              <div className="text-sm text-gray-600">Enable voice input for queries</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-800">Location Services</div>
              <div className="text-sm text-gray-600">Use location for weather and local advisories</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
