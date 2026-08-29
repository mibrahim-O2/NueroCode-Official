import { useState } from 'react';
import { addComment, getComments } from '@/services/submissionCommentService';

export default function TeacherCommentRow({ submission }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  const load = async () => {
    setOpen((o) => !o);
    if (!open) setComments(await getComments(submission.id));
  };

  const submit = async () => {
    if (!text.trim()) return;
    const c = await addComment(submission.id, text.trim());
    setComments((prev) => [...prev, c]);
    setText('');
  };

  return (
    <tr className="border-b border-border transition-colors duration-200 hover:bg-elevated/50">
      <td className="px-4 py-3 text-sm text-text-secondary">{submission.topic}</td>
      <td className="px-4 py-3 text-sm text-text-secondary">{submission.complexity || '—'}</td>
      <td className="px-4 py-3">
        <button onClick={load} className="text-xs text-orange underline transition-opacity duration-200 hover:opacity-80">
          {open ? 'Hide' : 'Comment'}
        </button>
        {open && (
          <div className="animate-slide-fade-in mt-2 flex flex-col gap-2">
            {comments.map((c) => (
              <p key={c.id} className="text-xs text-text-muted">
                <span className="font-semibold text-orange">{c.educator_name}:</span> {c.comment}
              </p>
            ))}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Leave feedback…"
                className="flex-1 rounded-input border border-border bg-elevated px-2 py-1 text-xs outline-none transition-colors duration-200 focus:border-orange"
              />
              <button
                onClick={submit}
                className="rounded-input bg-orange px-2 py-1 text-xs text-white transition-all duration-200 hover:bg-orange-hover active:scale-95"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}