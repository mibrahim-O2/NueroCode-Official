import { Gauge, Lightbulb, ArrowUpCircle } from 'lucide-react';

export default function AnalysisPanel({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-text-primary">Code Analysis</h3>
        <span className="flex items-center gap-1.5 rounded-badge border border-border px-3 py-1 font-mono text-xs text-mint">
          <Gauge className="h-3.5 w-3.5" /> {analysis.complexity}
        </span>
      </div>

      <p className="font-body text-sm leading-relaxed text-text-secondary">{analysis.feedback}</p>

      {analysis.anti_patterns.length > 0 && (
        <div className="flex flex-col gap-2">
          {analysis.anti_patterns.map((p) => (
            <div
              key={p.key}
              className="flex items-start gap-2 rounded-input border border-status-warning/30 bg-status-warning/5 p-3 text-xs text-text-secondary"
            >
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-warning" />
              {p.message}
            </div>
          ))}
        </div>
      )}

      {analysis.reordered_topic && (
        <div className="flex items-center gap-2 rounded-input border border-emerald/30 bg-emerald/5 p-3 text-xs text-emerald">
          <ArrowUpCircle className="h-3.5 w-3.5 shrink-0" />
          We moved <strong className="mx-1">{analysis.reordered_topic}</strong> earlier in your roadmap based on
          this submission.
        </div>
      )}
    </div>
  );
}