import { useState } from 'react';
import { X, Check, Sparkles, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import Logo from '@/components/common/Logo';
import '@/styles/paywall.css';

const PROVIDER_COPY = {
  openai: { name: 'GPT (OpenAI)', tagline: 'Unlock GPT-powered problem generation' },
  claude: { name: 'Claude (Sonnet 5)', tagline: 'Unlock Claude-powered problem generation' },
};

const PRO_FEATURES = [
  'Generate problems with GPT and Claude, in addition to Gemini',
  'Priority generation queue during peak hours',
  'Early access to new AI providers as they launch',
  'Extended problem history and analytics',
];

export default function SubscriptionPaywall({ provider, onClose }) {
  const [step, setStep] = useState('plans'); // 'plans' | 'payment' | 'success'
  const [agreed, setAgreed] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const copy = PROVIDER_COPY[provider] || PROVIDER_COPY.openai;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!agreed) return;
    setStep('success');
  };

  return (
    <div
      className="nc-paywall fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5,3,15,0.75)' }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl"
        style={{
          backgroundColor: 'var(--pw-surface)',
          border: '1px solid var(--pw-border)',
          boxShadow: '0 40px 100px -30px var(--pw-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-6">
          <div className="flex items-center gap-2.5">
            <Logo variant="icon" size={32} animated={false} />
            <span className="font-heading text-sm font-semibold" style={{ color: 'var(--pw-text-primary)' }}>
              NeuroCode <span style={{ color: 'var(--pw-violet)' }}>Pro</span>
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--pw-text-muted)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'plans' && (
          <div className="flex flex-col gap-6 px-7 py-7">
            <div>
              <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--pw-text-primary)' }}>
                {copy.tagline}
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--pw-text-secondary)' }}>
                {copy.name} is available on the NeuroCode Pro plan. Gemini remains free for everyone, always.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl p-5" style={{ border: '1px solid var(--pw-border)', backgroundColor: 'var(--pw-surface-alt)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--pw-text-muted)' }}>
                  Free
                </p>
                <p className="mt-2 font-heading text-3xl font-bold" style={{ color: 'var(--pw-text-primary)' }}>
                  $0
                </p>
                <ul className="mt-4 flex flex-col gap-2.5 text-sm" style={{ color: 'var(--pw-text-secondary)' }}>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" style={{ color: 'var(--pw-teal)' }} /> Gemini-powered generation
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" style={{ color: 'var(--pw-teal)' }} /> Full roadmap &amp; assessments
                  </li>
                </ul>
              </div>

              <div
                className="relative rounded-xl p-5"
                style={{
                  border: '1.5px solid var(--pw-violet)',
                  backgroundColor: 'var(--pw-surface-alt)',
                  boxShadow: '0 0 0 1px var(--pw-violet), 0 20px 50px -20px rgba(139,124,246,0.35)',
                }}
              >
                <span
                  className="absolute -top-3 right-5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: 'var(--pw-amber)', color: '#241A00' }}
                >
                  Popular
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--pw-violet-deep)' }}>
                  Pro
                </p>
                <p className="mt-2 font-heading text-3xl font-bold" style={{ color: 'var(--pw-text-primary)' }}>
                  $9<span className="text-sm font-normal" style={{ color: 'var(--pw-text-muted)' }}>/month</span>
                </p>
                <ul className="mt-4 flex flex-col gap-2.5 text-sm" style={{ color: 'var(--pw-text-secondary)' }}>
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--pw-violet)' }} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setStep('payment')}
              className="rounded-xl px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(100deg, var(--pw-violet-deep), var(--pw-violet))', color: '#FFFFFF' }}
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {step === 'payment' && (
          <form onSubmit={handleSubscribe} className="flex flex-col gap-5 px-7 py-7">
            <button
              type="button"
              onClick={() => setStep('plans')}
              className="w-fit text-xs"
              style={{ color: 'var(--pw-text-muted)' }}
            >
              ← Back to plans
            </button>

            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ backgroundColor: 'var(--pw-surface-alt)', color: 'var(--pw-text-muted)', border: '1px solid var(--pw-border)' }}
            >
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Demo payment form — for evaluation purposes only. No card is charged and no data is transmitted.
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--pw-text-secondary)' }}>
                Name on card
                <input
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  placeholder="Muhammad Ibrahim"
                  className="rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: 'var(--pw-surface-alt)', border: '1px solid var(--pw-border)', color: 'var(--pw-text-primary)' }}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--pw-text-secondary)' }}>
                Card number
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: 'var(--pw-surface-alt)', border: '1px solid var(--pw-border)' }}
                >
                  <CreditCard className="h-4 w-4 shrink-0" style={{ color: 'var(--pw-text-muted)' }} />
                  <input
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: 'var(--pw-text-primary)' }}
                  />
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--pw-text-secondary)' }}>
                  Expiry
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: 'var(--pw-surface-alt)', border: '1px solid var(--pw-border)', color: 'var(--pw-text-primary)' }}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--pw-text-secondary)' }}>
                  CVC
                  <input
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                    placeholder="123"
                    className="rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: 'var(--pw-surface-alt)', border: '1px solid var(--pw-border)', color: 'var(--pw-text-primary)' }}
                  />
                </label>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs" style={{ color: 'var(--pw-text-secondary)' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              I agree to the NeuroCode Pro Terms &amp; Conditions and understand this is a demonstration
              subscription flow with no real billing.
            </label>

            <button
              type="submit"
              disabled={!agreed}
              className="rounded-xl px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: 'linear-gradient(100deg, var(--pw-violet-deep), var(--pw-violet))', color: '#FFFFFF' }}
            >
              Subscribe — $9/month
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-3 px-7 py-14 text-center">
            <ShieldCheck className="h-10 w-10" style={{ color: 'var(--pw-teal)' }} />
            <h2 className="font-heading text-lg font-semibold" style={{ color: 'var(--pw-text-primary)' }}>
              This is where a real subscription would activate
            </h2>
            <p className="max-w-sm text-sm" style={{ color: 'var(--pw-text-secondary)' }}>
              {copy.name} access isn't billed or unlocked yet — this screen demonstrates the intended upgrade
              experience for future implementation.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: 'var(--pw-surface-alt)', border: '1px solid var(--pw-border)', color: 'var(--pw-text-primary)' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}