import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Flame, Map, Award, RotateCcw, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

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

  const [dueReviews, setDueReviews] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    heatmap: [],
    practice: [],
    progression: [],
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // AuthContext stores the session token under 'neurocode_token' (see
  // AuthContext.jsx) — this previously checked 'token' / 'access_token' /
  // 'auth_token' instead, none of which are ever actually set, so this
  // request went out with no Authorization header on every load and the
  // charts always fell back to the flat placeholder line below.
  const getStoredToken = () => {
    return (
      localStorage.getItem('neurocode_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('neurocode_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('access_token') ||
      ''
    );
  };

  useEffect(() => {
    refreshUser();
    getReviewDue().then(setDueReviews).catch(() => setDueReviews([]));

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = getStoredToken();

    fetch(`${apiBase}/profile/analytics/user-charts`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return res.json();
      })
      .then((data) => {
        setAnalyticsData({
          heatmap: Array.isArray(data?.heatmap) ? data.heatmap : [],
          practice: Array.isArray(data?.practice) ? data.practice : [],
          progression: Array.isArray(data?.progression) ? data.progression : [],
        });
      })
      .catch((err) => {
        console.warn('Analytics endpoint failed, falling back to profile state:', err.message);
        const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        setAnalyticsData({
          heatmap: [],
          practice: [],
          progression: [
            {
              date: `Joined`,
              shortDay: 'Joined',
              xp: 0,
              level: 1,
            },
            {
              date: `Today, ${todayStr}`,
              shortDay: 'Today',
              xp: user?.xp ?? 0,
              level: user?.level ?? 1,
            },
          ],
        });
      })
      .finally(() => setLoadingAnalytics(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.xp, user?.level, user?.streak]);

  const { today, oneYearAgo } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    return { today: end, oneYearAgo: start };
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-slide-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Welcome back, {firstName}</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Here's where your progress stands today.</p>
      </div>

      {/* Spaced Repetition Due Review Banner */}
      {dueReviews.length > 0 && (user?.preferences?.show_review_reminders ?? true) && (
        <div className="animate-slide-fade-in flex flex-wrap items-center justify-between gap-3 rounded-card border border-orange/30 bg-orange/5 p-5">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-orange shrink-0" />
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

      {/* Real Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Star} label="XP" value={user?.xp ?? 0} accent="bg-orange/10 text-orange" />
        <StatCard icon={Flame} label="Streak" value={`${user?.streak ?? 0}d`} accent="bg-status-warning/10 text-status-warning" />
        <StatCard icon={Map} label="Level" value={user?.level ?? 1} accent="bg-teal/10 text-teal" />
        <StatCard icon={Award} label="Role" value={user?.role ?? 'Student'} accent="bg-gold/10 text-gold" />
      </div>

      {/* 1. Real Activity Heatmap */}
      <div className="rounded-card border border-border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange" />
            <h2 className="font-heading font-semibold text-base text-text-primary">Activity & Daily Submissions</h2>
          </div>
          <span className="text-xs text-text-muted">Past 12 Months</span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[680px]">
            <CalendarHeatmap
              startDate={oneYearAgo}
              endDate={today}
              values={analyticsData.heatmap}
              showMonthLabels
              gutterSize={2}
              classForValue={(val) => {
                if (!val || val.count === 0) return 'fill-[#1a1a24]';
                if (val.count === 1) return 'fill-orange/30';
                if (val.count <= 3) return 'fill-orange/60';
                return 'fill-orange';
              }}
              titleForValue={(val) => (val?.date ? `${val.date}: ${val.count} submissions` : 'No activity')}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-[11px] text-text-muted">
          <span>Less</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-[#1a1a24]" />
          <span className="h-2.5 w-2.5 rounded-sm bg-orange/30" />
          <span className="h-2.5 w-2.5 rounded-sm bg-orange/60" />
          <span className="h-2.5 w-2.5 rounded-sm bg-orange" />
          <span>More</span>
        </div>
      </div>

      {/* 2. Real Charts: XP Growth Across Actual Dates & Solved Topic Counts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Real XP Progression */}
        <div className="rounded-card border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange" />
              <h3 className="font-heading font-semibold text-sm text-text-primary">XP Progression (Real Dates)</h3>
            </div>
            <span className="text-[11px] font-mono text-orange">Current: {user?.xp ?? 0} XP</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.progression}>
                <defs>
                  <linearGradient id="dashboardXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#ff6b00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262630" vertical={false} />
                <XAxis
                  dataKey="shortDay"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#14141b', borderColor: '#262630', borderRadius: '8px' }}
                  labelStyle={{ color: '#ff6b00', fontWeight: 'bold' }}
                  formatter={(value) => [`${value} XP`, 'Total XP Earned']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#ff6b00"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashboardXp)"
                  dot={{ fill: '#ff6b00', r: 3 }}
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Practice Questions Solved Per Topic */}
        <div className="rounded-card border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal" />
            <h3 className="font-heading font-semibold text-sm text-text-primary">Practice Solved by Topic</h3>
          </div>

          <div className="h-64 w-full">
            {analyticsData.practice.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-text-muted">
                No practice problems solved yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.practice}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262630" vertical={false} />
                  <XAxis dataKey="topic" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#14141b', borderColor: '#262630', borderRadius: '8px' }}
                    cursor={{ fill: '#262630', opacity: 0.3 }}
                    formatter={(value) => [`${value} problems`, 'Solved']}
                  />
                  <Bar dataKey="solved" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Roadmap Direct Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-card border border-border bg-card p-6 shadow-card">
        <div>
          <h2 className="font-heading font-semibold text-lg text-text-primary">Continue Your Learning Path</h2>
          <p className="mt-1 font-body text-xs text-text-muted">
            Track prerequisites, practice algorithms, and pass 25-problem challenge checkpoints.
          </p>
        </div>
        <Link
          to="/roadmap"
          className="inline-flex items-center justify-center rounded-button bg-orange px-5 py-2.5 text-xs font-body font-semibold text-white transition-all duration-200 hover:bg-orange-hover active:scale-95"
        >
          Open Roadmap
        </Link>
      </div>
    </div>
  );
}
