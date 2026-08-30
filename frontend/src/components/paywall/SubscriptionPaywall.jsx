import { useState } from 'react';
import { X, Check, Sparkles, Cpu, Bot, CreditCard, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import Logo from '@/components/common/Logo';

const PLANS = [
  {
    key: 'gemini',
    icon: Sparkles,
    name: 'Free',
    tagline: 'Meet NeuroCode AI',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'Gemini-powered problem generation',
      'Full adaptive roadmap',
      'Practice, Mock Interview & Assessments',
      'Verifiable credentials',
    ],
    cta: 'Included with your account',
    active: true,
  },
  {
    key: 'openai',
    icon: Cpu,
    name: 'Pro',
    tagline: 'Generate with GPT',
    priceMonthly: 9,
    priceYearly: 90,
    features: [
      'Everything in Free, plus:',
      'GPT (OpenAI)-powered generation',
      'Compare Gemini vs. GPT problem quality',
      'Priority generation queue',
    ],
    cta: 'Get Pro plan',
    featured: true,
  },
  {
    key: 'claude',
    icon: Bot,
    name: 'Max',
    tagline: 'Generate with Claude',
    priceMonthly: 19,
    priceYearly: 190,
    features: [
      'Everything in Pro, plus:',
      'Claude (Sonnet 5)-powered generation',
      'Early access to new AI providers',
      'Highest generation priority',
    ],
    cta: 'Get Max plan',
    notImplemented: true,
  },
];

export default function SubscriptionPaywall({ provider, onClose }) {
  const [step, setStep] = useState('plans'); // 'plans' | 'payment' | 'success'
  const [billing, setBilling] = useState('yearly');
  const [selectedPlan, setSelectedPlan] = useState(
    PLANS.find((p) => p.key === provider) || PLANS[1]
  );
  const [agreed, setAgreed] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const goToPayment = (plan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!agreed) return;
    setStep('success');
  };

  const priceFor = (plan) => (billing === 'yearly' ? plan.priceYearly : plan.priceMonthly);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5,3,2,0.8)' }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-y-auto rounded-2xl border border-border bg-charcoal shadow-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {step !== 'plans' && (
              <button
                onClick={() => setStep('plans')}
                className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors duration-200 hover:text-orange"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step === 'plans' && (
              <span className="font-heading text-lg font-semibold text-text-primary">Upgrade</span>
            )}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'plans' && (
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h2 className="font-heading text-2xl font-bold text-text-primary">Choose your AI provider plan</h2>
                <p className="mt-1 text-sm text-text-secondary">Gemini is free forever. Upgrade for more model choice.</p>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-border bg-elevated p-1 text-sm">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`rounded-full px-3.5 py-1.5 transition-colors duration-200 ${
                    billing === 'monthly' ? 'bg-card text-text-primary' : 'text-text-muted'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors duration-200 ${
                    billing === 'yearly' ? 'bg-card text-text-primary' : 'text-text-muted'
                  }`}
                >
                  Yearly <span className="text-teal">· Save 17%</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const price = priceFor(plan);
                return (
                  <div
                    key={plan.key}
                    className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                      plan.featured ? 'border-orange' : 'border-border'
                    }`}
                  >
                    {plan.featured && (
                      <span className="absolute -top-3 left-6 rounded-full bg-orange px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Most Popular
                      </span>
                    )}

                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border">
                      <Icon className="h-5 w-5 text-text-primary" />
                    </div>

                    <h3 className="mt-4 font-heading text-xl font-bold text-text-primary">{plan.name}</h3>
                    <p className="mt-0.5 text-sm text-text-secondary">{plan.tagline}</p>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="font-heading text-3xl font-bold text-text-primary">
                        {price === 0 ? '$0' : `$${price}`}
                      </span>
                      {price > 0 && (
                        <span className="text-xs text-text-secondary">
                          USD / {billing === 'yearly' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>

                    {plan.active ? (
                      <div className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-elevated px-4 py-2.5 text-sm font-semibold text-text-primary">
                        <Check className="h-4 w-4 text-teal" /> Current plan
                      </div>
                    ) : (
                      <button
                        onClick={() => goToPayment(plan)}
                        className="mt-4 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#1A0900] transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                      >
                        {plan.cta}
                      </button>
                    )}

                    <ul className="mt-6 flex flex-col gap-3 text-sm">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-text-primary">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.notImplemented && (
                      <p className="mt-4 text-[11px] leading-relaxed text-text-muted">
                        Claude generation isn't connected on the backend yet — this plan is a preview of
                        what's coming, not something you can activate today.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 'payment' && (
          <form onSubmit={handleSubscribe} className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
                <selectedPlan.icon className="h-4.5 w-4.5 text-text-primary" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-text-primary">{selectedPlan.name} plan</p>
                <p className="text-xs text-text-secondary">
                  ${priceFor(selectedPlan)} / {billing === 'yearly' ? 'year' : 'month'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2 text-xs text-text-secondary">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Demo payment form — for evaluation purposes only. No card is charged and no data is transmitted.
              {selectedPlan.notImplemented && ' Claude generation itself is not yet implemented, regardless of payment.'}
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                Name on card
                <input
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  placeholder="Muhammad Ibrahim"
                  className="rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                Card number
                <div className="flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2.5">
                  <CreditCard className="h-4 w-4 shrink-0 text-text-muted" />
                  <input
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-transparent text-sm text-text-primary outline-none"
                  />
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                  Expiry
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                  CVC
                  <input
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                    placeholder="123"
                    className="rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
                  />
                </label>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-text-secondary">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-orange" />
              I agree to the NeuroCode {selectedPlan.name} Terms &amp; Conditions and understand this is a
              demonstration subscription flow with no real billing.
            </label>

            <button
              type="submit"
              disabled={!agreed}
              className="rounded-xl bg-orange px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Subscribe — ${priceFor(selectedPlan)}/{billing === 'yearly' ? 'yr' : 'mo'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
              <ShieldCheck className="h-8 w-8 text-teal" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              This is where a real subscription would activate
            </h2>
            <p className="max-w-sm text-sm text-text-secondary">
              {selectedPlan.name} access isn't billed or unlocked yet — this screen demonstrates the intended
              upgrade experience for future implementation.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
              <Logo variant="icon" size={16} animated={false} /> NeuroCode
            </div>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-orange hover:text-orange active:scale-95"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}