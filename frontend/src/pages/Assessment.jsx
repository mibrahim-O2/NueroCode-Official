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
import { useAuth } from '@/context/AuthContext';
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

const LARGE_PASTE_THRESHOLD = 30;
const VERIFY_BASE_URL = window.location.origin;

export default function Assessment() {
  const { user } = useAuth();
  const [clusters, setClusters] = useState([]);
  const [loadingClusters, setLoadingClusters] = useState(true);

  const [stage, setStage] = useState('select'); // select | starting | active | result
  const [question, setQuestion] = useState(null);
  const [language] = useState('python');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [startError, setStartError] = useState(null);
  const [credentialQr, setCredentialQr] = useState(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const certRef = useRef(null);

  const sessionId = question?.id || null;
  const { score, log, connected, emitTabSwitch, emitPaste, emitCameraAlert, emitKeystrokeAlert } =
    useProctoringSocket(sessionId);

  const logBoth = useCallback(
    (eventType, severity, emitFn) => {
      emitFn();
      if (sessionId) logProctoringEvent(sessionId, eventType, severity).catch(() => {});
    },
    [sessionId]
  );

  useTabVisibility(
    useCallback(() => stage === 'active' && logBoth('tab_switch', 'medium', emitTabSwitch), [stage, logBoth, emitTabSwitch])
  );
  useKeystrokeMonitor(
    useCallback(
      () => stage === 'active' && logBoth('keystroke_alert', 'high', emitKeystrokeAlert),
      [stage, logBoth, emitKeystrokeAlert]
    )
  );

  const handlePasteDetected = useCallback(
    (pastedLength) => {
      if (stage === 'active' && pastedLength >= LARGE_PASTE_THRESHOLD) logBoth('paste', 'high', emitPaste);
    },
    [stage, logBoth, emitPaste]
  );

  const handleCameraAlert = useCallback(() => {
    if (stage === 'active') logBoth('camera_alert', 'critical', emitCameraAlert);
  }, [stage, logBoth, emitCameraAlert]);

  useEffect(() => {
    getAvailableClusters()
      .then(setClusters)
      .finally(() => setLoadingClusters(false));
  }, []);

  const handleStart = async (clusterName) => {
    setStage('starting');
    setStartError(null);
    setResult(null);
    setCredentialQr(null);
    setCode(DEFAULT_SNIPPETS.python);
    try {
      const q = await startAssessment(clusterName);
      setQuestion(q);
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
      const outcome = await submitAssessment(question.id, language, code, score);
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
    setLoadingClusters(true);
    getAvailableClusters()
      .then(setClusters)
      .finally(() => setLoadingClusters(false));
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
              key={cluster.name}
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
                  onClick={() => handleStart(cluster.name)}
                  disabled={stage === 'starting'}
                  className="flex items-center justify-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
                >
                  {stage === 'starting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                  Start Assessment
                </button>
              ) : (
                <span className="text-xs text-text-disabled">
                  Complete {cluster.topics.join(' & ')} in your roadmap to unlock
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-text-primary">{question.title}</h1>
          <p className="mt-1 font-body text-sm text-text-muted">
            {connected ? 'Proctoring active — chatbot disabled' : 'Connecting…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Timer durationSeconds={question.duration_seconds} resetKey={question.id} />
          <IntegrityScoreBadge score={score} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ProblemPanel problem={{ ...question, difficulty: 'assessment' }} />
          <CameraMonitor onAlert={handleCameraAlert} />
          <ProctoringLogFeed log={log} />
        </div>

        <div className="flex flex-col gap-4">
          <CodeEditor language={language} value={code} onChange={setCode} onPasteDetected={handlePasteDetected} />
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