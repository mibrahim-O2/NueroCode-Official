import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TestResultsPanel({ result }) {
  if (!result) return null;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-text-primary">Test Results</h3>
        <span
          className={cn(
            'rounded-badge px-3 py-1 text-xs font-body',
            result.all_passed ? 'animate-celebrate bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'
          )}
        >
          {result.passed_count}/{result.total_count} passed
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {result.results.map((r) => (
          <div
            key={r.case}
            className={cn(
              'rounded-input border p-3 font-mono text-xs',
              r.passed ? 'border-status-success/30 bg-status-success/5' : 'border-status-error/30 bg-status-error/5'
            )}
          >
            <div className="flex items-center gap-2">
              {r.passed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-status-error" />
              )}
              <span className={r.passed ? 'text-status-success' : 'text-status-error'}>Test case {r.case}</span>
            </div>
            <p className="mt-1.5 text-text-muted">
              Input: <span className="text-text-primary">{JSON.stringify(r.input)}</span>
            </p>
            {!r.passed && (
              <>
                <p className="mt-1 text-text-muted">
                  Expected: <span className="text-status-success">{r.expected}</span>
                </p>
                <p className="mt-1 text-text-muted">
                  Actual: <span className="text-status-error">{r.actual}</span>
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}