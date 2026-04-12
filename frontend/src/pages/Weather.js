import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Eye } from 'lucide-react';

const Weather = () => {
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('Kerala, India');

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual weather API
      const mockWeatherData = {
        current: {
          temperature: 28,
          humidity: 75,
          rainfall: 12.5,
          windSpeed: 8.2,
          visibility: 10,
          condition: 'Partly Cloudy',
          icon: 'partly-cloudy'
        },
        forecast: [
          { day: 'Today', high: 32, low: 24, condition: 'Partly Cloudy', rainfall: 5 },
          { day: 'Tomorrow', high: 30, low: 23, condition: 'Rain', rainfall: 15 },
          { day: 'Wednesday', high: 29, low: 22, condition: 'Heavy Rain', rainfall: 25 },
          { day: 'Thursday', high: 31, low: 24, condition: 'Cloudy', rainfall: 8 },
          { day: 'Friday', high: 33, low: 25, condition: 'Sunny', rainfall: 2 },
          { day: 'Saturday', high: 32, low: 24, condition: 'Partly Cloudy', rainfall: 6 },
          { day: 'Sunday', high: 30, low: 23, condition: 'Rain', rainfall: 12 }
        ],
        advisory: {
          title: 'Agricultural Advisory for This Week',
          recommendations: [
            'Avoid spraying pesticides during rainy days (Wednesday-Thursday)',
            'Good time for transplanting rice seedlings',
            'Monitor for fungal diseases due to high humidity',
            'Harvest mature crops before heavy rainfall',
            'Apply organic manure during dry spells'
          ],
          warnings: [
            'Heavy rainfall expected on Wednesday - take necessary precautions',
            'High humidity may cause fungal infections in vegetables'
          ]
        }
      };

      setTimeout(() => {
        setWeatherData(mockWeatherData.current);
        setForecast(mockWeatherData.forecast);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching weather data:', error);
      setLoading(false);
    }
  };

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
          Current weather and agricultural advisories for {location}
        </p>
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
      {weatherData?.advisory && (
        <div className="bg-green-50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
            <Cloud className="mr-2" size={28} />
            {weatherData.advisory.title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {weatherData.advisory.recommendations.map((rec, index) => (
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
                {weatherData.advisory.warnings.map((warning, index) => (
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
