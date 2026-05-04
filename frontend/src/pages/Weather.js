import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Weather = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');

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

  const quickLocations = [user?.location, 'Pune, India', 'Nashik, India', 'Nagpur, India']
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index);

  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
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
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t('weather.title')}
        </h1>
        <p className="text-gray-600">
          {weatherData
            ? `Current weather and agricultural advisories for ${location}`
            : `Enter a place to load weather${location ? ` (last search: ${location})` : ''}.`}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4">
        <form onSubmit={handleLocationSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Check weather for village / city / district
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="e.g. Kolhapur, Maharashtra, India"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Weather
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
                className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-green-100 text-gray-700"
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
              <div className="text-gray-600">{weatherData.condition}</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Droplets className="text-blue-500" size={20} />
                <div>
                  <div className="text-sm text-gray-600">{t('weather.humidity')}</div>
                  <div className="text-lg font-semibold">{weatherData.humidity}%</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CloudRain className="text-blue-500" size={20} />
                <div>
                  <div className="text-sm text-gray-600">{t('weather.rainfall')}</div>
                  <div className="text-lg font-semibold">{weatherData.rainfall} mm</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Wind className="text-gray-500" size={20} />
                <div>
                  <div className="text-sm text-gray-600">{t('weather.windSpeed')}</div>
                  <div className="text-lg font-semibold">{weatherData.windSpeed} km/h</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Eye className="text-gray-500" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Visibility</div>
                  <div className="text-lg font-semibold">{weatherData.visibility} km</div>
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
                  <span className="text-gray-600">{day.condition}</span>
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
        <div className="bg-green-50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
            <Cloud className="mr-2" size={28} />
            {advisory.title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {advisory.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2 text-green-700">
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
                  <li key={index} className="flex items-start space-x-2 text-red-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Weather Tips */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          Weather-Based Farming Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <h4 className="font-semibold mb-2">Rainy Season</h4>
            <ul className="space-y-1 text-sm">
              <li>• Plant rice and other water-loving crops</li>
              <li>• Avoid waterlogging in fields</li>
              <li>• Use proper drainage systems</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Dry Season</h4>
            <ul className="space-y-1 text-sm">
              <li>• Focus on drought-resistant crops</li>
              <li>• Implement water conservation techniques</li>
              <li>• Use mulching to retain soil moisture</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
