import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const { loginWithGoogle, loginWithEmailPassword, signupWithEmailPassword, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [tab, setTab] = useState('google'); // 'google' | 'email' | 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const from = (location.state && location.state.from) || '/';

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (e) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmailPassword(email, password);
      } else {
        await signupWithEmailPassword(email, password, displayName);
      }
      navigate(from, { replace: true });
    } catch (e) {
      setError(e?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Expect E.164 format like +91XXXXXXXXXX
      await sendPhoneOtp(phone, 'recaptcha-container');
      setOtpSent(true);
    } catch (e) {
      setError(e?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyPhoneOtp(otp);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-1 text-center">{mode === 'login' ? 'Login' : 'Sign up'}</h1>
      <p className="text-gray-600 mb-4 text-center">Use Google, Email, or Phone</p>

      <div className="flex justify-center space-x-4 mb-4">
        <button onClick={() => setMode('login')} className={`px-3 py-1 rounded ${mode==='login'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>Login</button>
        <button onClick={() => setMode('signup')} className={`px-3 py-1 rounded ${mode==='signup'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>Sign up</button>
      </div>

      {error && (
        <div className="mb-3 text-red-600 text-sm text-center">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => setTab('google')} className={`py-2 rounded ${tab==='google'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`}>Google</button>
        <button onClick={() => setTab('email')} className={`py-2 rounded ${tab==='email'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`}>Email</button>
        <button onClick={() => setTab('phone')} className={`py-2 rounded ${tab==='phone'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`}>Phone</button>
      </div>

      {tab === 'google' && (
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full ${loading ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'} text-white py-2 px-4 rounded-lg font-semibold`}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
      )}

      {tab === 'email' && (
        <form onSubmit={handleEmail} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Full Name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold"
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create account')}
          </button>
        </form>
      )}

      {tab === 'phone' && (
        <div className="space-y-3">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <input
                type="tel"
                placeholder="Phone (e.g., +91XXXXXXXXXX)"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div id="recaptcha-container"></div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <input
                type="text"
                placeholder="Enter OTP"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Login;


