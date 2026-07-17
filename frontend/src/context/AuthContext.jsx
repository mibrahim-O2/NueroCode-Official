import { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchCurrentUser,
  loginWithGoogle,
  loginWithGithub,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  logout as logoutService,
} from '@/services/authService';
import { friendlyAuthError } from '@/utils/authErrors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('neurocode_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('neurocode_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const runAuthAction = async (action) => {
    setError(null);
    try {
      const u = await action();
      setUser(u);
      return u;
    } catch (err) {
      setError(friendlyAuthError(err));
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    loginWithGoogle: () => runAuthAction(loginWithGoogle),
    loginWithGithub: () => runAuthAction(loginWithGithub),
    loginWithEmail: (email, password) => runAuthAction(() => loginWithEmail(email, password)),
    registerWithEmail: (name, email, password) =>
      runAuthAction(() => registerWithEmail(name, email, password)),
    resetPassword: async (email) => {
      setError(null);
      try {
        await resetPassword(email);
      } catch (err) {
        setError(friendlyAuthError(err));
        throw err;
      }
    },
    logout: async () => {
      await logoutService();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}