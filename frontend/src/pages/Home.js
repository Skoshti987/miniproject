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
      title: 'Sugarcane Disease AI',
      description: 'Upload leaf photos to diagnose Red Rot, Rust, Mosaic, and Yellow Leaf disease with verified ICAR treatments.',
      link: '/sugarcane-disease',
      color: 'bg-emerald-600'
    },
    {
      icon: MessageSquare,
      title: 'Sugarcane AI Chatbot',
      description: 'Ask questions on sugarcane varieties, fertilizer scheduling, irrigation, pests, and sugar recovery.',
      link: '/query',
      color: 'bg-green-600'
    },
    {
      icon: History,
      title: 'Diagnosis History',
      description: 'View and manage all previous leaf disease analyses, confidence scores, and custom recommendations.',
      link: '/history',
      color: 'bg-indigo-600'
    },
    {
      icon: Cloud,
      title: 'Agro-Weather Advisory',
      description: 'Real-time micro-weather forecasts and agro-climatic spray/irrigation advisories for your farm.',
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
            🌾 Specialized Sugarcane AI Assistant
          </span>
          
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
            {user?.name ? `Welcome back, ${user.name}!` : 'Empowering Sugarcane Farmers with Precision AI'}
          </h1>
          
          <p className="text-emerald-100 text-lg md:text-xl font-normal leading-relaxed">
            Real-time crop disease diagnosis, ICAR-verified agronomic treatments, sugarcane variety management, and localized weather intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to="/sugarcane-disease"
              className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 px-8 py-4 rounded-xl text-base md:text-lg font-black transition-all shadow-lg flex items-center justify-center space-x-3 group"
            >
              <Activity size={22} />
              <span>Diagnose Sugarcane Leaf</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/query"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/20 px-8 py-4 rounded-xl text-base md:text-lg font-bold transition-all flex items-center justify-center space-x-2"
            >
              <MessageSquare size={20} />
              <span>Ask Sugarcane AI</span>
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
              <span>Your Live Farm Intelligence Dashboard</span>
            </h2>
            <Link to="/history" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              <span>View All History</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Diagnoses</span>
              <div className="text-2xl md:text-3xl font-black text-emerald-700">
                {dashboardData.stats?.totalDiagnoses || 0}
              </div>
              <p className="text-[11px] text-gray-500">Recorded in MongoDB</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Queries Asked</span>
              <div className="text-2xl md:text-3xl font-black text-indigo-700">
                {dashboardData.stats?.totalQueries || 0}
              </div>
              <p className="text-[11px] text-gray-500">Conversations stored</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sugarcane Area</span>
              <div className="text-2xl md:text-3xl font-black text-green-700">
                {dashboardData.farmingProfile?.sugarcaneArea || '0'} <span className="text-sm font-semibold text-gray-600">Acres</span>
              </div>
              <p className="text-[11px] text-gray-500">Total: {dashboardData.farmingProfile?.totalLand || '0'} Acres</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Variety</span>
              <div className="text-lg md:text-xl font-black text-gray-900 truncate">
                {dashboardData.farmingProfile?.sugarcaneVariety || 'Co 86032'}
              </div>
              <p className="text-[11px] text-gray-500">{dashboardData.farmingProfile?.district || 'Kolhapur'}</p>
            </div>
          </div>

          {/* Recent Diagnoses & Conversations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Diagnoses from MongoDB */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600" />
                  <span>Recent Disease Diagnoses</span>
                </h3>
                <Link to="/history" className="text-xs font-bold text-emerald-600 hover:underline">
                  Full History
                </Link>
              </div>

              {dashboardData.recentDiagnoses && dashboardData.recentDiagnoses.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentDiagnoses.map((diag) => (
                    <div key={diag._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors">
                      <div className="flex items-center space-x-3">
                        {diag.imageData ? (
                          <img src={diag.imageData} alt={diag.disease} className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">🌱</div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900">{diag.disease}</h4>
                          <span className="text-[11px] text-gray-500">
                            {new Date(diag.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • {Math.round((diag.confidence || 0) * 100)}% Conf.
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        diag.severity?.toLowerCase() === 'high' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {diag.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <p>No diagnoses recorded yet.</p>
                  <Link to="/sugarcane-disease" className="text-emerald-600 font-bold hover:underline mt-1 inline-block">
                    Upload a sugarcane leaf photo
                  </Link>
                </div>
              )}
            </div>

            {/* Recent AI Chat Queries from MongoDB */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600" />
                  <span>Recent Chatbot Conversations</span>
                </h3>
                <Link to="/query" className="text-xs font-bold text-indigo-600 hover:underline">
                  Open Chat
                </Link>
              </div>

              {dashboardData.recentQueries && dashboardData.recentQueries.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentQueries.map((q) => (
                    <div key={q._id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                      <p className="font-bold text-xs text-gray-900 line-clamp-1">Q: {q.query}</p>
                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">A: {q.answer}</p>
                      <span className="text-[10px] text-gray-400 block pt-0.5">
                        {new Date(q.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <p>No chat history yet.</p>
                  <Link to="/query" className="text-indigo-600 font-bold hover:underline mt-1 inline-block">
                    Ask KrishSathi an agricultural question
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feature Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-gray-900">Core Sugarcane Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.link}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 hover:border-emerald-300 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 ${feature.color} text-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="pt-4 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Explore Feature</span>
                  <ArrowRight size={14} className="ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
