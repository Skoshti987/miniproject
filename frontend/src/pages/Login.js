import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const { loginWithEmailPassword, signupWithEmailPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const from = (location.state && location.state.from) || '/';

  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmailPassword(email, password);
      } else {
        await signupWithEmailPassword(email, password, name);
      }
      navigate(from, { replace: true });
    } catch (e) {
      setError(e?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-1 text-center">{mode === 'login' ? 'Login' : 'Sign up'}</h1>
      <p className="text-gray-600 mb-4 text-center">Email and password authentication</p>

      <div className="flex justify-center space-x-4 mb-4">
        <button onClick={() => setMode('login')} className={`px-3 py-1 rounded ${mode==='login'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>Login</button>
        <button onClick={() => setMode('signup')} className={`px-3 py-1 rounded ${mode==='signup'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>Sign up</button>
      </div>

      {error && (
        <div className="mb-3 text-red-600 text-sm text-center">{error}</div>
      )}

      <form onSubmit={handleEmail} className="space-y-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Full Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
    </div>
  );
};

export default Login;


