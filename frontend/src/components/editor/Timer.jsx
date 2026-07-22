import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Timer({ durationSeconds = 1200, resetKey }) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [resetKey, durationSeconds]);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0]);

  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');
  const isDone = remaining === 0;
  const isLow = remaining <= 60 && !isDone;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-input border px-3 py-1.5 font-mono text-xs',
        isDone
          ? 'border-status-error text-status-error'
          : isLow
            ? 'border-status-warning text-status-warning'
            : 'border-border text-text-muted'
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {minutes}:{seconds}
    </div>
  );
}