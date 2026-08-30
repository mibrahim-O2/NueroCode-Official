import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Flame, Map, Award, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getReviewDue } from '@/services/roadmapService';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-orange/40 hover:shadow-dialog">
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
  const { user, refreshUser } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Dashboard (and the shared Topbar, which reads the same context) are
  // the primary places a student's XP/Level/Streak are displayed.
  // Refreshing on every mount ensures that navigating back to this page
  // — not just a hard reload — reflects any admin reset that happened
  // in the meantime.
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [dueReviews, setDueReviews] = useState([]);
  useEffect(() => {
    getReviewDue().then(setDueReviews).catch(() => setDueReviews([]));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Welcome back, {firstName}</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Here's where your progress stands today.</p>
      </div>

      {dueReviews.length > 0 && (user?.preferences?.show_review_reminders ?? true) && (
        <div className="animate-slide-fade-in flex flex-wrap items-center justify-between gap-3 rounded-card border border-orange/30 bg-orange/5 p-5">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-orange" />
            <div>
              <p className="font-heading text-sm font-semibold text-text-primary">Quick Review</p>
              <p className="text-xs text-text-muted">
                You completed <strong>{dueReviews[0].topic}</strong> {dueReviews[0].days_since_completion} days ago — try one short refresher.
              </p>
            </div>
          </div>
          <Link
            to={`/practice?topic=${encodeURIComponent(dueReviews[0].topic)}`}
            className="rounded-button bg-orange px-4 py-2 text-xs font-body text-white transition-all duration-200 hover:bg-orange-hover active:scale-95"
          >
            Review Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Star} label="XP" value={user?.xp ?? 0} accent="bg-orange/10 text-orange" />
        <StatCard icon={Flame} label="Streak" value={user?.streak ?? 0} accent="bg-status-warning/10 text-status-warning" />
        <StatCard icon={Map} label="Level" value={user?.level ?? 1} accent="bg-teal/10 text-teal" />
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