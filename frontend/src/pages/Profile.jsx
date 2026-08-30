import { useState } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/services/profileService';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState(null);

  const hasChanges = name !== (user?.name || '') || avatarUrl !== (user?.avatar_url || '');

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await updateProfile({ name: name.trim(), avatar_url: avatarUrl.trim() || null });
      await refreshUser();
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Could not save your profile.');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Profile</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Your account information</p>
      </div>

      <div className="flex items-center gap-5 rounded-card border border-border bg-card p-6 shadow-card">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-elevated text-xl font-heading text-orange">
            {name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <p className="font-heading font-semibold text-text-primary">{user?.name}</p>
          <p className="font-body text-sm text-text-muted">{user?.email}</p>
          <p className="mt-1 font-body text-xs uppercase tracking-wide text-orange">{user?.role}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-6 shadow-card">
        <h2 className="font-heading font-semibold text-text-primary">Edit Profile</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-input border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Avatar URL</label>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-input border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
          />
          <p className="text-[11px] text-text-muted">
            Paste a link to an image — direct image upload isn't available yet.
          </p>
        </div>

        {status === 'success' && (
          <p className="animate-slide-fade-in flex items-center gap-1.5 text-xs text-status-success">
            <Check className="h-3.5 w-3.5" /> Profile updated.
          </p>
        )}
        {status === 'error' && (
          <p className="animate-slide-fade-in flex items-center gap-1.5 text-xs text-status-error">
            <AlertCircle className="h-3.5 w-3.5" /> {errorMessage}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges || !name.trim()}
          className="flex w-fit items-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}