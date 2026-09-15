import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { ShieldCheck, Play, Loader2, Lock, CheckCircle2, Award, XCircle, AlertCircle, Download, Linkedin } from 'lucide-react';
import {
  getAvailableClusters,
  startAssessment,
  submitAssessment,
  logProctoringEvent,
} from '@/services/assessmentService';
import {
  getDemoAssessments,
  startDemoAssessment,
  submitDemoAssessment,
  logDemoProctoringEvent,
} from '@/services/demoService';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import CertificateTemplate from '@/components/common/CertificateTemplate';
import { exportCertificatePdf, buildLinkedInCaption, buildLinkedInShareUrl } from '@/utils/certificateShare';
import ProblemPanel from '@/components/editor/ProblemPanel';
import CodeEditor, { DEFAULT_SNIPPETS } from '@/components/editor/CodeEditor';
import Timer from '@/components/editor/Timer';
import CameraMonitor from '@/components/assessment/CameraMonitor';
import IntegrityScoreBadge from '@/components/assessment/IntegrityScoreBadge';
import ProctoringLogFeed from '@/components/assessment/ProctoringLogFeed';
import { useProctoringSocket } from '@/hooks/useProctoringSocket';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { useKeystrokeMonitor } from '@/hooks/useKeystrokeMonitor';
import { cn } from '@/lib/utils';

const LARGE_PASTE_THRESHOLD = 30;
const VERIFY_BASE_URL = window.location.origin;

