import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Reveal from './Reveal';

const TRUST_ITEMS = [
  'AI-Powered Adaptive Learning',
  'Real Code Execution',
  'Proctored Assessments',
  'Verifiable Credentials',
  'Trusted by Future Engineers',
];

export default function Hero() {
  const { user } = useAuth();

  return (
    <section id="top" className="relative overflow-hidden px-6 pb-24 pt-40 sm:pt-48">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, var(--l-gold) 0%, transparent 70%)', opacity: 0.12 }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide"
            style={{ borderColor: 'var(--l-border)', color: 'var(--l-gold)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--l-gold)' }} />
            THE AI-POWERED CODING PLATFORM
          </div>

          <h1
            className="mt-7 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: 'var(--l-text-primary)' }}
          >
            Practice that adapts.
            <br />
            <span className="l-gold-sweep">Proof that can't be faked.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
            NeuroCode combines an AI-adaptive learning roadmap, real sandboxed code execution, and
            behavior-verified proctored assessments into one connected platform.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="l-glow-soft inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(100deg, var(--l-gold-deep), var(--l-gold))', color: '#0B0B0D' }}
            >
              {user ? 'Go to Dashboard' : 'Get Started'} <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-medium"
              style={{ borderColor: 'var(--l-border)', color: 'var(--l-text-secondary)' }}
            >
              <PlayCircle className="h-4 w-4" /> See How It Works
            </button>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="l-perspective flex items-center justify-center py-6">
            <div className="l-tilt relative w-full max-w-md">
              <div
                className="pointer-events-none absolute inset-0 rounded-full blur-[100px]"
                style={{
                  background: 'radial-gradient(circle, var(--l-gold) 0%, var(--l-coral) 60%, transparent 80%)',
                  opacity: 0.18,
                }}
              />
              <svg viewBox="0 0 480 480" className="l-glow-gold relative w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="heroHead" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--l-gold-soft)" />
                    <stop offset="100%" stopColor="var(--l-gold)" />
                  </linearGradient>
                </defs>
                <path
                  d="M240 46C130 46 58 132 70 230c7 58 46 94 46 142 0 26 21 47 47 47h14"
                  fill="none"
                  stroke="url(#heroHead)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <g stroke="var(--l-gold)" strokeOpacity="0.5" strokeWidth="1.3" fill="none">
                  <path d="M150 130 L200 104" />
                  <path d="M200 104 L246 156" />
                  <path d="M246 156 L188 190" />
                  <path d="M188 190 L142 172" />
                  <path d="M188 190 L228 236" />
                  <path d="M228 236 L270 208" />
                  <path d="M228 236 L178 278" />
                  <path d="M178 278 L222 318" />
                  <path d="M222 318 L196 358" />
                </g>
                <g fill="var(--l-gold)">
                  {[
                    [150, 130], [200, 104], [246, 156], [142, 172],
                    [270, 208], [228, 236], [178, 278], [222, 318], [196, 358],
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="4" opacity="0.9" />
                  ))}
                  <circle cx="188" cy="190" r="6" fill="var(--l-gold-soft)" />
                </g>
                <ellipse cx="240" cy="410" rx="120" ry="14" fill="var(--l-emerald)" opacity="0.18" />
                <ellipse cx="240" cy="410" rx="80" ry="9" fill="none" stroke="var(--l-mint)" strokeOpacity="0.5" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={250}>
        <div
          className="l-card mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 px-6 py-5 text-xs sm:grid-cols-5"
          style={{ color: 'var(--l-text-secondary)' }}
        >
          {TRUST_ITEMS.map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--l-gold)' }} />
              {label}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}