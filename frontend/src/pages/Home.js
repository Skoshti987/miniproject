import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Mic, 
  MessageSquare, 
  Upload, 
  Cloud, 
  Leaf, 
  TrendingUp, 
  Users, 
  Shield 
} from 'lucide-react';

const Home = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Mic,
      title: t('home.voiceQuery'),
      description: 'Ask questions using voice in your preferred language',
      link: '/query',
      color: 'bg-blue-500'
    },
    {
      icon: MessageSquare,
      title: t('home.textQuery'),
      description: 'Type your agricultural questions and get instant answers',
      link: '/query',
      color: 'bg-green-500'
    },
    {
      icon: Upload,
      title: t('home.uploadImage'),
      description: 'Upload plant images for disease diagnosis and treatment',
      link: '/upload',
      color: 'bg-purple-500'
    },
    {
      icon: Cloud,
      title: t('home.weatherInfo'),
      description: 'Get weather forecasts and agricultural advisories',
      link: '/weather',
      color: 'bg-orange-500'
    }
  ];

  const stats = [
    { icon: Leaf, label: 'Crops Supported', value: '50+' },
    { icon: Users, label: 'Farmers Helped', value: '10K+' },
    { icon: TrendingUp, label: 'Success Rate', value: '95%' },
    { icon: Shield, label: 'Expert Verified', value: '100%' }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
          {t('home.welcome')}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          {t('home.subtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/query"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Mic size={24} />
            <span>{t('home.voiceQuery')}</span>
          </Link>
          <Link
            to="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Upload size={24} />
            <span>{t('home.uploadImage')}</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {t('home.quickActions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.link}
                className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-8 text-center">
          Trusted by Farmers Across India
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon size={32} />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Why Choose KrishSathi?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Voice & Text Support</h3>
            <p className="text-gray-600">
              Ask questions in English, Hindi, Malayalam, or Marathi using voice or text input.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Diagnosis</h3>
            <p className="text-gray-600">
              Upload plant images for instant disease detection and treatment recommendations.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Expert Escalation</h3>
            <p className="text-gray-600">
              Complex queries are escalated to Krishi Bhavan officers for expert assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
