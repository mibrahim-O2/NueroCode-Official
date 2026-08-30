import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, Github, ArrowLeft } from 'lucide-react';
import Logo from '@/components/common/Logo';
import {
  signInWithGoogle,
  signInWithGithub,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
} from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const ERROR_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/popup-closed-by-user': null, // user-cancelled, not a real error — no message shown
};

function friendlyError(firebaseError) {
  const code = firebaseError?.code;
  if (code && code in ERROR_MESSAGES) return ERROR_MESSAGES[code];
  return 'Something went wrong. Please try again.';
}

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);

  // Bug fix: switching modes previously left a stale error OR a stale
  // resetSent=true confirmation on screen from whatever the user last
  // attempted — e.g. requesting a reset, going back to Login, then
  // clicking "Forgot password?" again showed "check your email"
  // instantly, before the second request was ever submitted. Every mode
  // switch now clears both, so each mode always starts clean.
  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setResetSent(false);
  };

  const handleOAuthLogin = async (providerFn) => {
    setError(null);
    setLoading(true);
    try {
      const token = await providerFn();
      await loginWithToken(token);
      navigate('/dashboard');
    } catch (err) {
      const message = friendlyError(err);
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    // Bug fix: this was missing — a stale error from a PREVIOUS failed
    // attempt could sit on screen through a new attempt, making it look
    // like the new attempt had already failed before it even resolved.
    setError(null);
    setLoading(true);
    try {
      const token = await signInWithEmail(email, password);
      await loginWithToken(token);
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError(null); // Bug fix: same as above, applied to signup too.
    setLoading(true);
    try {
      const token = await signUpWithEmail(email, password);
      await loginWithToken(token);
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo variant="icon" size={48} animated />
          <h1 className="font-heading text-xl font-semibold text-text-primary">
            {mode === 'reset' ? 'Reset your password' : 'Welcome to NeuroCode'}
          </h1>
          <p className="text-sm text-text-muted">
            {mode === 'login' && 'Sign in to continue your journey'}
            {mode === 'signup' && 'Create an account to get started'}
            {mode === 'reset' && "We'll send you a link to reset your password"}
          </p>
        </div>

        <div className="rounded-card border border-border bg-card p-6 shadow-card">
          {mode !== 'reset' && (
            <>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleOAuthLogin(signInWithGoogle)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-button border border-border py-2.5 text-sm font-body text-text-primary transition-all duration-200 hover:border-orange active:scale-95 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
                <button
                  onClick={() => handleOAuthLogin(signInWithGithub)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-button border border-border py-2.5 text-sm font-body text-text-primary transition-all duration-200 hover:border-orange active:scale-95 disabled:opacity-50"
                >
                  <Github className="h-4 w-4" /> Continue with GitHub
                </button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-divider" />
                <span className="text-xs text-text-muted">or</span>
                <div className="h-px flex-1 bg-divider" />
              </div>
            </>
          )}

          {mode === 'reset' ? (
            resetSent ? (
              <div className="animate-slide-fade-in flex flex-col items-center gap-3 py-2 text-center">
                <p className="text-sm text-text-primary">
                  If an account exists for <strong>{email}</strong>, a reset link is on its way.
                </p>
                <button
                  onClick={() => switchMode('login')}
                  className="flex items-center gap-1.5 text-sm text-orange hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-input border border-border bg-elevated py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
                  />
                </div>
                {error && <p className="animate-slide-fade-in text-xs text-status-error">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-button bg-orange py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-orange"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </button>
              </form>
            )
          ) : (
            <form onSubmit={mode === 'login' ? handleEmailLogin : handleEmailSignup} className="flex flex-col gap-3">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-input border border-border bg-elevated py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
                />
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-input border border-border bg-elevated py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
                />
              </div>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="self-end text-xs text-text-muted hover:text-orange"
                >
                  Forgot password?
                </button>
              )}

              {error && <p className="animate-slide-fade-in text-xs text-status-error">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-button bg-orange py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        {mode !== 'reset' && (
          <p className="mt-5 text-center text-sm text-text-muted">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="font-semibold text-orange hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}

        <Link to="/" className="mt-6 block text-center text-xs text-text-muted hover:text-orange">
          ← Back to NeuroCode
        </Link>
      </div>
    </main>
  );
}