import { useState } from 'react';
import { BookCheck, Loader2 } from 'lucide-react';
import { getOfficialSolution } from '@/services/solutionService';

export default function OfficialSolutionPanel({ problemId }) {
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reveal = async () => {
    setLoading(true);
    setError(null);
    try {
      setSolution(await getOfficialSolution(problemId));
    } catch (err) {
      setError(err.message || 'Could not load the official solution.');
    } finally {
      setLoading(false);
    }
  };

  if (!solution) {
    return (
      <button
        onClick={reveal}
        disabled={loading}
        className="flex items-center gap-2 rounded-button border border-gold/40 px-4 py-2.5 text-sm text-gold hover:bg-gold/10 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookCheck className="h-4 w-4" />}
        View Official Solution
      </button>
    );
  }

  return (
    <div className="rounded-card border border-gold/30 bg-card p-5">
      {error && <p className="text-xs text-status-error">{error}</p>}
      <h3 className="font-heading text-sm font-semibold text-gold">Official Solution</h3>
      <pre className="mt-3 overflow-x-auto rounded-input bg-elevated p-3 font-mono text-xs text-text-secondary">
        {solution.solution_code}
      </pre>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">{solution.explanation}</p>
    </div>
  );
}