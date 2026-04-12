import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../firebase/config';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { userService } from '../firebase/firestore';

const AuthContext = createContext({ user: null, loading: true, loginWithGoogle: async () => {}, logout: async () => {}, loginWithEmailPassword: async () => {}, signupWithEmailPassword: async () => {}, sendPhoneOtp: async () => {}, verifyPhoneOtp: async () => {} });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const phoneConfirmationRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        try {
          await userService.createOrUpdateUser(firebaseUser.uid, {
            email: firebaseUser.email || null,
            displayName: firebaseUser.displayName || null,
            photoURL: firebaseUser.photoURL || null,
            phoneNumber: firebaseUser.phoneNumber || null,
            providerId: firebaseUser.providerData?.[0]?.providerId || 'google',
            lastLoginAt: new Date().toISOString()
          });
        } catch (e) {
          // Silent fail; UI should not block on profile persistence
          console.error('Failed to persist user profile', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithEmailPassword = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signupWithEmailPassword = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch {}
    }
    await userService.createOrUpdateUser(cred.user.uid, {
      email: cred.user.email || null,
      displayName: cred.user.displayName || null,
      photoURL: cred.user.photoURL || null,
      phoneNumber: cred.user.phoneNumber || null,
      providerId: cred.user.providerData?.[0]?.providerId || 'password',
      lastLoginAt: new Date().toISOString()
    });
    return cred.user;
  };

  const ensureRecaptcha = (containerId = 'recaptcha-container') => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    }
    return window.recaptchaVerifier;
  };

  const sendPhoneOtp = async (e164PhoneNumber, containerId = 'recaptcha-container') => {
    const verifier = ensureRecaptcha(containerId);
    const confirmation = await signInWithPhoneNumber(auth, e164PhoneNumber, verifier);
    phoneConfirmationRef.current = confirmation;
    return true;
  };

  const verifyPhoneOtp = async (code) => {
    if (!phoneConfirmationRef.current) throw new Error('OTP not requested');
    const cred = await phoneConfirmationRef.current.confirm(code);
    await userService.createOrUpdateUser(cred.user.uid, {
      email: cred.user.email || null,
      displayName: cred.user.displayName || null,
      photoURL: cred.user.photoURL || null,
      phoneNumber: cred.user.phoneNumber || null,
      providerId: cred.user.providerData?.[0]?.providerId || 'phone',
      lastLoginAt: new Date().toISOString()
    });
    phoneConfirmationRef.current = null;
    return cred.user;
  };

  const value = useMemo(() => ({ user, loading, loginWithGoogle, logout, loginWithEmailPassword, signupWithEmailPassword, sendPhoneOtp, verifyPhoneOtp }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


