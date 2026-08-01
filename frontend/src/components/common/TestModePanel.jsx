import { useState } from 'react';
import { FlaskConical, X, RotateCcw, Zap, Award, Loader2 } from 'lucide-react';
import {
  unlockAllNodes,
  completeRoadmapThrough,
  resetRoadmapTestMode,
  adjustUserStats,
  simulateSubmission,
  simulateCredential,
  clearSimulatedCredentials,
} from '@/services/testModeService';
import { cn } from '@/lib/utils';

const TABS = ['Roadmap', 'Practice', 'Credentials'];
const BADGES = ['bronze', 'silver', 'gold', 'platinum'];

export default function TestModePanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('Roadmap');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const run = async (label, fn) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage(`${label} — done. Refresh the page to see changes.`);
    } catch (err) {
      setMessage(`${label} failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border border-status-warning/50 bg-charcoal px-4 py-2.5 text-xs font-body text-status-warning shadow-dialog transition-colors duration-200 hover:bg-status-warning/10"
      >
        <FlaskConical className="h-4 w-4" /> Test Mode
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 flex w-80 flex-col gap-3 rounded-dialog border border-status-warning/40 bg-charcoal p-4 shadow-dialog">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-heading text-sm font-semibold text-status-warning">
          <FlaskConical className="h-4 w-4" /> Test Mode
        </span>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex overflow-hidden rounded-input border border-border text-xs">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-1.5',
              tab === t ? 'bg-status-warning/20 text-status-warning' : 'text-text-muted hover:text-text-primary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Roadmap' && (
        <div className="flex flex-col gap-2">
          <button
            disabled={busy}
            onClick={() => run('Unlock all topics', unlockAllNodes)}
            className="rounded-input border border-border px-3 py-2 text-left text-xs text-text-secondary hover:border-emerald"
          >
            Unlock all topics
          </button>
          <button
            disabled={busy}
            onClick={() => run('Complete first cluster', () => completeRoadmapThrough(1))}
            className="rounded-input border border-border px-3 py-2 text-left text-xs text-text-secondary hover:border-emerald"
          >
            Complete Arrays + Strings
          </button>
          <button
            disabled={busy}
            onClick={() => run('Adjust stats', () => adjustUserStats(1250, 3, 7))}
            className="rounded-input border border-border px-3 py-2 text-left text-xs text-text-secondary hover:border-emerald"
          >
            Set XP 1250 / Level 3 / Streak 7
          </button>
          <button
            disabled={busy}
            onClick={() => run('Reset roadmap', resetRoadmapTestMode)}
            className="flex items-center gap-1.5 rounded-input border border-status-error/40 px-3 py-2 text-left text-xs text-status-error hover:bg-status-error/10"
          >
            <RotateCcw className="h-3 w-3" /> Reset roadmap
          </button>
        </div>
      )}

      {tab === 'Practice' && (
        <div className="flex flex-col gap-2">
          <button
            disabled={busy}
            onClick={() => run('Simulate passing submission', () => simulateSubmission('Arrays', 'medium', 'python', 'pass', true))}
            className="rounded-input border border-emerald/40 px-3 py-2 text-left text-xs text-emerald hover:bg-emerald/10"
          >
            <Zap className="mr-1 inline h-3 w-3" /> Simulate passing submission
          </button>
          <button
            disabled={busy}
            onClick={() => run('Simulate failing submission', () => simulateSubmission('Arrays', 'medium', 'python', 'fail', true))}
            className="rounded-input border border-status-error/40 px-3 py-2 text-left text-xs text-status-error hover:bg-status-error/10"
          >
            <Zap className="mr-1 inline h-3 w-3" /> Simulate failing submission
          </button>
          <p className="text-[10px] text-text-disabled">
            Visit /practice for an instant canned problem and one-click pass/fail simulation buttons.
          </p>
        </div>
      )}

      {tab === 'Credentials' && (
        <div className="flex flex-col gap-2">
          {BADGES.map((b) => (
            <button
              key={b}
              disabled={busy}
              onClick={() => run(`Simulate ${b} credential`, () => simulateCredential(b))}
              className="flex items-center gap-1.5 rounded-input border border-gold/40 px-3 py-2 text-left text-xs capitalize text-gold hover:bg-gold/10"
            >
              <Award className="h-3 w-3" /> Generate {b} credential
            </button>
          ))}
          <button
            disabled={busy}
            onClick={() => run('Clear simulated credentials', clearSimulatedCredentials)}
            className="flex items-center gap-1.5 rounded-input border border-status-error/40 px-3 py-2 text-left text-xs text-status-error hover:bg-status-error/10"
          >
            <RotateCcw className="h-3 w-3" /> Clear simulated credentials
          </button>
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3 w-3 animate-spin" /> Working…
        </div>
      )}
      {message && <p className="text-[11px] text-text-muted">{message}</p>}
    </div>
  );
}