export default function Assessment() {
  const { user } = useAuth();
  const { demoModeEnabled } = useDemoMode();
  const [clusters, setClusters] = useState([]);
  const [loadingClusters, setLoadingClusters] = useState(true);
  // Demo Mode only: the inline "How to test integrity signals" guide, served
  // by the backend from the same text docs/demo.md is generated from.
  const [integrityGuide, setIntegrityGuide] = useState([]);

  const [stage, setStage] = useState('select'); // select | starting | active | result
  const [question, setQuestion] = useState(null);
  const [language] = useState('python');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  // Demo assessments have 3 questions: one editor buffer per question.
  const [questionIndex, setQuestionIndex] = useState(0);
  const [demoCodes, setDemoCodes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [startError, setStartError] = useState(null);
  const [credentialQr, setCredentialQr] = useState(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const certRef = useRef(null);

  const sessionId = question?.id || null;
  const { score, log, recordEvent } = useProctoringSocket();

  const logBoth = useCallback(
    (eventType, severity) => {
      // Local live feedback (score badge + log feed) …
      recordEvent(eventType, severity);
      // … and the authoritative persisted record the backend grades from.
      // Demo attempts persist to demo_proctoring_logs; the detectors firing
      // these events are the same real hooks either way.
      if (!sessionId) return;
      const persist = demoModeEnabled ? logDemoProctoringEvent : logProctoringEvent;
      persist(sessionId, eventType, severity).catch(() => {});
    },
    [sessionId, recordEvent, demoModeEnabled]
  );

  useTabVisibility(
    useCallback(() => stage === 'active' && logBoth('tab_switch', 'medium'), [stage, logBoth])
  );
  useKeystrokeMonitor(
    useCallback(() => stage === 'active' && logBoth('keystroke_alert', 'high'), [stage, logBoth])
  );

  const handlePasteDetected = useCallback(
    (pastedLength) => {
      if (stage === 'active' && pastedLength >= LARGE_PASTE_THRESHOLD) logBoth('paste', 'high');
    },
    [stage, logBoth]
  );

  const handleCameraAlert = useCallback(() => {
    if (stage === 'active') logBoth('camera_alert', 'critical');
  }, [stage, logBoth]);

  const loadClusters = useCallback(() => {
    setLoadingClusters(true);
    const request = demoModeEnabled
      ? getDemoAssessments().then((data) => {
          setIntegrityGuide(data.integrity_testing_guide || []);
          return data.assessments || [];
        })
      : getAvailableClusters();
    request.then(setClusters).finally(() => setLoadingClusters(false));
  }, [demoModeEnabled]);

  // Reloads (and leaves any open attempt) whenever Demo Mode is switched, so
  // a real attempt and a demo attempt can never be on screen together.
  useEffect(() => {
    setStage('select');
    setQuestion(null);
    setResult(null);
    setStartError(null);
    loadClusters();
  }, [loadClusters]);

  const handleStart = async (cluster) => {
    setStage('starting');
    setStartError(null);
    setResult(null);
    setCredentialQr(null);
    setCode(DEFAULT_SNIPPETS.python);
    try {
      // Demo assessments are started by key; the backend returns 403 with the
      // unlock requirement if its unlock rule isn't met yet.
      const q = demoModeEnabled ? await startDemoAssessment(cluster.key) : await startAssessment(cluster.name);
      setQuestion(q);
      setQuestionIndex(0);
      setDemoCodes((q.questions || []).map(() => DEFAULT_SNIPPETS.python));
      setCode(DEFAULT_SNIPPETS.python);
      setStage('active');
    } catch (err) {
      setStartError(err.message || 'Could not start assessment.');
      setStage('select');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // No integrity value is passed — the backend recomputes the
      // authoritative score server-side from proctoring logs (demo logs in
      // Demo Mode). `score` here is local UX feedback only.
      const outcome = demoModeEnabled
        ? await submitDemoAssessment(question.id, language, demoCodes)
        : await submitAssessment(question.id, language, code);
      setResult(outcome);
      if (outcome.credential) {
        const url = `${VERIFY_BASE_URL}/verify/${outcome.credential.verify_uuid}`;
        QRCode.toDataURL(url, { margin: 1, width: 200 })
          .then(setCredentialQr)
          .catch(() => setCredentialQr(null));
      }
      setStage('result');
    } catch (err) {
      setStartError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const backToClusters = () => {
    setStage('select');
    setQuestion(null);
    setResult(null);
    setCode(DEFAULT_SNIPPETS.python);
    setSubmitting(false);
    setCredentialQr(null);
    setStartError(null);
    loadClusters();
  };

  const handleExportPdf = () => {
    if (!result?.credential) return;
    exportCertificatePdf(certRef, `neurocode-credential-${result.credential.badge_level}.pdf`);
  };

  const handleShareLinkedIn = async () => {
    if (!result?.credential) return;
    const verifyUrl = `${VERIFY_BASE_URL}/verify/${result.credential.verify_uuid}`;
    const caption = buildLinkedInCaption(result.credential, user?.name, verifyUrl);
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 4000);
    } catch {
      // Non-critical — the share window still opens without the caption copied.
    }
    window.open(buildLinkedInShareUrl(verifyUrl), '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  if (loadingClusters) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (stage === 'select' || stage === 'starting') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-text-primary">Assessment</h1>
          <p className="mt-1 font-body text-sm text-text-muted">Proctored evaluations of your mastery</p>
        </div>

        {startError && (
          <div className="animate-slide-fade-in flex items-center gap-2 rounded-input border border-status-error/40 bg-status-error/10 px-4 py-3 text-sm text-status-error">
            <AlertCircle className="h-4 w-4" /> {startError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {clusters.map((cluster) => (
            <div
              key={cluster.key || cluster.name}
              className="flex flex-col gap-3 rounded-card border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dialog"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-text-primary">{cluster.name}</h3>
                {cluster.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-orange" />
                ) : cluster.unlocked ? (
                  <ShieldCheck className="h-5 w-5 text-orange" />
                ) : (
                  <Lock className="h-5 w-5 text-text-disabled" />
                )}
              </div>
              <p className="text-xs text-text-muted">{cluster.topics.join(' + ')}</p>
              {cluster.passed ? (
                <span className="text-xs text-orange">Passed — credential earned</span>
              ) : cluster.unlocked ? (
                <button
                  onClick={() => handleStart(cluster)}
                  disabled={stage === 'starting'}
                  className="flex items-center justify-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
                >
                  {stage === 'starting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                  Start Assessment
                </button>
              ) : (
                // Same locked-state UI; demo assessments state their own
                // unlock rule (from demo_content.py) instead of cluster topics.
                <span className="text-xs text-text-disabled">
                  {demoModeEnabled
                    ? cluster.unlock_requirement
                    : `Complete ${cluster.topics.join(' & ')} in your roadmap to unlock`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'result') {
    return (
      <div className="flex flex-col items-center gap-6 rounded-card border border-border bg-card px-8 py-16 text-center shadow-card">
        {result.passed ? (
          <>
            <Award className="animate-celebrate h-12 w-12 text-gold" />
            <h2 className="font-heading font-semibold text-xl text-text-primary">Assessment Passed</h2>

            {/* Demo credentials are presenter-issued, so a demo pass reports the
                tier the real tier rule awarded and points to where to issue it. */}
            {demoModeEnabled && result.earned_badge_level && (
              <p className="max-w-sm text-sm text-text-muted">
                Score: {result.assessment_score}% • Integrity: {result.integrity_score}% • Earned tier:{' '}
                <strong className="capitalize text-gold">{result.earned_badge_level}</strong>. Issue the demo credential
                from the Credentials page.
              </p>
            )}

            {result.credential && (
              <>
                <div className="animate-slide-fade-in w-full max-w-3xl">
                  <CertificateTemplate
                    ref={certRef}
                    credential={result.credential}
                    ownerName={user?.name}
                    qrDataUrl={credentialQr}
                    verifyUrl={`${VERIFY_BASE_URL}/verify/${result.credential.verify_uuid}`}
                  />
                </div>

                {copiedCaption && (
                  <p className="animate-slide-fade-in text-xs text-orange">Suggested LinkedIn caption copied — paste it into your post!</p>
                )}

                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-1.5 rounded-button bg-orange px-4 py-2 text-xs text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" /> Export PDF
                  </button>
                  {/* LinkedIn's own brand blue — a fixed third-party brand
                      color, intentionally independent of our palette, the
                      same way a "Sign in with Google" button keeps
                      Google's own colors. Left untouched. */}
                  <button
                    onClick={handleShareLinkedIn}
                    className="flex items-center gap-1.5 rounded-button border border-[#0A66C2] px-4 py-2 text-xs text-[#0A66C2] transition-all duration-200 hover:bg-[#0A66C2]/10 active:scale-95"
                  >
                    <Linkedin className="h-3.5 w-3.5" /> Share on LinkedIn
                  </button>
                </div>
              </>
            )}

            <Link to="/credential" className="text-xs text-orange hover:underline">
              View all your credentials
            </Link>
          </>
        ) : (
          <>
            <XCircle className="h-12 w-12 text-status-error" />
            <h2 className="font-heading font-semibold text-xl text-text-primary">Assessment Not Passed</h2>
            <p className="max-w-sm text-sm text-text-muted">
              Score: {result.assessment_score}% • Integrity: {result.integrity_score}%
            </p>
            {result.weak_topic && (
              <p className="text-sm text-status-warning">
                Focus area identified: <strong>{result.weak_topic}</strong>
              </p>
            )}
          </>
        )}
        <button
          onClick={backToClusters}
          className="rounded-button border border-border px-4 py-2 text-sm text-text-secondary transition-all duration-200 hover:border-orange hover:text-orange active:scale-95"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const demoQuestions = question?.questions || [];
  const activeProblem = demoModeEnabled ? demoQuestions[questionIndex] || demoQuestions[0] : question;
  const editorValue = demoModeEnabled ? demoCodes[questionIndex] ?? DEFAULT_SNIPPETS.python : code;
  const handleEditorChange = (value) => {
    if (demoModeEnabled) {
      setDemoCodes((prev) => prev.map((existing, i) => (i === questionIndex ? value : existing)));
    } else {
      setCode(value);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-text-primary">{question.title}</h1>
          <p className="mt-1 font-body text-sm text-text-muted">Proctoring active</p>
        </div>
        <div className="flex items-center gap-3">
          <Timer durationSeconds={question.duration_seconds} resetKey={question.id} />
          <IntegrityScoreBadge score={score} />
        </div>
      </div>

      {/* Demo assessments have several questions, all graded together on
          submit. Navigation reuses the Challenge Gate's question buttons. */}
      {demoModeEnabled && demoQuestions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-card border border-border bg-elevated/40 px-4 py-2">
          <span className="mr-2 font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Questions:
          </span>
          {demoQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setQuestionIndex(idx)}
              title={q.title}
              className={cn(
                'relative flex h-7 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold transition-all',
                idx === questionIndex
                  ? 'border border-orange bg-orange text-white'
                  : 'border border-border bg-card text-text-muted hover:border-orange/40 hover:text-text-primary'
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ProblemPanel problem={{ ...activeProblem, difficulty: 'assessment' }} />
          <CameraMonitor onAlert={handleCameraAlert} />
          <ProctoringLogFeed log={log} />
          {demoModeEnabled && integrityGuide.length > 0 && (
            <div className="rounded-card border border-border bg-card p-5 shadow-card">
              <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-text-primary">
                <ShieldCheck className="h-4 w-4 text-orange" /> How to test integrity signals
              </h3>
              <ul className="mt-3 flex flex-col gap-2">
                {integrityGuide.map((item) => (
                  <li key={item.event_type} className="text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">{item.label}:</span> {item.how_to_trigger}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <CodeEditor language={language} value={editorValue} onChange={handleEditorChange} onPasteDetected={handlePasteDetected} />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            {submitting ? 'Grading…' : 'Submit Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}
