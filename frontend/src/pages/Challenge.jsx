import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '@/components/editor/CodeEditor';
import ProblemPanel from '@/components/editor/ProblemPanel';
import TestResultsPanel from '@/components/editor/TestResultsPanel';
import Timer from '@/components/editor/Timer';
import { challengeService } from '@/services/challengeService';
import { ShieldCheck, ArrowLeft, Zap, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Challenge() {
  const { nodeId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [challengeSession, setChallengeSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [results, setResults] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [codeCache, setCodeCache] = useState({});

  useEffect(() => {
    async function loadChallenge() {
      try {
        setLoading(true);
        const data = await challengeService.getChallenge(nodeId);
        const session = data?.challenge || data;
        setChallengeSession(session);

        const initialIdx = session?.current_index || 0;
        setCurrentIndex(initialIdx);

        const initialQ = session?.questions?.[initialIdx];
        const defaultCode = initialQ?.starter_code || '# Write your solution here\n\ndef solution():\n    pass\n';
        setCode(defaultCode);
        setCodeCache({ [initialIdx]: defaultCode });
      } catch (err) {
        console.error('Failed to load challenge session:', err);
      } finally {
        setLoading(false);
      }
    }
    if (nodeId) loadChallenge();
  }, [nodeId]);

  const questions = challengeSession?.questions || [];
  const activeQuestion = questions[currentIndex] || null;
  const solvedIndices = new Set(challengeSession?.solved_indices || []);

  const handleSelectQuestion = (idx) => {
    // Save current code to cache
    setCodeCache((prev) => ({ ...prev, [currentIndex]: code }));
    setCurrentIndex(idx);
    setResults(null);

    // Retrieve cached code or default starter code
    if (codeCache[idx] !== undefined) {
      setCode(codeCache[idx]);
    } else {
      const q = questions[idx];
      const starter = q?.starter_code || '# Write your solution here\n\ndef solution():\n    pass\n';
      setCode(starter);
    }
  };

  const handleRunAndValidate = async () => {
    setEvaluating(true);
    try {
      const res = await challengeService.submitChallengeQuestion(nodeId, {
        question_index: currentIndex,
        code,
        language,
      });

      setResults(res.results || res);

      if (res.passed) {
        setChallengeSession((prev) => ({
          ...prev,
          solved_indices: [...(prev.solved_indices || []), currentIndex],
        }));
      }

      if (res.all_completed || res.completed) {
        alert('🎉 Mastery Gate Passed! All 25 questions completed. Next roadmap node unlocked.');
        navigate('/roadmap');
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-charcoal text-text-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" />
        <p className="font-mono text-xs text-text-muted">Loading 25-Question Mastery Gate...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-charcoal font-sans text-text-primary">
      {/* Challenge Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Roadmap
        </button>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-bold text-orange">
            <ShieldCheck className="h-3.5 w-3.5" /> Topic Mastery Gate (25 Problems • No AI Assist)
          </span>
          <span className="font-mono text-xs font-bold text-text-primary">
            Solved: {solvedIndices.size} / {questions.length || 25}
          </span>
          <Timer initialMinutes={90} onExpire={() => alert('Assessment time expired!')} />
        </div>

        <button
          onClick={handleRunAndValidate}
          disabled={evaluating}
          className="flex items-center gap-2 rounded-button bg-orange px-5 py-2 text-xs font-bold text-white shadow-button hover:bg-orange/90 active:scale-95 disabled:opacity-50 transition-all"
        >
          {evaluating ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Evaluating...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" /> Validate Question {currentIndex + 1}
            </>
          )}
        </button>
      </div>

      {/* 25-Question Navigation Scroller */}
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-elevated/40 px-6 py-2">
        <span className="mr-2 font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Questions:
        </span>
        {questions.map((q, idx) => {
          const isSolved = solvedIndices.has(idx);
          const isCurrent = currentIndex === idx;
          const diff = q.difficulty || (idx < 12 ? 'Easy' : idx < 22 ? 'Medium' : 'Hard');

          return (
            <button
              key={idx}
              onClick={() => handleSelectQuestion(idx)}
              className={cn(
                'relative flex h-7 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold transition-all',
                isCurrent
                  ? 'border border-orange bg-orange text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                  : isSolved
                  ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                  : 'border border-border bg-card text-text-muted hover:border-orange/40 hover:text-text-primary'
              )}
              title={`Problem ${idx + 1} (${diff})`}
            >
              {idx + 1}
              {isSolved && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-black">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Split Workspace */}
      <div className="grid flex-1 grid-cols-12 overflow-hidden">
        {/* Left: Problem Statement Panel */}
        <div className="col-span-5 flex flex-col border-r border-border bg-card overflow-y-auto p-5">
          {activeQuestion ? (
            <ProblemPanel
              problem={{
                title: `${currentIndex + 1}. ${activeQuestion.title || `Problem ${currentIndex + 1}`}`,
                description: activeQuestion.description,
                difficulty: activeQuestion.difficulty || (currentIndex < 12 ? 'Easy' : currentIndex < 22 ? 'Medium' : 'Hard'),
                test_cases: activeQuestion.test_cases || [],
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-text-muted">
              No question metadata available.
            </div>
          )}
        </div>

        {/* Right: Code Editor & Execution Results */}
        <div className="col-span-7 flex flex-col h-full bg-charcoal overflow-hidden">
          <div className="flex-1 min-h-0">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
            />
          </div>

          <div className="h-56 shrink-0 border-t border-border bg-card overflow-y-auto">
            <TestResultsPanel results={results} />
          </div>
        </div>
      </div>
    </div>
  );
}
