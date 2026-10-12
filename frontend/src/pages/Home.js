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
  Shield,
  Activity,
  ArrowRight
} from 'lucide-react';

const Home = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Activity,
      title: t('home.sugarcaneDiseaseNav'),
      description: t('home.descriptions.disease'),
      link: '/sugarcane-disease',
      color: 'bg-emerald-600'
    },
    {
      icon: MessageSquare,
      title: t('home.textQuery'),
      description: t('home.descriptions.text'),
      link: '/query',
      color: 'bg-green-600'
    },
    {
      icon: Mic,
      title: t('home.voiceQuery'),
      description: t('home.descriptions.voice'),
      link: '/query',
      color: 'bg-blue-600'
    },
    {
      icon: Cloud,
      title: t('home.weatherInfo'),
      description: t('home.descriptions.weather'),
      link: '/weather',
      color: 'bg-orange-500'
    }
  ];

  const stats = [
    { icon: Leaf, label: t('home.stats.classes'), value: '5 (AI)' },
    { icon: Users, label: t('home.stats.farmers'), value: '10K+' },
    { icon: TrendingUp, label: t('home.stats.accuracy'), value: '96%+' },
    { icon: Shield, label: t('home.stats.languages'), value: '4 Languages' }
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl relative z-10 space-y-6">
          <span className="bg-emerald-900/80 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block border border-emerald-500/30">
            🌾 {t('app.specializedBadge')}
          </span>
          
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
            {t('home.welcome')}
          </h1>
          
          <p className="text-emerald-100 text-lg md:text-xl font-normal leading-relaxed">
            {t('home.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to="/sugarcane-disease"
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-8 py-4 rounded-xl text-lg font-extrabold transition-all shadow-lg flex items-center justify-center space-x-3 group"
            >
              <Activity size={24} />
              <span>{t('home.diagnoseBtn')}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/query"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/20 px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center space-x-2"
            >
              <Mic size={22} />
              <span>{t('home.askAiBtn')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sugarcane Spotlight Feature */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-emerald-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-emerald-700 font-extrabold text-xs tracking-wider uppercase">
              {t('app.specializedBadge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t('home.featuredTitle')}
            </h2>
            <p className="text-gray-600 text-base max-w-2xl">
              {t('home.featuredDesc')}
            </p>
          </div>
          <Link
            to="/sugarcane-disease"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-bold text-base shadow transition-colors flex items-center space-x-2 whitespace-nowrap"
          >
            <span>{t('home.tryDiseaseAi')}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
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
                className="group bg-gray-50 hover:bg-emerald-50/50 rounded-xl p-6 transition-all duration-200 border border-gray-100 hover:border-emerald-200 hover:shadow-md"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 text-white shadow group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-8 text-center">
          {t('home.empoweringHeader')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon size={30} />
                </div>
                <div className="text-3xl font-extrabold mb-1">{stat.value}</div>
                <div className="text-sm text-emerald-100 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
