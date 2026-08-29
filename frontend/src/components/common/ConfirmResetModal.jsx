import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmResetModal({ title, items, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim() || undefined);
    } catch (err) {
      setError(err.message || 'Action failed.');
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        className="animate-slide-fade-in flex w-full max-w-md flex-col gap-4 rounded-dialog border border-border bg-charcoal p-6 shadow-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-error" />
            <h2 className="font-heading font-semibold text-text-primary">{title}?</h2>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs text-text-muted">This will reset:</p>
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="text-status-error">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Testing, student request, data correction…"
            className="rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
          />
        </div>

        <p className="text-xs font-semibold text-status-error">This action cannot be undone.</p>

        {error && <p className="animate-slide-fade-in text-xs text-status-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-button border border-border px-4 py-2 text-sm text-text-secondary transition-all duration-200 hover:border-orange hover:text-orange active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex items-center gap-2 rounded-button bg-status-error px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-status-error/80 active:scale-95 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {title}
          </button>
        </div>
      </div>
    </div>
  );
}