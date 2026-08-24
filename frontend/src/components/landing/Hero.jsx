import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, CheckCircle2, Braces, Terminal } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
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
        style={{ background: 'radial-gradient(circle, var(--l-green-bright) 0%, transparent 70%)', opacity: 0.14 }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide"
            style={{ borderColor: 'var(--l-border)', color: 'var(--l-green-bright)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--l-green-bright)' }} />
            THE AI-POWERED CODING PLATFORM
          </div>

          <h1
            className="mt-7 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: 'var(--l-text-primary)' }}
          >
            Practice that adapts.
            <br />
            <span style={{ color: 'var(--l-green-bright)' }}>Proof that can't be faked.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
            NeuroCode combines an AI-adaptive learning roadmap, real sandboxed code execution, and
            behavior-verified proctored assessments into one connected platform.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: 'var(--l-green-bright)', color: '#06110A' }}
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
            <div className="relative">
              {/* decorative code-symbol accents around the card */}
              <Braces
                className="absolute -left-10 top-4 h-8 w-8 opacity-40"
                style={{ color: 'var(--l-green-mid)' }}
              />
              <Terminal
                className="absolute -right-8 bottom-10 h-7 w-7 opacity-40"
                style={{ color: 'var(--l-gray-green)' }}
              />

              <Tilt
                tiltMaxAngleX={14}
                tiltMaxAngleY={14}
                perspective={1600}
                glareEnable
                glareMaxOpacity={0.12}
                glareColor="#34D67C"
                glarePosition="all"
                scale={1.02}
                transitionSpeed={1200}
              >
                <div className="l-card-3d">
                  <div className="l-card-face l-card-side" />
                  <div className="l-card-face l-card-bottom" />
                  <div className="l-card-face l-card-front flex flex-col justify-between p-5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'var(--l-text-muted)' }}>practice.py</span>
                      <span className="flex items-center gap-1" style={{ color: 'var(--l-green-bright)' }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> 5/5 passed
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap leading-6" style={{ color: 'var(--l-text-secondary)' }}>
                      <span style={{ color: 'var(--l-green-mid)' }}>def</span>{' '}
                      <span style={{ color: 'var(--l-text-primary)' }}>solve</span>(nums):
                      {'\n'}    seen = {'{}'}
                      {'\n'}    <span style={{ color: 'var(--l-green-mid)' }}>for</span> i, n <span style={{ color: 'var(--l-green-mid)' }}>in</span>{' '}
                      enumerate(nums):
                    </pre>
                    <div
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] w-fit"
                      style={{ backgroundColor: 'var(--l-surface-alt)', color: 'var(--l-green-bright)' }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--l-green-bright)' }} />
                      Executed in a sandbox
                    </div>
                  </div>
                </div>
              </Tilt>
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
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--l-green-bright)' }} />
              {label}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}