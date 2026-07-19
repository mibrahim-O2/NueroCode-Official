import { useAuth } from '@/context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Profile</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Your account information</p>
      </div>

      <div className="flex items-center gap-5 rounded-card border border-border bg-card p-6 shadow-card">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-elevated text-xl font-heading text-emerald">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <p className="font-heading font-semibold text-text-primary">{user?.name}</p>
          <p className="font-body text-sm text-text-muted">{user?.email}</p>
          <p className="mt-1 font-body text-xs uppercase tracking-wide text-emerald">{user?.role}</p>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-6 text-sm text-text-muted shadow-card">
        Profile editing will be available in a future phase.
      </div>
    </div>
  );
}