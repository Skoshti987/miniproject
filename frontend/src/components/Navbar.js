import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Cloud, User, Activity, Building2, History, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: t('navigation.home', { defaultValue: 'Home' }) },
    { path: '/sugarcane-disease', icon: Activity, label: t('navigation.sugarcaneDisease', { defaultValue: 'Disease AI' }) },
    { path: '/query', icon: MessageCircle, label: t('navigation.ask', { defaultValue: 'AI Chat' }) },
    { path: '/history', icon: History, label: 'History' },
    { path: '/schemes', icon: Building2, label: t('navigation.schemes', { defaultValue: 'Schemes' }) },
    { path: '/weather', icon: Cloud, label: t('navigation.weather', { defaultValue: 'Weather' }) },
    { path: '/profile', icon: User, label: user?.name ? user.name.split(' ')[0] : t('navigation.profile', { defaultValue: 'Profile' }) },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xl">🌾</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 flex items-center gap-1.5 leading-none">
                <span>KrishSathi</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold uppercase">
                  Sugarcane AI
                </span>
              </h1>
              <p className="text-[11px] text-gray-500 hidden sm:block font-medium">Precision Agricultural Intelligence</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-2 xl:space-x-4 items-center">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  location.pathname === path
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}

            {user ? (
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 text-xs xl:text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                title="Log Out"
              >
                <LogOut size={16} />
                <span>{t('navigation.logout', { defaultValue: 'Logout' })}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-xs xl:text-sm font-extrabold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow flex items-center space-x-1"
              >
                <LogIn size={15} />
                <span>{t('navigation.login', { defaultValue: 'Login' })}</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Action */}
          <div className="lg:hidden flex items-center space-x-2">
            {user ? (
              <button
                onClick={logout}
                className="text-xs text-red-600 font-bold px-2 py-1 flex items-center space-x-1"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden border-t border-gray-100 py-1.5">
          <div className="grid grid-cols-7 gap-1 text-center">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[9px] font-bold leading-tight transition-colors ${
                  location.pathname === path
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                <Icon size={16} className="mb-0.5" />
                <span className="truncate max-w-[48px]">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
