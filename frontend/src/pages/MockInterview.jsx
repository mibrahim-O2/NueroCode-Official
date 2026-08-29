import { useState } from 'react';
import { Timer as TimerIcon, Loader2, ShieldAlert } from 'lucide-react';
import { startInterview, submitInterview } from '@/services/interviewService';
import CodeEditor, { DEFAULT_SNIPPETS } from '@/components/editor/CodeEditor';
import Timer from '@/components/editor/Timer';
import ProblemPanel from '@/components/editor/ProblemPanel';

// Deliberately no ChatWidget import anywhere in this file — unassisted
// by design, same principle Assessment already enforces.

export default function MockInterview() {
  const [stage, setStage] = useState('setup'); // setup | active | results
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState('medium');
  const [session, setSession] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await startInterview(topic, difficulty);
      setSession(s);
      setCode(DEFAULT_SNIPPETS.python);
      setStage('active');
    } catch (err) {
      setError(err.message || 'Could not start the interview.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const outcome = await submitInterview(session.id, language, code);
      setResult(outcome);
      setStage('results');
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'setup') {
    return (
      <div className="mx-auto max-w-lg rounded-card border border-border bg-card p-8 shadow-card">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Mock Interview</h1>
        <p className="mt-2 text-sm text-text-muted">
          Timed, unassisted — no hints, no chatbot. Just like a real interview.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-xs text-text-muted">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 w-full rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1 w-full rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          {error && <p className="animate-slide-fade-in text-xs text-status-error">{error}</p>}
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TimerIcon className="h-4 w-4" />}
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'active') {
    return (
      <div className="animate-fade-in grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-badge border border-status-warning/30 bg-status-warning/10 px-3 py-1.5 text-xs text-status-warning">
            <ShieldAlert className="h-3.5 w-3.5" /> Unassisted session — no hints available
          </div>
          <ProblemPanel problem={session} />
          <Timer durationSeconds={session.time_limit_seconds} onExpire={handleSubmit} />
        </div>
        <div className="flex flex-col gap-4">
          <CodeEditor language={language} value={code} onChange={setCode} />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Solution'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-fade-in mx-auto max-w-lg rounded-card border border-border bg-card p-8 text-center shadow-card">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">
        {result.all_passed ? 'Solved it!' : 'Interview Complete'}
      </h1>
      <div className="mt-6 grid grid-cols-2 gap-4 text-left text-sm">
        <div>
          <p className="text-text-muted">Time Taken</p>
          <p className="font-heading text-lg text-text-primary">{Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s</p>
        </div>
        <div>
          <p className="text-text-muted">Tests Passed</p>
          <p className={`font-heading text-lg ${result.all_passed ? 'text-status-success' : 'text-text-primary'}`}>
            {result.results.passed_count}/{result.results.total_count}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-text-muted">Complexity</p>
          <p className="font-heading text-lg text-teal">{result.complexity || '—'}</p>
        </div>
      </div>
      <button
        onClick={() => setStage('setup')}
        className="mt-6 rounded-button border border-border px-4 py-2.5 text-sm text-text-secondary transition-all duration-200 hover:border-orange hover:text-orange active:scale-95"
      >
        Start Another
      </button>
    </div>
  );
}