import { useState } from 'react';
import { Sun, Moon, Loader2, Check } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { updatePreferences } from '@/services/profileService';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const [showReviewReminders, setShowReviewReminders] = useState(
    user?.preferences?.show_review_reminders ?? true
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggleReminders = async () => {
    const next = !showReviewReminders;
    setShowReviewReminders(next);
    setSaving(true);
    try {
      await updatePreferences({ show_review_reminders: next });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setShowReviewReminders(!next); // revert on failure
    } finally {
      setSaving(false);
    }
  };

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
              'flex items-center gap-2 rounded-input border px-4 py-2 text-sm font-body transition-all duration-200 active:scale-95',
              theme === 'dark' ? 'border-orange text-orange' : 'border-border text-text-secondary hover:border-orange'
            )}
          >
            <Moon className="h-4 w-4" /> Dark
          </button>
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={cn(
              'flex items-center gap-2 rounded-input border px-4 py-2 text-sm font-body transition-all duration-200 active:scale-95',
              theme === 'light' ? 'border-orange text-orange' : 'border-border text-text-secondary hover:border-orange'
            )}
          >
            <Sun className="h-4 w-4" /> Light
          </button>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-6 shadow-card">
        <h2 className="font-heading font-semibold text-text-primary">Reminders</h2>
        <p className="mt-1 font-body text-sm text-text-muted">
          NeuroCode doesn't send emails or push notifications yet — this controls the in-app
          reminder shown on your Dashboard.
        </p>

        <div className="mt-4 flex items-center justify-between rounded-input border border-border bg-elevated px-4 py-3">
          <div>
            <p className="text-sm text-text-primary">Show Quick Review reminders</p>
            <p className="text-xs text-text-muted">Nudges to revisit topics you haven't practiced recently</p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />}
            {saved && <Check className="h-3.5 w-3.5 text-status-success" />}
            <button
              onClick={handleToggleReminders}
              disabled={saving}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors duration-200',
                showReviewReminders ? 'bg-orange' : 'bg-elevated border border-border'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-button transition-transform duration-200',
                  showReviewReminders ? 'translate-x-[22px]' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}