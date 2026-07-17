import { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchCurrentUser,
  loginWithGoogle,
  loginWithGithub,
  logout as logoutService,
} from '@/services/authService';

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

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const u = await loginWithGoogle();
      setUser(u);
      return u;
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  const handleGithubLogin = async () => {
    setError(null);
    try {
      const u = await loginWithGithub();
      setUser(u);
      return u;
    } catch (err) {
      setError(err.message || 'GitHub sign-in failed');
      throw err;
    }
  };

  const handleLogout = async () => {
    await logoutService();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithGoogle: handleGoogleLogin,
        loginWithGithub: handleGithubLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}