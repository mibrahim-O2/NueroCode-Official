import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { generateProblem } from '@/services/problemService';
import { submitCode } from '@/services/submissionService';
import { getInstantProblem, simulateSubmission as simulateSubmissionTestMode } from '@/services/testModeService';
import { useTestMode } from '@/context/TestModeContext';
import ProblemPanel from '@/components/editor/ProblemPanel';
import CodeEditor, { DEFAULT_SNIPPETS } from '@/components/editor/CodeEditor';
import Timer from '@/components/editor/Timer';
import TestResultsPanel from '@/components/editor/TestResultsPanel';
import AnalysisPanel from '@/components/editor/AnalysisPanel';
import ChatWidget from '@/components/editor/ChatWidget';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LANGUAGES = ['python', 'javascript', 'cpp'];
const ROADMAP_DIFFICULTY_MAP = { beginner: 'easy', intermediate: 'medium', advanced: 'hard' };

export default function Practice() {
  const testModeEnabled = useTestMode();
  const [searchParams] = useSearchParams();
  const rawDifficulty = searchParams.get('difficulty');

  const [topic, setTopic] = useState(searchParams.get('topic') || 'Arrays');
  const [difficulty, setDifficulty] = useState(
    ROADMAP_DIFFICULTY_MAP[rawDifficulty] || rawDifficulty || 'medium'
  );
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const newProblem = await generateProblem(topic, difficulty);
      setProblem(newProblem);
      setLanguage('python');
      setCode(DEFAULT_SNIPPETS.python);
    } catch (err) {
      setError(err.message || 'Failed to generate a problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_SNIPPETS[lang]);
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const outcome = await submitCode(problem.id, language, code);
      setResult(outcome);
    } catch (err) {
      setSubmitError(err.message || 'Execution failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInstantProblem = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const newProblem = await getInstantProblem(topic, difficulty);
      setProblem(newProblem);
      setLanguage('python');
      setCode(DEFAULT_SNIPPETS.python);
    } catch (err) {
      setError(err.message || 'Instant problem failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (outcome) => {
    if (!problem) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const simulated = await simulateSubmissionTestMode(problem.topic, problem.difficulty, language, outcome, true);
      setResult(simulated);
    } catch (err) {
      setSubmitError(err.message || 'Simulation failed.');
    } finally {
      setSubmitting(false);
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
        {testModeEnabled && (
          <button
            onClick={handleInstantProblem}
            disabled={loading || !topic.trim()}
            className="flex items-center gap-2 rounded-button border border-status-warning/40 px-4 py-2.5 text-sm font-body text-status-warning transition-colors duration-200 hover:bg-status-warning/10 disabled:opacity-50"
          >
            Instant Problem (Test Mode)
          </button>
        )}
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

      {problem && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ProblemPanel problem={problem} />
            {result && <TestResultsPanel result={result} />}
            {result?.analysis && <AnalysisPanel analysis={result.analysis} />}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex overflow-hidden rounded-input border border-border">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1.5 text-xs capitalize transition-colors duration-200 ${
                      language === lang ? 'bg-emerald text-white' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang}
                  </button>
                ))}
              </div>
              <Timer durationSeconds={1200} resetKey={problem.id} />
            </div>

            <CodeEditor language={language} value={code} onChange={setCode} />

            {submitError && (
              <div className="rounded-input border border-status-error/40 bg-status-error/10 px-4 py-2.5 text-xs text-status-error">
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-button bg-emerald px-4 py-2.5 text-sm font-body text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              {submitting ? 'Running…' : 'Submit Solution'}
            </button>

            {testModeEnabled && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSimulate('pass')}
                  disabled={submitting}
                  className="flex-1 rounded-button border border-emerald/40 px-3 py-2 text-xs text-emerald transition-colors duration-200 hover:bg-emerald/10 disabled:opacity-50"
                >
                  Simulate Pass
                </button>
                <button
                  onClick={() => handleSimulate('fail')}
                  disabled={submitting}
                  className="flex-1 rounded-button border border-status-error/40 px-3 py-2 text-xs text-status-error transition-colors duration-200 hover:bg-status-error/10 disabled:opacity-50"
                >
                  Simulate Fail
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {problem && <ChatWidget topic={problem.topic} />}
    </div>
  );
}