import { LogOut } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const ROLE_STYLES = {
  admin: 'bg-gold/15 text-gold border-gold/40',
  educator: 'bg-mint/15 text-mint border-mint/40',
  student: 'bg-emerald/15 text-emerald border-emerald/40',
};

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
      <Logo variant="icon" size={56} />

      <div className="w-full max-w-md flex flex-col items-center gap-4 rounded-dialog border border-border bg-card p-8 shadow-dialog">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className="h-20 w-20 rounded-full border-2 border-emerald object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full border-2 border-emerald bg-elevated flex items-center justify-center text-2xl font-heading text-emerald">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        <div className="flex flex-col items-center gap-1">
          <h1 className="font-heading font-semibold text-lg text-text-primary">{user?.name}</h1>
          <p className="font-body text-sm text-text-muted">{user?.email}</p>
        </div>

        <span
          className={cn(
            'rounded-badge border px-3 py-1 text-xs font-body uppercase tracking-wide',
            ROLE_STYLES[user?.role] || ROLE_STYLES.student
          )}
        >
          {user?.role}
        </span>

        <div className="grid grid-cols-3 gap-4 w-full mt-2 text-center">
          <div>
            <p className="font-heading font-bold text-emerald">{user?.xp ?? 0}</p>
            <p className="text-xs text-text-muted">XP</p>
          </div>
          <div>
            <p className="font-heading font-bold text-emerald">{user?.level ?? 1}</p>
            <p className="text-xs text-text-muted">Level</p>
          </div>
          <div>
            <p className="font-heading font-bold text-emerald">{user?.streak ?? 0}</p>
            <p className="text-xs text-text-muted">Streak</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-button border border-border px-4 py-2 text-sm text-text-secondary hover:border-status-error hover:text-status-error transition-colors duration-200 mt-2"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </main>
  );
}