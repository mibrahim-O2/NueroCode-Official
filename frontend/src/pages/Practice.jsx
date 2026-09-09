import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { generateProblem } from '@/services/problemService';
import { submitCode } from '@/services/submissionService';
import ProblemPanel from '@/components/editor/ProblemPanel';
import CodeEditor, { DEFAULT_SNIPPETS } from '@/components/editor/CodeEditor';
import TestResultsPanel from '@/components/editor/TestResultsPanel';
import AnalysisPanel from '@/components/editor/AnalysisPanel';
import ChatWidget from '@/components/editor/ChatWidget';
import ModelSwitcher from '@/components/editor/ModelSwitcher';
import OfficialSolutionPanel from '@/components/editor/OfficialSolutionPanel';
import DiscussionPanel from '@/components/editor/DiscussionPanel';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const ROADMAP_DIFFICULTY_MAP = { beginner: 'easy', intermediate: 'medium', advanced: 'hard' };
const PROVIDER_DISPLAY = { gemini: 'Gemini', openai: 'GPT (OpenAI)', claude: 'Claude (Sonnet 5)' };

export default function Practice() {
  const [searchParams] = useSearchParams();
  const rawDifficulty = searchParams.get('difficulty');

  const [topic, setTopic] = useState(searchParams.get('topic') || 'Arrays');
  const [difficulty, setDifficulty] = useState(
    ROADMAP_DIFFICULTY_MAP[rawDifficulty] || rawDifficulty || 'medium'
  );
  const [aiProvider, setAiProvider] = useState('gemini');
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
      const newProblem = await generateProblem(topic, difficulty, aiProvider);
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
            className="rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
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
                  difficulty === d ? 'bg-orange text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <ModelSwitcher
          activeProvider={aiProvider}
          onProviderChange={setAiProvider}
          onGenerate={handleGenerate}
          loading={loading}
          disabled={!topic.trim()}
          hasProblem={!!problem}
        />
      </div>

      {error && (
        <div className="animate-slide-fade-in flex items-center justify-between gap-3 rounded-input border border-status-error/40 bg-status-error/10 px-4 py-3 text-sm text-status-error">
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
            {problem.provider_used && (
              <div className="flex w-fit items-center gap-1.5 rounded-badge border border-teal/30 bg-teal/10 px-3 py-1 text-xs text-teal">
                <Sparkles className="h-3 w-3" />
                Generated with {PROVIDER_DISPLAY[problem.provider_used] || problem.provider_used}
              </div>
            )}
            <ProblemPanel problem={problem} />
            {result && (
              <div className="animate-slide-fade-in flex flex-col gap-6">
                <TestResultsPanel result={result} />
                {result.analysis && <AnalysisPanel analysis={result.analysis} />}
              </div>
            )}
            {/* Only offered after a genuine pass on THIS problem — the
                backend independently re-checks this, this is just UI gating. */}
            {result?.all_passed && <OfficialSolutionPanel problemId={problem.id} />}
            {result?.all_passed && <DiscussionPanel problemId={problem.id} />}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex overflow-hidden rounded-input border border-border">
                {['python', 'javascript', 'cpp'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1.5 text-xs capitalize transition-colors duration-200 ${
                      language === lang ? 'bg-orange text-white' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang}
                  </button>
                ))}
              </div>
            </div>

            <CodeEditor language={language} value={code} onChange={setCode} />

            {submitError && (
              <div className="animate-slide-fade-in rounded-input border border-status-error/40 bg-status-error/10 px-4 py-2.5 text-xs text-status-error">
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              {submitting ? 'Running…' : 'Submit Solution'}
            </button>
          </div>
        </div>
      )}

      {problem && <ChatWidget topic={problem.topic} />}
    </div>
  );
}