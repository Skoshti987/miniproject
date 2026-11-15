import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Cloud, 
  Activity, 
  ArrowRight, 
  History, 
  Sparkles 
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoadingDashboard(true);
      const res = await api('/dashboard/stats');
      if (res && res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.warn('Could not load dashboard stats:', err.message);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const features = [
    {
      icon: Activity,
      title: t('navigation.sugarcaneDisease', { defaultValue: 'Sugarcane Disease AI' }),
      description: t('home.descriptions.disease', { 
        defaultValue: 'Upload leaf photos to diagnose Red Rot, Rust, Mosaic, and Yellow Leaf disease with verified ICAR treatments.' 
      }),
      link: '/sugarcane-disease',
      color: 'bg-emerald-600'
    },
    {
      icon: MessageSquare,
      title: t('navigation.ask', { defaultValue: 'Sugarcane AI Chatbot' }),
      description: t('home.descriptions.text', { 
        defaultValue: 'Ask questions on sugarcane varieties, fertilizer scheduling, irrigation, pests, and sugar recovery.' 
      }),
      link: '/query',
      color: 'bg-green-600'
    },
    {
      icon: History,
      title: t('navigation.history', { defaultValue: 'Diagnosis History' }),
      description: t('home.descriptions.history', { 
        defaultValue: 'View and manage all previous leaf disease analyses, confidence scores, and custom recommendations.' 
      }),
      link: '/history',
      color: 'bg-indigo-600'
    },
    {
      icon: Cloud,
      title: t('navigation.weather', { defaultValue: 'Agro-Weather Advisory' }),
      description: t('home.descriptions.weather', { 
        defaultValue: 'Real-time micro-weather forecasts and agro-climatic spray/irrigation advisories for your farm.' 
      }),
      link: '/weather',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl relative z-10 space-y-6">
          <span className="bg-emerald-900/80 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block border border-emerald-500/30">
            🌾 {t('app.specializedBadge', { defaultValue: 'Specialized Sugarcane AI Assistant' })}
          </span>
          
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
            {user?.name 
              ? `${t('home.welcomeFarmer', { defaultValue: 'Welcome back' })}, ${user.name}!` 
              : t('home.welcome', { defaultValue: 'Empowering Sugarcane Farmers with Precision AI' })}
          </h1>
          
          <p className="text-emerald-100 text-lg md:text-xl font-normal leading-relaxed">
            {t('home.subtitle', { 
              defaultValue: 'Real-time crop disease diagnosis, ICAR-verified agronomic treatments, sugarcane variety management, and localized weather intelligence.' 
            })}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to="/sugarcane-disease"
              className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 px-8 py-4 rounded-xl text-base md:text-lg font-black transition-all shadow-lg flex items-center justify-center space-x-3 group"
            >
              <Activity size={22} />
              <span>{t('home.diagnoseBtn', { defaultValue: 'Diagnose Sugarcane Leaf' })}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/query"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/20 px-8 py-4 rounded-xl text-base md:text-lg font-bold transition-all flex items-center justify-center space-x-2"
            >
              <MessageSquare size={20} />
              <span>{t('home.askAiBtn', { defaultValue: 'Ask Sugarcane AI' })}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MODULE 5: REAL MONGODB DASHBOARD STATS FOR LOGGED IN USERS */}
      {user && dashboardData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-emerald-600" size={22} />
              <span>{t('home.dashboardTitle', { defaultValue: 'Your Live Farm Intelligence Dashboard' })}</span>
            </h2>
            <Link to="/history" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              <span>{t('home.viewHistory', { defaultValue: 'View All History' })}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('home.stats.totalDiagnoses', { defaultValue: 'Total Diagnoses' })}
              </span>
              <div className="text-2xl md:text-3xl font-black text-emerald-700">
                {dashboardData.stats?.totalDiagnoses || 0}
              </div>
              <p className="text-[11px] text-gray-500">
                {t('home.stats.recordedInDb', { defaultValue: 'Recorded in MongoDB' })}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('home.stats.totalQueries', { defaultValue: 'AI Queries Asked' })}
              </span>
              <div className="text-2xl md:text-3xl font-black text-indigo-700">
                {dashboardData.stats?.totalQueries || 0}
              </div>
              <p className="text-[11px] text-gray-500">
                {t('home.stats.conversationsStored', { defaultValue: 'Conversations stored' })}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('home.stats.sugarcaneArea', { defaultValue: 'Sugarcane Area' })}
              </span>
              <div className="text-2xl md:text-3xl font-black text-green-700">
                {dashboardData.farmingProfile?.sugarcaneArea || '0'}{' '}
                <span className="text-sm font-semibold text-gray-600">
                  {t('home.stats.acres', { defaultValue: 'Acres' })}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Total: {dashboardData.farmingProfile?.totalLand || '0'} {t('home.stats.acres', { defaultValue: 'Acres' })}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('home.stats.variety', { defaultValue: 'Active Variety' })}
              </span>
              <div className="text-xl md:text-2xl font-black text-emerald-800 truncate">
                {dashboardData.farmingProfile?.sugarcaneVariety || 'Co 86032'}
              </div>
              <p className="text-[11px] text-gray-500">
                {dashboardData.farmingProfile?.district || 'Kolhapur'}, {dashboardData.farmingProfile?.state || 'Maharashtra'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Link
              key={idx}
              to={feature.link}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-50 flex items-center text-sm font-bold text-emerald-600 group-hover:text-emerald-700">
                <span>{t('common.explore', { defaultValue: 'Open Tool' })}</span>
                <ArrowRight size={16} className="ml-1.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
