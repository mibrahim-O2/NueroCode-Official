import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Timer({ durationSeconds = 1200, resetKey, onExpire }) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    setRemaining(durationSeconds);
    hasExpiredRef.current = false;
  }, [resetKey, durationSeconds]);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0]);

  // Fires onExpire exactly once per countdown. hasExpiredRef (not just
  // checking remaining === 0 inline) is what prevents this from firing
  // repeatedly on every render while the timer sits at zero — without
  // it, a parent's onExpire handler could be invoked many times in a
  // row for a single expiration.
  useEffect(() => {
    if (remaining === 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpire?.();
    }
  }, [remaining, onExpire]);

  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');
  const isDone = remaining === 0;
  const isLow = remaining <= 60 && !isDone;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-input border px-3 py-1.5 font-mono text-xs transition-colors duration-300',
        isDone
          ? 'border-status-error text-status-error'
          : isLow
            ? 'border-status-warning text-status-warning animate-pulse'
            : 'border-border text-text-muted'
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {minutes}:{seconds}
    </div>
  );
}