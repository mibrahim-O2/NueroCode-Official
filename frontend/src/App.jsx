import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function StatusRow({ label, status }) {
  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-card px-5 py-4">
      <span className="text-text-secondary font-body text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {status === 'loading' && (
          <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
        )}
        {status === 'ok' && (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald" />
            <span className="text-emerald text-sm">Connected</span>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-4 w-4 text-status-error" />
            <span className="text-status-error text-sm">Unreachable</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [backendStatus, setBackendStatus] = useState('loading');
  const [socketStatus, setSocketStatus] = useState('loading');

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`)
      .then((res) => (res.ok ? setBackendStatus('ok') : setBackendStatus('error')))
      .catch(() => setBackendStatus('error'));

    fetch(`${SOCKET_URL}/health`)
      .then((res) => (res.ok ? setSocketStatus('ok') : setSocketStatus('error')))
      .catch(() => setSocketStatus('error'));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
      <div className="flex items-center gap-3">
        <BrainCircuit className="h-8 w-8 text-emerald" />
        <h1 className="text-3xl font-heading font-bold text-text-primary">
          Neuro<span className="text-emerald">Code</span>
        </h1>
      </div>
      <p className="text-text-muted font-body text-sm tracking-wide">
        Where Intelligence Meets Code
      </p>

      <div className="w-full max-w-md flex flex-col gap-3">
        <StatusRow label="Frontend (Vite + React 18)" status="ok" />
        <StatusRow label="Backend (FastAPI :8000)" status={backendStatus} />
        <StatusRow label="Realtime (Socket.io :3001)" status={socketStatus} />
      </div>

      <span className={cn('text-xs text-text-disabled')}>Phase 1 — Project Setup & Configuration</span>
    </main>
  );
}