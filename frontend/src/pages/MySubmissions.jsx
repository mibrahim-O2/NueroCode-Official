import { useEffect, useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { getMySubmissions, getComments } from '@/services/submissionCommentService';

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    getMySubmissions().then(setSubmissions).finally(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    setComments(await getComments(id));
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-text-muted" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">My Submissions</h1>
      {submissions.map((s) => (
        <div key={s.id} className="rounded-card border border-border bg-card p-5 shadow-card">
          <button onClick={() => toggle(s.id)} className="flex w-full items-center justify-between text-left">
            <div>
              <p className="font-heading text-sm font-semibold text-text-primary">{s.topic} — {s.difficulty}</p>
              <p className="text-xs text-text-muted">{new Date(s.created_at).toLocaleString()}</p>
            </div>
            <MessageSquare className="h-4 w-4 text-text-muted" />
          </button>
          {expanded === s.id && (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              {comments.length === 0 && <p className="text-xs text-text-muted">No teacher comments yet.</p>}
              {comments.map((c) => (
                <div key={c.id} className="rounded-input border border-border bg-elevated p-3 text-sm">
                  <p className="text-xs font-semibold text-emerald">{c.educator_name}</p>
                  <p className="mt-1 text-text-secondary">{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {submissions.length === 0 && <p className="text-sm text-text-muted">No submissions yet.</p>}
    </div>
  );
}