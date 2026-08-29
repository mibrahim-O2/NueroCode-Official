import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_STYLES = {
  low: 'text-text-muted',
  medium: 'text-status-warning',
  high: 'text-status-error',
  critical: 'text-status-error',
};

export default function ProctoringLogFeed({ log }) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-card p-4 shadow-card">
      <h3 className="font-heading font-semibold text-sm text-text-primary">Live Proctoring Log</h3>
      <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
        {log.length === 0 && <p className="text-xs text-text-muted">No events yet — session is clean.</p>}
        {log.map((entry, i) => (
          <div key={i} className="animate-slide-fade-in flex items-start gap-2 text-xs">
            {entry.severity === 'critical' || entry.severity === 'high' ? (
              <AlertTriangle className={cn('mt-0.5 h-3 w-3 shrink-0', SEVERITY_STYLES[entry.severity])} />
            ) : (
              <Info className={cn('mt-0.5 h-3 w-3 shrink-0', SEVERITY_STYLES[entry.severity])} />
            )}
            <span className={SEVERITY_STYLES[entry.severity]}>{entry.message}</span>
            <span className="ml-auto shrink-0 text-text-disabled">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}