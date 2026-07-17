import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Loader2, AlertCircle, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/common/Logo';
import TextInput from '@/components/common/TextInput';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.54-5.17 3.54-8.65z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3c-1.08.72-2.46 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.1C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.31 14.32c-.24-.72-.38-1.49-.38-2.32s.14-1.6.38-2.32v-3.1H1.3A11.97 11.97 0 000 12c0 1.94.46 3.77 1.3 5.42l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.3 6.58l4.01 3.1c.94-2.83 3.58-4.93 6.69-4.93z" />
    </svg>
  );
}

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '' };

export default function Login() {
  const { loginWithGoogle, loginWithGithub, loginWithEmail, registerWithEmail, resetPassword, error, setError } =
    useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [resetSent, setResetSent] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setFieldErrors({});
    setResetSent(false);
    setForm(EMPTY_FORM);
  };

  const handleField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleOAuth = async (provider, action) => {
    setPending(provider);
    try {
      await action();
      navigate('/dashboard');
    } catch {
      /* error already set in context */
    } finally {
      setPending(null);
    }
  };

  const validate = () => {
    const errs = {};
    if (mode === 'signup' && !form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (mode !== 'reset' && form.password.length < 6) errs.password = 'At least 6 characters';
    if (mode === 'signup' && form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setPending('email');
    try {
      if (mode === 'signin') {
        await loginWithEmail(form.email.trim(), form.password);
        navigate('/dashboard');
      } else if (mode === 'signup') {
        await registerWithEmail(form.name.trim(), form.email.trim(), form.password);
        navigate('/dashboard');
      } else if (mode === 'reset') {
        await resetPassword(form.email.trim());
        setResetSent(true);
      }
    } catch {
      /* error already set in context */
    } finally {
      setPending(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 py-12">
      <Logo size={56} />

      <div className="w-full max-w-sm flex flex-col gap-5 rounded-dialog border border-border bg-card p-8 shadow-dialog">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="font-heading font-semibold text-xl text-text-primary">
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
          </h1>
          <p className="font-body text-sm text-text-muted">
            {mode === 'signin' && 'Sign in to continue your roadmap'}
            {mode === 'signup' && 'Start your NeuroCode journey'}
            {mode === 'reset' && "We'll email you a reset link"}
          </p>
        </div>

        {mode !== 'reset' && (
          <>
            <div className="flex rounded-input border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={cn(
                  'flex-1 py-2 text-sm font-body transition-colors duration-200',
                  mode === 'signin' ? 'bg-emerald text-white' : 'text-text-muted hover:text-text-primary'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={cn(
                  'flex-1 py-2 text-sm font-body transition-colors duration-200',
                  mode === 'signup' ? 'bg-emerald text-white' : 'text-text-muted hover:text-text-primary'
                )}
              >
                Create Account
              </button>
            </div>

            <button
              onClick={() => handleOAuth('google', loginWithGoogle)}
              disabled={pending !== null}
              className="flex items-center justify-center gap-3 rounded-button border border-border bg-charcoal px-4 py-3 text-text-primary text-sm font-body shadow-button hover:border-emerald transition-colors duration-200 disabled:opacity-50"
            >
              {pending === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth('github', loginWithGithub)}
              disabled={pending !== null}
              className="flex items-center justify-center gap-3 rounded-button border border-border bg-charcoal px-4 py-3 text-text-primary text-sm font-body shadow-button hover:border-emerald transition-colors duration-200 disabled:opacity-50"
            >
              {pending === 'github' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
              Continue with GitHub
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-divider" />
              <span className="text-xs text-text-muted">OR</span>
              <div className="h-px flex-1 bg-divider" />
            </div>
          </>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-input border border-status-error/40 bg-status-error/10 px-3 py-2 text-status-error text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {resetSent ? (
          <div className="flex items-center gap-2 rounded-input border border-emerald/40 bg-emerald/10 px-3 py-2 text-emerald text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Reset link sent — check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <TextInput
                icon={User}
                placeholder="Full name"
                value={form.name}
                onChange={handleField('name')}
                error={fieldErrors.name}
              />
            )}

            <TextInput
              icon={Mail}
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleField('email')}
              error={fieldErrors.email}
            />

            {mode !== 'reset' && (
              <TextInput
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={handleField('password')}
                error={fieldErrors.password}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            )}

            {mode === 'signup' && (
              <TextInput
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleField('confirmPassword')}
                error={fieldErrors.confirmPassword}
                autoComplete="new-password"
              />
            )}

            {mode !== 'reset' && (
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="flex items-center gap-1.5 self-start text-xs text-text-muted hover:text-emerald transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPassword ? 'Hide' : 'Show'} password
              </button>
            )}

            <button
              type="submit"
              disabled={pending !== null}
              className="flex items-center justify-center gap-2 rounded-button bg-emerald px-4 py-3 text-white text-sm font-body shadow-button hover:bg-emerald-hover transition-colors duration-200 disabled:opacity-50 mt-1"
            >
              {pending === 'email' && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'reset' && 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center">
          {mode === 'signin' && (
            <button
              onClick={() => switchMode('reset')}
              className="text-xs text-text-muted hover:text-emerald transition-colors duration-200"
            >
              Forgot password?
            </button>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => switchMode('signin')}
              className="text-xs text-text-muted hover:text-emerald transition-colors duration-200"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>

      <span className="text-xs text-text-disabled">Phase 3 — Authentication</span>
    </main>
  );
}