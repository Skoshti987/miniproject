import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Upload, Cloud, User, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: t('navigation.home') },
    { path: '/sugarcane-disease', icon: Activity, label: t('navigation.sugarcaneDisease') },
    { path: '/query', icon: MessageCircle, label: t('navigation.ask') },
    { path: '/upload', icon: Upload, label: t('navigation.upload') },
    { path: '/weather', icon: Cloud, label: t('navigation.weather') },
    { path: '/profile', icon: User, label: t('navigation.profile') },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xl">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-1">
                {t('app.name')} <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">Sugarcane AI</span>
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">{t('app.tagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4 lg:space-x-6 items-center">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  location.pathname === path
                    ? 'bg-emerald-100 text-emerald-800 shadow-sm'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
            {user ? (
              <button onClick={logout} className="px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700">
                Logout
              </button>
            ) : (
              <Link to="/login" className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow">
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu logo fallback */}
          <div className="md:hidden">
            {user ? (
              <button onClick={logout} className="text-xs text-red-600 font-semibold px-2 py-1">
                Logout
              </button>
            ) : (
              <Link to="/login" className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded">
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="grid grid-cols-6 gap-0.5 py-2 text-center">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center p-1.5 rounded-md text-[10px] font-bold leading-tight transition-colors ${
                  location.pathname === path
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <Icon size={18} className="mb-0.5" />
                <span className="truncate max-w-[55px]">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
