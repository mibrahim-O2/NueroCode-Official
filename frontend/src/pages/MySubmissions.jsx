import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { getMySubmissions, getComments } from '@/services/submissionCommentService';

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  useEffect(() => {
    getMySubmissions().then(setSubmissions).finally(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    // Bug fix: comments is shared state across every submission row —
    // without clearing it here first, expanding a new submission
    // briefly showed the PREVIOUSLY expanded submission's comments
    // (visibly, not just for a frame, on anything slower than a fast
    // connection) before the real fetch resolved. Clearing immediately
    // guarantees no submission's row can ever display another
    // submission's teacher feedback, even momentarily.
    setExpanded(id);
    setComments([]);
    setCommentsError(null);
    setCommentsLoading(true);
    try {
      setComments(await getComments(id));
    } catch (err) {
      // Bug fix: this call had no error handling at all — a failed
      // request threw unhandled and left the student with no feedback
      // that anything went wrong. Now shows an inline message instead
      // of silently doing nothing.
      setCommentsError(err.message || 'Could not load comments for this submission.');
    } finally {
      setCommentsLoading(false);
    }
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
            <div className="animate-slide-fade-in mt-4 flex flex-col gap-2 border-t border-border pt-4">
              {commentsLoading && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
              {commentsError && (
                <p className="flex items-center gap-1.5 text-xs text-status-error">
                  <AlertCircle className="h-3.5 w-3.5" /> {commentsError}
                </p>
              )}
              {!commentsLoading && !commentsError && comments.length === 0 && (
                <p className="text-xs text-text-muted">No teacher comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="animate-slide-fade-in rounded-input border border-border bg-elevated p-3 text-sm">
                  <p className="text-xs font-semibold text-orange">{c.educator_name}</p>
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