import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye, Sprout, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Weather = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Smart Irrigation Assistant Form States
  const [irrStage, setIrrStage] = useState('tillering');
  const [irrDays, setIrrDays] = useState('6');
  const [irrSoil, setIrrSoil] = useState('loam');
  const [irrObs, setIrrObs] = useState('dryCracked');
  const [irrRecentRain, setIrrRecentRain] = useState('no');
  const [irrPhotoPreview, setIrrPhotoPreview] = useState(null);
  const [irrRec, setIrrRec] = useState(null);

  const calculateIrrigation = (e) => {
    e.preventDefault();

    // Check weather forecast for upcoming rain
    const upcomingRainDay = forecast.find((d) => d.rainfall >= 10);
    const totalForecastRain = forecast.reduce((acc, d) => acc + (d.rainfall || 0), 0);
    const daysSince = parseInt(irrDays, 10) || 0;
    const temp = weatherData?.temperature || 30;

    let outcomeKey = 'insufficient';
    let reasons = [];

    if (irrRecentRain === 'yes' || irrObs === 'wetPuddled') {
      outcomeKey = 'avoidWet';
      reasons.push('Field was recently flooded or standing water was observed in furrows.');
      reasons.push('Additional watering now risks sugarcane root suffocation and fungal rotting.');
    } else if (upcomingRainDay || totalForecastRain >= 20) {
      outcomeKey = 'waitRain';
      reasons.push(`Rainfall (${upcomingRainDay ? upcomingRainDay.rainfall : totalForecastRain} mm) is forecasted in the next 2-3 days.`);
      reasons.push('Waiting saves groundwater and avoids waterlogging your sugarcane beds.');
    } else if (daysSince >= (irrSoil === 'sandy' ? 5 : irrSoil === 'clay' ? 9 : 7) || irrObs === 'dryCracked') {
      outcomeKey = 'needed';
      reasons.push(`It has been ${daysSince} days since the last irrigation in ${temp}°C conditions.`);
      reasons.push(irrObs === 'dryCracked' ? 'Visible leaf curling and surface drying indicate moisture stress in the active root zone.' : 'Soil water retention threshold reached for this soil type.');
      if (irrStage === 'tillering' || irrStage === 'grandGrowth') {
        reasons.push('Sugarcane is in a critical water-sensitive growth phase (tillering / cane elongation). Timely light irrigation maintains stalk elongation.');
      }
    } else {
      outcomeKey = 'avoidWet';
      reasons.push(`Irrigated ${daysSince} days ago on ${irrSoil} soil with moderate temperatures.`);
      reasons.push('Soil moisture remains adequate. Reassess in 2 to 3 days.');
    }

    setIrrRec({
      outcomeKey,
      reasons,
      stage: irrStage,
      soil: irrSoil,
      days: daysSince
    });
  };

  const handleAskIrrigationChatbot = () => {
    if (!irrRec) return;
    const prompt = `Based on my sugarcane crop in ${location || 'Maharashtra'}, soil=${irrSoil}, growth stage=${irrStage}, ${irrRec.days} days since last irrigation, KrishSathi advised: "${t(`irrigationAssistant.outcomes.${irrRec.outcomeKey}`)}". What are the specific best practices for water scheduling right now?`;
    navigate('/query', { state: { prefillQuery: prompt } });
  };

  useEffect(() => {
    fetchWeatherData(user?.location || 'India');
  }, [user?.location]);

  useEffect(() => {
    setLocationInput(user?.location || '');
  }, [user?.location]);

  const fetchWeatherData = async (selectedLocation) => {
    const q = selectedLocation?.trim() || 'India';
    setLoading(true);
    try {
      const data = await api(`/weather?location=${encodeURIComponent(q)}`);
      setWeatherData(data.current);
      setForecast(data.forecast || []);
      setAdvisory(data.advisory || null);
      setLocation(data.location || q);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.error(error?.message || 'Failed to fetch weather');
      setWeatherData(null);
      setForecast([]);
      setAdvisory(null);
      setLocation(q);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    fetchWeatherData(locationInput.trim() || user?.location || 'India');
  };

  const quickLocations = [user?.location, 'Pune, India', 'Nashik, India', 'Nagpur, India', 'Kolhapur, India']
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index);

  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
        return <Sun className="text-yellow-500" size={24} />;
      case 'partly cloudy':
        return <Cloud className="text-gray-500" size={24} />;
      case 'cloudy':
        return <Cloud className="text-gray-600" size={24} />;
      case 'rain':
      case 'heavy rain':
        return <CloudRain className="text-blue-500" size={24} />;
      default:
        return <Cloud className="text-gray-500" size={24} />;
    }
  };

  const getRainfallColor = (rainfall) => {
    if (rainfall > 20) return 'text-red-600';
    if (rainfall > 10) return 'text-orange-600';
    if (rainfall > 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('weather.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🌦️ {t('weather.title')}
        </h1>
        <p className="text-gray-600">
          {weatherData
            ? `${t('weather.advisory')} (${location})`
            : `${t('weather.searchPrompt')}${location ? ` (${location})` : ''}`}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4">
        <form onSubmit={handleLocationSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('weather.inputLabel')}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder={t('weather.inputPlaceholder')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors"
            >
              {t('weather.getBtn')}
            </button>
          </div>
        </form>

        {quickLocations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickLocations.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setLocationInput(loc);
                  fetchWeatherData(loc);
                }}
                className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-green-100 text-gray-700 transition-colors"
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current Weather */}
      {weatherData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Cloud className="mr-2 text-blue-500" size={28} />
            {t('weather.current')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getWeatherIcon(weatherData.condition)}
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-1">
                {weatherData.temperature}°C
              </div>
              <div className="text-gray-600 font-medium">{weatherData.condition}</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Droplets className="text-blue-500" size={20} />
                <div>
                  <div className="text-sm text-gray-600">{t('weather.humidity')}</div>
                  <div className="text-lg font-semibold text-gray-800">{weatherData.humidity}%</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CloudRain className="text-blue-500" size={20} />
                <div>
                  <div className="text-sm text-gray-600">{t('weather.rainfall')}</div>
                  <div className="text-lg font-semibold text-gray-800">{weatherData.rainfall} mm</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Wind className="text-gray-500" size={20} />
                <div>
                  <div className="text-sm text-gray-600">{t('weather.windSpeed')}</div>
                  <div className="text-lg font-semibold text-gray-800">{weatherData.windSpeed} km/h</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Eye className="text-gray-500" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Visibility</div>
                  <div className="text-lg font-semibold text-gray-800">{weatherData.visibility} km</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Forecast */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {t('weather.forecast')}
        </h2>
        
        <div className="space-y-3">
          {forecast.length === 0 && (
            <p className="text-gray-500 text-sm px-3 py-4">
              {weatherData ? 'No forecast rows returned.' : 'Use the search box above to load a forecast.'}
            </p>
          )}
          {forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-700">
                  {day.day}
                </div>
                <div className="flex items-center space-x-2">
                  {getWeatherIcon(day.condition)}
                  <span className="text-gray-600 font-medium">{day.condition}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Rainfall</div>
                  <div className={`font-semibold ${getRainfallColor(day.rainfall)}`}>
                    {day.rainfall} mm
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Temperature</div>
                  <div className="font-semibold text-gray-800">
                    {day.high}° / {day.low}°
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agricultural Advisory */}
      {advisory && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
            <Cloud className="mr-2" size={28} />
            {advisory.title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {advisory.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-3">Warnings</h3>
              <ul className="space-y-2">
                {advisory.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start space-x-2 text-red-800">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SMART IRRIGATION RECOMMENDATION CARD */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 rounded-2xl shadow-xl p-6 md:p-8 border border-emerald-200 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
              💧 {t('irrigationAssistant.cardTitle')}
            </span>
            <h3 className="text-xl md:text-2xl font-extrabold text-emerald-950">
              {t('irrigationAssistant.cardPrompt')}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-200/60 rounded-2xl flex items-center justify-center text-emerald-800 flex-shrink-0">
            <Sprout size={28} />
          </div>
        </div>

        <form onSubmit={calculateIrrigation} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/80 p-5 rounded-xl border border-emerald-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              {t('irrigationAssistant.growthStage')}
            </label>
            <select
              value={irrStage}
              onChange={(e) => setIrrStage(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="germination">{t('irrigationAssistant.stages.germination')}</option>
              <option value="tillering">{t('irrigationAssistant.stages.tillering')}</option>
              <option value="grandGrowth">{t('irrigationAssistant.stages.grandGrowth')}</option>
              <option value="ripening">{t('irrigationAssistant.stages.ripening')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              {t('irrigationAssistant.soilType')}
            </label>
            <select
              value={irrSoil}
              onChange={(e) => setIrrSoil(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="clay">{t('irrigationAssistant.soils.clay')}</option>
              <option value="loam">{t('irrigationAssistant.soils.loam')}</option>
              <option value="sandy">{t('irrigationAssistant.soils.sandy')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              {t('irrigationAssistant.lastIrrigation')}
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={irrDays}
              onChange={(e) => setIrrDays(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 7"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              {t('irrigationAssistant.recentRainfall')}
            </label>
            <select
              value={irrRecentRain}
              onChange={(e) => setIrrRecentRain(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="no">{t('common.no')}</option>
              <option value="yes">{t('common.yes')}</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              {t('irrigationAssistant.soilMoistureObs')}
            </label>
            <select
              value={irrObs}
              onChange={(e) => setIrrObs(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="dryCracked">{t('irrigationAssistant.obsOptions.dryCracked')}</option>
              <option value="moist">{t('irrigationAssistant.obsOptions.moist')}</option>
              <option value="wetPuddled">{t('irrigationAssistant.obsOptions.wetPuddled')}</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              {t('irrigationAssistant.optionalPhoto')}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setIrrPhotoPreview(URL.createObjectURL(file));
                }
              }}
              className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
            />
            {irrPhotoPreview && (
              <div className="mt-2 flex items-center gap-3">
                <img src={irrPhotoPreview} alt="Field preview" className="w-16 h-16 object-cover rounded-lg border border-gray-300" />
                <span className="text-xs text-gray-500">Image attached for farmer record.</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Droplets size={18} />
              <span>{t('irrigationAssistant.checkBtn')}</span>
            </button>
          </div>
        </form>

        {/* Irrigation Result Card */}
        {irrRec && (
          <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-md space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <CheckCircle2 size={24} className="text-emerald-600" />
              <div>
                <h4 className="text-lg font-extrabold text-gray-900">
                  {t('irrigationAssistant.recTitle')}
                </h4>
                <div className="text-base font-bold text-emerald-700 mt-1">
                  {t(`irrigationAssistant.outcomes.${irrRec.outcomeKey}`)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('irrigationAssistant.whyTitle')}
              </h5>
              <ul className="space-y-1.5">
                {irrRec.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start text-xs md:text-sm text-gray-700">
                    <span className="text-emerald-600 font-bold mr-2">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Important Agricultural Rule:</strong> Photos alone cannot measure root-zone soil moisture or exact water volume. This advisory combines your reported days, soil type, and weather forecast to prevent moisture stress. Always check sub-surface soil moisture before running tube-wells.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleAskIrrigationChatbot}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} />
                <span>{t('irrigationAssistant.askFollowUp')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;
