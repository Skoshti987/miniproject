import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  MessageSquare, 
  History, 
  ShieldCheck,
  Zap
} from 'lucide-react';

const Login = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading, loginWithEmailPassword, signupWithEmailPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const from = (location.state && location.state.from && location.state.from.pathname) || '/';

  // If user is already logged in, redirect immediately to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmailPassword(email.trim(), password);
      } else {
        await signupWithEmailPassword(email.trim(), password, name.trim(), mobileNumber.trim());
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setEmail('demo@krishsathi.org');
    setPassword('farmer123');
    setSubmitting(true);
    try {
      await loginWithEmailPassword('demo@krishsathi.org', 'farmer123');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Demo login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-semibold text-sm">Connecting to KrishSathi Sugarcane Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: Agricultural Brand Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-700/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          {/* Top Brand Block */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-bold mb-6 backdrop-blur-sm">
              <Sparkles size={14} className="text-yellow-400" />
              <span>{t('app.portal', { defaultValue: 'Precision Sugarcane AI Platform' })}</span>
            </div>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <span className="text-2xl">🌾</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  {t('app.name', { defaultValue: 'KrishSathi' })}
                </h1>
                <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                  {t('app.tagline', { defaultValue: 'Sugarcane Agronomy & Disease Intelligence' })}
                </p>
              </div>
            </div>

            <p className="text-emerald-100/90 text-sm leading-relaxed mb-8">
              {t('home.subtitle', {
                defaultValue: 'A comprehensive agricultural intelligence system designed specifically for sugarcane growers, agronomy officers, and sugar factories.'
              })}
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="p-2 bg-emerald-600/50 rounded-xl text-emerald-300 shrink-0">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('navigation.sugarcaneDisease', { defaultValue: 'AI Leaf Disease Diagnostics' })}
                  </h3>
                  <p className="text-xs text-emerald-200/80 leading-snug">
                    {t('home.descriptions.disease', {
                      defaultValue: 'Instant detection of Red Rot, Rust, Mosaic, and Yellow Leaf with multi-stage non-sugarcane image rejection.'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="p-2 bg-emerald-600/50 rounded-xl text-emerald-300 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ICAR-SBI Grounded Treatments</h3>
                  <p className="text-xs text-emerald-200/80 leading-snug">
                    Scientifically verified chemical and biological remedies with genuine official purchasing links (IFFCO, AgriBegri).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="p-2 bg-emerald-600/50 rounded-xl text-emerald-300 shrink-0">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('navigation.ask', { defaultValue: '24/7 Multilingual AI Agronomist' })}
                  </h3>
                  <p className="text-xs text-emerald-200/80 leading-snug">
                    {t('home.descriptions.text', {
                      defaultValue: 'Expert answers on planting, fertilizer schedules, ratoon management, and sugar recovery in English, Hindi, and Marathi.'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="p-2 bg-emerald-600/50 rounded-xl text-emerald-300 shrink-0">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('navigation.history', { defaultValue: 'Persistent Cloud Farm Records' })}
                  </h3>
                  <p className="text-xs text-emerald-200/80 leading-snug">
                    {t('home.descriptions.history', {
                      defaultValue: 'MongoDB-backed diagnostic history, farm acreage tracking, and crop advisory for seamless continuity.'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-6 mt-6 border-t border-emerald-700/50 flex items-center justify-between text-xs text-emerald-200">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              {t('app.verifiedStandard', { defaultValue: 'Verified Agricultural Standards' })}
            </span>
            <span className="text-emerald-300 font-mono text-[11px]">ICAR-SBI • VSI Aligned</span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-gray-50/50">
          <div className="max-w-md w-full mx-auto">
            
            {/* Mode Switcher Tabs */}
            <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center space-x-1 mb-6 border border-gray-200">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-white text-emerald-800 shadow-md border border-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{t('login.signInTab', { defaultValue: 'Farmer Sign In' })}</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                  mode === 'signup'
                    ? 'bg-white text-emerald-800 shadow-md border border-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{t('login.signUpTab', { defaultValue: 'Create Farm Account' })}</span>
              </button>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {mode === 'login' 
                  ? t('login.welcomeBack', { defaultValue: 'Welcome Back, Sugarcane Grower' })
                  : t('login.createTitle', { defaultValue: 'Register Your Sugarcane Farm' })}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'login'
                  ? t('login.welcomeSubtitle', { defaultValue: 'Access your farm diagnostics, AI crop chat, and disease history.' })
                  : t('login.createSubtitle', { defaultValue: 'Start using precision AI to protect and maximize your sugarcane yield.' })}
              </p>
            </div>

            {/* Quick Demo Login Option */}
            <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap size={14} className="text-emerald-600 fill-emerald-600" />
                  {t('login.quickDemo', { defaultValue: 'Quick Evaluation Access' })}
                </span>
                <span className="text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  1-Click Demo
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                {t('login.demoProfileDesc', {
                  defaultValue: 'Log in instantly with a pre-configured Kolhapur sugarcane farm profile (Sayali Koshti • Co 86032 • 4.5 Acres).'
                })}
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={submitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={14} className="text-yellow-300" />
                <span>{t('login.instantDemoBtn', { defaultValue: 'Instant Demo Farmer Login' })}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t('login.orCredentials', { defaultValue: 'Or continue with credentials' })}
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start space-x-3 text-red-800 text-sm animate-shake">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      {t('login.fullName', { defaultValue: 'Full Farmer Name' })}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder={t('login.fullNamePlaceholder', { defaultValue: 'e.g. Sayali Hanmant Koshti' })}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      {t('login.mobileNumber', { defaultValue: 'Mobile Number' })}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        placeholder={t('login.mobilePlaceholder', { defaultValue: 'e.g. 9876543210' })}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('login.email', { defaultValue: 'Email Address' })}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="farmer@krishsathi.org"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('login.password', { defaultValue: 'Password' })}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    {t('login.confirmPassword', { defaultValue: 'Confirm Password' })}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-3.5 px-6 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('login.processing', { defaultValue: 'Processing Securely...' })}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'login'
                        ? t('login.signInBtn', { defaultValue: 'Sign In to Dashboard' })
                        : t('login.signUpBtn', { defaultValue: 'Complete Registration & Open Dashboard' })}
                    </span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer switcher note */}
            <div className="mt-6 text-center text-xs text-gray-500">
              {mode === 'login' ? (
                <p>
                  {t('login.dontHaveAccount', { defaultValue: "Don't have an account yet?" })}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); }}
                    className="text-emerald-700 font-extrabold hover:underline"
                  >
                    {t('login.createFreeAccount', { defaultValue: 'Create a free farm account' })}
                  </button>
                </p>
              ) : (
                <p>
                  {t('login.alreadyRegistered', { defaultValue: 'Already registered?' })}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="text-emerald-700 font-extrabold hover:underline"
                  >
                    {t('login.signInHere', { defaultValue: 'Sign in here' })}
                  </button>
                </p>
              )}
            </div>

            {/* Agricultural disclaimer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[11px] text-gray-400">
              {t('login.disclaimer', { defaultValue: 'KrishSathi Sugarcane AI • Designed for Precision Agronomy & Sugar Factories' })}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
