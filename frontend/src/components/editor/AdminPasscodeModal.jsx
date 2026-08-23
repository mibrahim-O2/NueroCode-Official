import { useState } from 'react';
import { ShieldCheck, X, Loader2 } from 'lucide-react';
import { verifyProviderPasscode } from '@/services/adminService';

export default function AdminPasscodeModal({ onClose, onSuccess }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyProviderPasscode(passcode);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Incorrect passcode.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-dialog border border-border bg-charcoal p-6 shadow-dialog"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald" />
            <h2 className="font-heading font-semibold text-text-primary">Administrator Verification</h2>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-text-muted">
          Enter the provider-switch passcode to enable real OpenAI (GPT) generation for this session.
        </p>
        <input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className="rounded-input border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-emerald"
        />
        {error && <p className="text-xs text-status-error">{error}</p>}
        <button
          type="submit"
          disabled={busy || !passcode}
          className="flex items-center justify-center gap-2 rounded-button bg-emerald px-4 py-2.5 text-sm font-body text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Unlock OpenAI
        </button>
      </form>
    </div>
  );
}