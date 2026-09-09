import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Play, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import CodeEditor, { DEFAULT_SNIPPETS } from '@/components/editor/CodeEditor';
import ProblemPanel from '@/components/editor/ProblemPanel';
import TestResultsPanel from '@/components/editor/TestResultsPanel';
import Timer from '@/components/editor/Timer';
import { challengeService } from '@/services/challengeService';
import { cn } from '@/lib/utils';

const LANGUAGES = ['python', 'javascript', 'cpp'];
const CHALLENGE_DURATION_SECONDS = 90 * 60;

export default function Challenge() {
  const { nodeId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [challengeSession, setChallengeSession] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [codeCache, setCodeCache] = useState({});

  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // null | 'completed' | 'expired' — once set, no further submissions.
  const [sessionOver, setSessionOver] = useState(null);

  useEffect(() => {
    if (!nodeId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await challengeService.getChallenge(nodeId);
        if (cancelled) return;
        const session = data?.challenge ?? null;
        setChallengeSession(session);

        const idx = session?.current_index || 0;
        setCurrentIndex(idx);
        const starter = session?.questions?.[idx]?.starter_code || DEFAULT_SNIPPETS.python;
        setCode(starter);
        setCodeCache({ [idx]: starter });
        if (session?.status === 'passed') setSessionOver('completed');
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load challenge session:', err);
          setLoadError(err.message || 'Could not load the challenge gate. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  const questions = challengeSession?.questions || [];
  const activeQuestion = questions[currentIndex] || null;
  const solvedIndices = new Set(challengeSession?.solved_indices || []);
  const totalQuestions = questions.length || 10;

  const handleSelectQuestion = (idx) => {
    setCodeCache((prev) => ({ ...prev, [currentIndex]: code }));
    setCurrentIndex(idx);
    setResult(null);
    setSubmitError(null);
    if (codeCache[idx] !== undefined) {
      setCode(codeCache[idx]);
    } else {
      setCode(questions[idx]?.starter_code || DEFAULT_SNIPPETS[language] || DEFAULT_SNIPPETS.python);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_SNIPPETS[lang]);
  };

  const handleTimeExpired = useCallback(() => {
    setSessionOver((over) => over || 'expired');
  }, []);

  const handleRunAndValidate = async () => {
    if (sessionOver || evaluating) return;
    setEvaluating(true);
    setSubmitError(null);
    try {
      const res = await challengeService.submitChallengeQuestion(nodeId, {
        question_index: currentIndex,
        code,
        language,
      });

      // Shape TestResultsPanel expects: { results, passed_count, total_count, all_passed }
      setResult({
        results: res.results || [],
        passed_count: res.passed_count ?? 0,
        total_count: res.total_count ?? 0,
        all_passed: !!res.passed,
      });

      // Trust the authoritative response for solved state / score / status.
      setChallengeSession((prev) =>
        prev
          ? {
              ...prev,
              solved_indices: res.passed
                ? Array.from(new Set([...(prev.solved_indices || []), currentIndex]))
                : prev.solved_indices || [],
              score: res.score ?? prev.score,
              status: res.status || prev.status,
            }
          : prev
      );

      if (res.all_completed) setSessionOver('completed');
    } catch (err) {
      console.error('Challenge question evaluation failed:', err);
      setResult(null);
      setSubmitError(err.message || 'Could not evaluate your submission. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  // --- No node selected -----------------------------------------------
  if (!nodeId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-border bg-card px-8 py-16 text-center shadow-card">
        <ShieldCheck className="h-10 w-10 text-orange" />
        <h1 className="font-heading text-lg font-semibold text-text-primary">Challenge Gate</h1>
        <p className="max-w-sm text-sm text-text-muted">
          Select a roadmap node to attempt its challenge gate — a 10-problem, no-AI-assist checkpoint
          you must fully clear to complete that topic.
        </p>
        <Link
          to="/roadmap"
          className="rounded-button bg-orange px-5 py-2.5 text-xs font-semibold text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95"
        >
          Go to Roadmap
        </Link>
      </div>
    );
  }

  // --- Loading --------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3 text-text-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" />
        <p className="font-mono text-xs text-text-muted">Loading challenge gate…</p>
      </div>
    );
  }

  // --- Load error ----------------------------------------------------
  if (loadError || !challengeSession) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-border bg-card px-8 py-16 text-center shadow-card">
        <AlertCircle className="h-10 w-10 text-status-error" />
        <h1 className="font-heading text-lg font-semibold text-text-primary">Couldn&apos;t start the challenge gate</h1>
        <p className="max-w-sm text-sm text-text-muted">
          {loadError || 'No challenge session is available for this node.'}
        </p>
        <Link
          to="/roadmap"
          className="rounded-button border border-border px-4 py-2 text-xs text-text-secondary transition-all duration-200 hover:border-orange hover:text-orange active:scale-95"
        >
          Back to Roadmap
        </Link>
      </div>
    );
  }

  // --- Active challenge --------------------------------------------------
  return (
    <div className="flex w-full flex-col gap-0 text-text-primary">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-card border border-border bg-card px-4 py-3">
        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center gap-2 text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Roadmap
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-bold text-orange">
            <ShieldCheck className="h-3.5 w-3.5" /> Topic Mastery Gate ({totalQuestions} Problems • No AI Assist)
          </span>
          <span className="font-mono text-xs font-bold text-text-primary">
            Solved: {solvedIndices.size} / {totalQuestions}
          </span>
          <Timer durationSeconds={CHALLENGE_DURATION_SECONDS} onExpire={handleTimeExpired} />
        </div>

        <button
          onClick={handleRunAndValidate}
          disabled={evaluating || !!sessionOver}
          className="flex items-center gap-2 rounded-button bg-orange px-5 py-2 text-xs font-bold text-white shadow-button transition-all hover:bg-orange-hover active:scale-95 disabled:opacity-50"
        >
          {evaluating ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Evaluating…
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" /> Validate Question {currentIndex + 1}
            </>
          )}
        </button>
      </div>

      {/* Session-over banner */}
      {sessionOver === 'completed' && (
        <div className="flex items-center gap-2 border-b border-status-success/30 bg-status-success/10 px-4 py-2 text-xs text-status-success">
          <CheckCircle2 className="h-4 w-4" />
          Mastery gate passed — all {totalQuestions} problems solved. Your roadmap node is complete.
          <Link to="/roadmap" className="ml-1 underline">Back to Roadmap</Link>
        </div>
      )}
      {sessionOver === 'expired' && (
        <div className="flex items-center gap-2 border-b border-status-warning/30 bg-status-warning/10 px-4 py-2 text-xs text-status-warning">
          <Clock className="h-4 w-4" />
          Time&apos;s up — this challenge gate session has ended. No further submissions are accepted.
          <Link to="/roadmap" className="ml-1 underline">Back to Roadmap</Link>
        </div>
      )}

      {/* Question navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-x border-b border-border bg-elevated/40 px-4 py-2">
        <span className="mr-2 font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Questions:
        </span>
        {questions.map((q, idx) => {
          const isSolved = solvedIndices.has(idx);
          const isCurrent = currentIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelectQuestion(idx)}
              title={`Problem ${idx + 1}${q.difficulty ? ` (${q.difficulty})` : ''}`}
              className={cn(
                'relative flex h-7 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold transition-all',
                isCurrent
                  ? 'border border-orange bg-orange text-white'
                  : isSolved
                  ? 'border border-status-success/40 bg-status-success/15 text-status-success'
                  : 'border border-border bg-card text-text-muted hover:border-orange/40 hover:text-text-primary'
              )}
            >
              {idx + 1}
              {isSolved && (
                <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-status-success text-[8px] text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Workspace */}
      <div className="grid grid-cols-1 rounded-b-card border-x border-b border-border lg:grid-cols-12">
        <div className="border-b border-border bg-card p-5 lg:col-span-5 lg:border-b-0 lg:border-r">
          {activeQuestion ? (
            <ProblemPanel
              problem={{
                title: `${currentIndex + 1}. ${activeQuestion.title || `Problem ${currentIndex + 1}`}`,
                description: activeQuestion.description,
                difficulty: activeQuestion.difficulty,
                expected_complexity: activeQuestion.expected_complexity,
                examples: activeQuestion.examples,
                constraints: activeQuestion.constraints,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-text-muted">
              No question metadata available.
            </div>
          )}
        </div>

        <div className="flex flex-col lg:col-span-7">
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
            <div className="flex overflow-hidden rounded-input border border-border">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={cn(
                    'px-3 py-1.5 text-xs capitalize transition-colors duration-200',
                    language === lang ? 'bg-orange text-white' : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  {lang === 'cpp' ? 'C++' : lang}
                </button>
              ))}
            </div>
          </div>

          <CodeEditor language={language} value={code} onChange={setCode} />

          {submitError && (
            <div className="border-t border-status-error/40 bg-status-error/10 px-4 py-2 text-xs text-status-error">
              {submitError}
            </div>
          )}

          {result && (
            <div className="border-t border-border bg-card">
              <TestResultsPanel result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
