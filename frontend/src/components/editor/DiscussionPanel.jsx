import { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDiscussions, postDiscussion } from '@/services/discussionService';

// No submission code is ever automatically shown here — anything a
// student wants to share is something they choose to type themselves,
// no separate "share my solution" consent mechanism needed.
export default function DiscussionPanel({ problemId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDiscussions(problemId).then(setComments).finally(() => setLoading(false));
  }, [problemId]);

  const post = async () => {
    if (!text.trim()) return;
    const c = await postDiscussion(problemId, text.trim());
    setComments((prev) => [...prev, { ...c, user_name: user?.name }]);
    setText('');
  };

  return (
    <div className="rounded-card border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-text-primary">
        <Users className="h-4 w-4 text-emerald" /> How others solved this
      </h3>
      {loading ? (
        <Loader2 className="mt-3 h-4 w-4 animate-spin text-text-muted" />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {comments.length === 0 && <p className="text-xs text-text-muted">No discussion yet — be the first.</p>}
          {comments.map((c) => (
            <div key={c.id} className="rounded-input border border-border bg-elevated p-3 text-sm">
              <p className="text-xs font-semibold text-emerald">{c.user_name}</p>
              <p className="mt-1 text-text-secondary">{c.comment}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your approach or a tip…"
          className="flex-1 rounded-input border border-border bg-elevated px-3 py-2 text-sm"
        />
        <button onClick={post} className="rounded-input bg-emerald px-3 py-2 text-xs text-white">
          Post
        </button>
      </div>
    </div>
  );
}