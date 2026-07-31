import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { getCohortOverview, getSkillGaps, getClassLeaderboard } from '@/services/adminService';
import ViolationBadges from '@/components/common/ViolationBadges';
import { cn } from '@/lib/utils';
export default function Educator() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCohortOverview(), getSkillGaps(), getClassLeaderboard()])
      .then(([s, g, l]) => {
        setStudents(s);
        setSkillGaps(g);
        setLeaderboard(l);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  const avgTopics = students.length
    ? Math.round(students.reduce((sum, s) => sum + s.topics_completed, 0) / students.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Educator Portal</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Cohort-wide progress and skill gap analysis</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-card border border-border bg-card p-5 shadow-card">
          <Users className="h-8 w-8 text-emerald" />
          <div>
            <p className="font-heading font-bold text-xl text-text-primary">{students.length}</p>
            <p className="text-xs text-text-muted">Students</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-card border border-border bg-card p-5 shadow-card">
          <AlertTriangle className="h-8 w-8 text-status-error" />
          <div>
            <p className="font-heading font-bold text-xl text-text-primary">
              {students.reduce((sum, s) => sum + s.integrity_flags, 0)}
            </p>
            <p className="text-xs text-text-muted">Integrity Flags</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-card border border-border bg-card p-5 shadow-card">
          <TrendingUp className="h-8 w-8 text-mint" />
          <div>
            <p className="font-heading font-bold text-xl text-text-primary">{avgTopics}</p>
            <p className="text-xs text-text-muted">Avg. Topics Completed</p>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="mb-4 font-heading font-semibold text-text-primary">Common Error Patterns</h2>
        {skillGaps.length === 0 ? (
          <p className="text-sm text-text-muted">No weak-topic signals recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={skillGaps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D34" />
              <XAxis dataKey="topic" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1C1F24', border: '1px solid #2A2D34', borderRadius: 8, color: '#F8FAFC' }} />
              <Bar dataKey="count" fill="#00A676" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-card border border-border bg-card shadow-card">
        <h2 className="p-5 pb-0 font-heading font-semibold text-text-primary">Student Progress</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-text-muted">
                <th className="px-5 py-3 font-normal">Name</th>
                <th className="px-5 py-3 font-normal">XP</th>
                <th className="px-5 py-3 font-normal">Level</th>
                <th className="px-5 py-3 font-normal">Topics Completed</th>
                <th className="px-5 py-3 font-normal">Integrity Flags</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/educator/students/${s.id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-elevated"
                >
                  <td className="px-5 py-3 text-emerald hover:underline">{s.name}</td>
                  <td className="px-5 py-3 text-text-secondary">{s.xp}</td>
                  <td className="px-5 py-3 text-text-secondary">{s.level}</td>
                  <td className="px-5 py-3 text-text-secondary">{s.topics_completed}</td>
                  <td className="px-5 py-3">
                    {s.integrity_flags > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-status-error">{s.integrity_flags}</span>
                        <ViolationBadges violations={s.violation_types} />
                      </div>
                    ) : (
                      <span className="text-text-secondary">0</span>
                    )}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                    No students yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="mb-4 font-heading font-semibold text-text-primary">Class Leaderboard</h2>
        <ul className="flex flex-col gap-2">
          {leaderboard.slice(0, 10).map((entry, i) => (
            <li key={entry.id} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                {i + 1}. {entry.name}
              </span>
              <span className="text-emerald">{entry.xp} XP</span>
            </li>
          ))}
          {leaderboard.length === 0 && <p className="text-sm text-text-muted">No rankings yet.</p>}
        </ul>
      </div>
    </div>
  );
}