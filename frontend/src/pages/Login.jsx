import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Loader2, AlertCircle } from 'lucide-react';
import Logo from '@/components/common/Logo';
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

export default function Login() {
  const { loginWithGoogle, loginWithGithub, error } = useAuth();
  const [pending, setPending] = useState(null);
  const navigate = useNavigate();

  const handle = async (provider, action) => {
    setPending(provider);
    try {
      await action();
      navigate('/dashboard');
    } catch {
      // error already captured in AuthContext
    } finally {
      setPending(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6">
      <Logo size={56} />

      <div className="w-full max-w-sm flex flex-col gap-4 rounded-dialog border border-border bg-card p-8 shadow-dialog">
        <div className="flex flex-col gap-1 text-center mb-2">
          <h1 className="font-heading font-semibold text-xl text-text-primary">Welcome back</h1>
          <p className="font-body text-sm text-text-muted">Sign in to continue your roadmap</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-input border border-status-error/40 bg-status-error/10 px-3 py-2 text-status-error text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={() => handle('google', loginWithGoogle)}
          disabled={pending !== null}
          className={cn(
            'flex items-center justify-center gap-3 rounded-button border border-border bg-charcoal px-4 py-3',
            'text-text-primary text-sm font-body shadow-button',
            'hover:border-emerald transition-colors duration-200 disabled:opacity-50'
          )}
        >
          {pending === 'google' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          Continue with Google
        </button>

        <button
          onClick={() => handle('github', loginWithGithub)}
          disabled={pending !== null}
          className={cn(
            'flex items-center justify-center gap-3 rounded-button border border-border bg-charcoal px-4 py-3',
            'text-text-primary text-sm font-body shadow-button',
            'hover:border-emerald transition-colors duration-200 disabled:opacity-50'
          )}
        >
          {pending === 'github' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Github className="h-4 w-4" />
          )}
          Continue with GitHub
        </button>
      </div>

      <span className="text-xs text-text-disabled">Phase 3 — Authentication</span>
    </main>
  );
}