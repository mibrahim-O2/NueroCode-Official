import { useEffect, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { getLeaderboard } from '@/services/roadmapService';
import { cn } from '@/lib/utils';

const RANK_STYLES = ['text-gold', 'text-text-secondary', 'text-status-warning'];

export default function LeaderboardCard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-gold" />
        <h3 className="font-heading font-semibold text-text-primary">Leaderboard</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {entries.map((entry, i) => (
            <li
              key={entry.id}
              className="-mx-2 flex items-center gap-3 rounded-input px-2 py-1 transition-colors duration-200 hover:bg-elevated"
            >
              <span className={cn('w-4 text-xs font-heading font-bold', RANK_STYLES[i] || 'text-text-muted')}>
                {i + 1}
              </span>
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt={entry.name} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-elevated text-[10px] text-orange">
                  {entry.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-text-primary">{entry.name}</p>
              </div>
              <span className="font-body text-xs text-orange">{entry.xp} XP</span>
            </li>
          ))}
          {entries.length === 0 && (
            <p className="py-4 text-center text-xs text-text-muted">No rankings yet</p>
          )}
        </ul>
      )}
    </div>
  );
}