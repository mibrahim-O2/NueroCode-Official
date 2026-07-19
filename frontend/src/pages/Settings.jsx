import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Settings</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Manage your preferences</p>
      </div>

      <div className="rounded-card border border-border bg-card p-6 shadow-card">
        <h2 className="font-heading font-semibold text-text-primary">Appearance</h2>
        <p className="mt-1 font-body text-sm text-text-muted">Choose how NeuroCode looks on this device.</p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={cn(
              'flex items-center gap-2 rounded-input border px-4 py-2 text-sm font-body transition-colors duration-200',
              theme === 'dark' ? 'border-emerald text-emerald' : 'border-border text-text-secondary hover:border-emerald'
            )}
          >
            <Moon className="h-4 w-4" /> Dark
          </button>
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={cn(
              'flex items-center gap-2 rounded-input border px-4 py-2 text-sm font-body transition-colors duration-200',
              theme === 'light' ? 'border-emerald text-emerald' : 'border-border text-text-secondary hover:border-emerald'
            )}
          >
            <Sun className="h-4 w-4" /> Light
          </button>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-6 text-sm text-text-muted shadow-card">
        Notification and account preferences will be available in a future phase.
      </div>
    </div>
  );
}