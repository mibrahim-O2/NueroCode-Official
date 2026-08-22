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

   const updateUser = (partial) => setUser((prev) => (prev ? { ...prev, ...partial } : prev));

  // Explicitly re-fetches the current user from the backend (which now
  // reads live from the database — see /auth/me) rather than relying on
  // whatever was last set in memory. Used to guarantee fresh data when
  // returning to a page that displays account-level stats, without
  // requiring a full reload or re-login.
  const refreshUser = async () => {
    try {
      const fresh = await fetchCurrentUser();
      setUser(fresh);
      return fresh;
    } catch {
      // Non-fatal — keep existing state rather than disrupting the UI
      // over a transient network issue.
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    updateUser,
    refreshUser,
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