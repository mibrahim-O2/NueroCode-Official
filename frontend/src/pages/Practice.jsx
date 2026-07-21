import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { generateProblem } from '@/services/problemService';
import ProblemPanel from '@/components/editor/ProblemPanel';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const ROADMAP_DIFFICULTY_MAP = { beginner: 'easy', intermediate: 'medium', advanced: 'hard' };

export default function Practice() {
  const [searchParams] = useSearchParams();
  const rawDifficulty = searchParams.get('difficulty');

  const [topic, setTopic] = useState(searchParams.get('topic') || 'Arrays');
  const [difficulty, setDifficulty] = useState(
    ROADMAP_DIFFICULTY_MAP[rawDifficulty] || rawDifficulty || 'medium'
  );
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateProblem(topic, difficulty);
      setProblem(result);
    } catch (err) {
      setError(err.message || 'Failed to generate a problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Practice</h1>
        <p className="mt-1 font-body text-sm text-text-muted">AI-generated problems tailored to your roadmap</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Difficulty</label>
          <div className="flex overflow-hidden rounded-input border border-border">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-2 text-xs capitalize transition-colors duration-200 ${
                  difficulty === d ? 'bg-emerald text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="flex items-center gap-2 rounded-button bg-emerald px-4 py-2.5 text-sm font-body text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {problem ? 'Generate Another' : 'Generate Problem'}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-input border border-status-error/40 bg-status-error/10 px-4 py-3 text-sm text-status-error">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
          <button onClick={handleGenerate} className="flex items-center gap-1.5 text-xs underline">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {loading && !problem && (
        <div className="flex h-40 items-center justify-center rounded-card border border-border bg-card shadow-card">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      )}

      {problem && <ProblemPanel problem={problem} />}
    </div>
  );
}