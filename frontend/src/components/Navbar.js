import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Upload, Cloud, User, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: t('navigation.home') },
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
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{t('app.name')}</h1>
              <p className="text-xs text-gray-600">{t('app.tagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
            {user ? (
              <button onClick={logout} className="px-3 py-2 text-sm text-red-600 hover:text-red-700">
                {t('auth.logout') || 'Logout'}
              </button>
            ) : (
              <Link to="/login" className="px-3 py-2 text-sm text-green-700 hover:text-green-800">
                {t('auth.login') || 'Login'}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="grid grid-cols-5 gap-1 py-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center space-y-1 p-2 rounded-md text-xs font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-center">{label}</span>
              </Link>
            ))}
            {user ? (
              <button onClick={logout} className="text-center p-2 text-xs text-red-600">
                {t('auth.logout') || 'Logout'}
              </button>
            ) : (
              <Link to="/login" className="text-center p-2 text-xs text-green-700">
                {t('auth.login') || 'Login'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
