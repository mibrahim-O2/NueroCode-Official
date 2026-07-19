import { Star, Flame, Map, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-border bg-card p-5 shadow-card transition-colors duration-200 hover:border-emerald/40">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-input ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-heading font-bold text-xl text-text-primary capitalize">{value}</p>
        <p className="font-body text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Welcome back, {firstName}</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Here's where your progress stands today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Star} label="XP" value={user?.xp ?? 0} accent="bg-emerald/10 text-emerald" />
        <StatCard icon={Flame} label="Streak" value={user?.streak ?? 0} accent="bg-status-warning/10 text-status-warning" />
        <StatCard icon={Map} label="Level" value={user?.level ?? 1} accent="bg-mint/10 text-mint" />
        <StatCard icon={Award} label="Role" value={user?.role} accent="bg-gold/10 text-gold" />
      </div>

      <div className="rounded-card border border-border bg-card p-8 shadow-card">
        <h2 className="font-heading font-semibold text-lg text-text-primary">Continue Learning</h2>
        <p className="mt-1 font-body text-sm text-text-muted">
          Your adaptive roadmap will appear here once the Roadmap module is live.
        </p>
      </div>
    </div>
  );
}