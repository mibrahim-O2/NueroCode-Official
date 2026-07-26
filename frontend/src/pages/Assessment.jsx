import { useState, useCallback } from 'react';
import { ShieldCheck, Play } from 'lucide-react';
import CodeEditor, { DEFAULT_SNIPPETS } from '@/components/editor/CodeEditor';
import CameraMonitor from '@/components/assessment/CameraMonitor';
import IntegrityScoreBadge from '@/components/assessment/IntegrityScoreBadge';
import ProctoringLogFeed from '@/components/assessment/ProctoringLogFeed';
import { useProctoringSocket } from '@/hooks/useProctoringSocket';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { useKeystrokeMonitor } from '@/hooks/useKeystrokeMonitor';

export default function Assessment() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId] = useState(() => `demo-${crypto.randomUUID()}`);
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);

  const { score, log, connected, emitTabSwitch, emitPaste, emitCameraAlert, emitKeystrokeAlert } =
    useProctoringSocket(sessionActive ? sessionId : null);

useTabVisibility(useCallback(() => sessionActive && emitTabSwitch(), [sessionActive, emitTabSwitch]));
useKeystrokeMonitor(useCallback(() => sessionActive && emitKeystrokeAlert(), [sessionActive, emitKeystrokeAlert]));

  const LARGE_PASTE_THRESHOLD = 30;
  const handlePasteDetected = useCallback(
    (pastedLength) => {
      if (sessionActive && pastedLength >= LARGE_PASTE_THRESHOLD) emitPaste();
    },
    [sessionActive, emitPaste]
  );

  const handleCameraAlert = useCallback(() => {
    if (sessionActive) emitCameraAlert();
  }, [sessionActive, emitCameraAlert]);

  if (!sessionActive) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-text-primary">Assessment</h1>
          <p className="mt-1 font-body text-sm text-text-muted">Proctored evaluations of your mastery</p>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-card px-8 py-16 text-center shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10">
            <ShieldCheck className="h-6 w-6 text-emerald" />
          </div>
          <h2 className="font-heading font-semibold text-lg text-text-primary">Proctoring demo session</h2>
          <p className="max-w-sm font-body text-sm text-text-muted">
            This demonstrates all four integrity signals — tab tracking, paste detection, camera presence, and
            keystroke rhythm — feeding a live integrity score. Full assessment generation and grading arrive in
            the next phase.
          </p>
          <button
            onClick={() => setSessionActive(true)}
            className="flex items-center gap-2 rounded-button bg-emerald px-5 py-2.5 text-sm font-body text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover"
          >
            <Play className="h-4 w-4 fill-current" /> Start Proctored Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-text-primary">Proctored Session</h1>
          <p className="mt-1 font-body text-sm text-text-muted">{connected ? 'Monitoring active' : 'Connecting…'}</p>
        </div>
        <IntegrityScoreBadge score={score} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <CodeEditor language="python" value={code} onChange={setCode} onPasteDetected={handlePasteDetected} />
        <div className="flex flex-col gap-4">
          <CameraMonitor onAlert={handleCameraAlert} />
          <ProctoringLogFeed log={log} />
        </div>
      </div>
    </div>
  );
}