import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Award } from 'lucide-react';
import { getStudentTimeline } from '@/services/adminService';
import ViolationBadges from '@/components/common/ViolationBadges';
import { cn } from '@/lib/utils';

export default function StudentTimeline() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentTimeline(userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="flex w-fit items-center gap-2 text-sm text-text-muted hover:text-emerald"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cohort
      </button>

      <h1 className="font-heading font-semibold text-2xl text-text-primary">Student Timeline</h1>

      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 font-heading font-semibold text-text-primary">Roadmap Progress</h2>
        <div className="flex flex-wrap gap-2">
          {data.roadmap.map((n) => (
            <span
              key={n.id}
              className={cn(
                'rounded-badge border px-3 py-1 text-xs',
                n.status === 'completed' && 'border-emerald/40 bg-emerald/10 text-emerald',
                n.status === 'locked' && 'border-border text-text-disabled',
                (n.status === 'unlocked' || n.status === 'in_progress') && 'border-emerald/40 text-emerald'
              )}
            >
              {n.topic}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-border bg-card shadow-card">
        <h2 className="p-5 pb-0 font-heading font-semibold text-text-primary">Assessments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-text-muted">
                <th className="px-5 py-3 font-normal">Cluster</th>
                <th className="px-5 py-3 font-normal">Score</th>
                <th className="px-5 py-3 font-normal">Integrity</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Violations</th>
                <th className="px-5 py-3 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.assessments.map((a) => (
                <tr
                  key={a.id}
                  className={cn('border-b border-border last:border-0', a.status === 'flagged' && 'bg-status-error/5')}
                >
                  <td className="px-5 py-3 text-text-secondary">{a.topic_cluster}</td>
                  <td className="px-5 py-3 text-text-secondary">{a.assessment_score ?? '—'}%</td>
                  <td className={cn('px-5 py-3', a.status === 'flagged' ? 'font-semibold text-status-error' : 'text-text-secondary')}>
                    {a.integrity_score ?? '—'}%
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'rounded-badge px-2 py-0.5 text-xs',
                        a.status === 'flagged' && 'bg-status-error/10 text-status-error',
                        a.status === 'completed' && 'bg-emerald/10 text-emerald',
                        a.status === 'in_progress' && 'bg-status-warning/10 text-status-warning'
                      )}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {a.status === 'flagged' ? (
                      <ViolationBadges violations={a.violation_types} />
                    ) : (
                      <span className="text-text-disabled">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-text-muted">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.assessments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-muted">
                    No assessments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-heading font-semibold text-text-primary">
          <Award className="h-4 w-4 text-gold" /> Credentials
        </h2>
        {data.credentials.length === 0 ? (
          <p className="text-sm text-text-muted">No credentials earned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.credentials.map((c) => (
              <span key={c.id} className="rounded-badge border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold">
                {c.badge_level.toUpperCase()} — {c.topics_mastered.join(', ')}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-card border border-border bg-card shadow-card">
        <h2 className="p-5 pb-0 font-heading font-semibold text-text-primary">Recent Submissions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-text-muted">
                <th className="px-5 py-3 font-normal">Topic</th>
                <th className="px-5 py-3 font-normal">Language</th>
                <th className="px-5 py-3 font-normal">Complexity</th>
                <th className="px-5 py-3 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.submissions.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text-secondary">{s.topic}</td>
                  <td className="px-5 py-3 text-text-secondary">{s.language}</td>
                  <td className="px-5 py-3 text-text-secondary">{s.complexity || '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.submissions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-text-muted">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}