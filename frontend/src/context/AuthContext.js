import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext({
  user: null,
  loading: true,
  loginWithEmailPassword: async () => {},
  signupWithEmailPassword: async () => {},
  logout: async () => {},
  updateProfile: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const bootstrap = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api('/auth/me');
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const loginWithEmailPassword = async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    return data.user;
  };

  const signupWithEmailPassword = async (email, password, name) => {
    const data = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    return data.user;
  };

  const updateProfile = async (profileData) => {
    const data = await api('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, loginWithEmailPassword, signupWithEmailPassword, logout, updateProfile }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


