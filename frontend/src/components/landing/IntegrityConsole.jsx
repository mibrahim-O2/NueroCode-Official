import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import Reveal from './Reveal';

const SIGNALS = [
  { label: 'Tab Switch Tracking', value: 98 },
  { label: 'Paste Detection', value: 95 },
  { label: 'Camera Verification', value: 100 },
  { label: 'Keystroke Rhythm', value: 91 },
];

const SCORE = 92;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function IntegrityConsole() {
  const ref = useRef(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offset = animated ? CIRCUMFERENCE - (CIRCUMFERENCE * SCORE) / 100 : CIRCUMFERENCE;

  return (
    <section id="integrity" className="px-6 py-24">
      <div className="mx-auto max-w-6xl" ref={ref}>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-gold)' }}>
            Integrity Console — Sample Session
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl" style={{ color: 'var(--l-text-primary)' }}>
            Four independent signals, one live score
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--l-text-muted)' }}>
            <Info className="h-3.5 w-3.5" /> This is an illustrative example of NeuroCode's assessment
            integrity system — not live telemetry.
          </p>
        </Reveal>

        <div className="l-card mt-8 grid gap-6 p-6 sm:p-8 lg:grid-cols-[220px_1fr]">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 140 140" className="h-40 w-40 -rotate-90">
                <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--l-border)" strokeWidth="10" />
                <circle
                  cx="70"
                  cy="70"
                  r={RADIUS}
                  fill="none"
                  stroke="var(--l-gold)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-3xl font-bold" style={{ color: 'var(--l-text-primary)' }}>
                  {SCORE}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--l-text-muted)' }}>out of 100</span>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: 'var(--l-emerald)', color: 'var(--l-emerald)' }}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> High Integrity
            </span>
          </div>

          <div className="flex flex-col justify-center gap-4">
            {SIGNALS.map((s) => (
              <div key={s.label}>
                <div className="mb-1.5 flex justify-between text-xs" style={{ color: 'var(--l-text-secondary)' }}>
                  <span>{s.label}</span>
                  <span className="font-mono" style={{ color: 'var(--l-text-primary)' }}>{s.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--l-bg-alt)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: animated ? `${s.value}%` : '0%',
                      background: 'linear-gradient(90deg, var(--l-gold-deep), var(--l-gold))',
                      transition: 'width 1.2s cubic-bezier(.16,1,.3,1)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}