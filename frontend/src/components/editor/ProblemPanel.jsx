import { Clock, Hash } from 'lucide-react';

export default function ProblemPanel({ problem }) {
  return (
    <div className="flex flex-col gap-5 rounded-card border border-border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-heading font-semibold text-lg text-text-primary">{problem.title}</h2>
        <span className="shrink-0 rounded-badge border border-border px-3 py-1 text-xs uppercase text-text-muted">
          {problem.difficulty}
        </span>
      </div>

      <p className="whitespace-pre-line font-body text-sm leading-relaxed text-text-secondary">
        {problem.description}
      </p>

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Clock className="h-3.5 w-3.5" />
        Expected complexity: <span className="text-emerald">{problem.expected_complexity}</span>
      </div>

      <div>
        <h3 className="mb-2 font-heading font-semibold text-sm text-text-primary">Examples</h3>
        <div className="flex flex-col gap-3">
          {problem.examples.map((ex, i) => (
            <div key={i} className="rounded-input border border-border bg-elevated p-3 font-mono text-xs">
              <p className="text-text-muted">
                Input: <span className="text-text-primary">{ex.input}</span>
              </p>
              <p className="mt-1 text-text-muted">
                Output: <span className="text-emerald">{ex.output}</span>
              </p>
              {ex.explanation && <p className="mt-1 text-text-muted">{ex.explanation}</p>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 font-heading font-semibold text-sm text-text-primary">
          <Hash className="h-3.5 w-3.5" /> Constraints
        </h3>
        <ul className="list-inside list-disc font-mono text-xs text-text-secondary">
          {problem.constraints.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}