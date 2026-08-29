import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, Braces, Terminal } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import Logo from '@/components/common/Logo';
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
        style={{
          background: 'radial-gradient(circle, var(--l-orange) 0%, transparent 60%), radial-gradient(circle at 70% 30%, var(--l-teal) 0%, transparent 55%)',
          opacity: 0.16,
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide"
            style={{ borderColor: 'var(--l-border)', color: 'var(--l-orange)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--l-orange)' }} />
            THE AI-POWERED CODING PLATFORM
          </div>

          <h1
            className="mt-7 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: 'var(--l-text-primary)' }}
          >
            Practice that adapts.
            <br />
            <span style={{ color: 'var(--l-orange)' }}>Proof that can't be faked.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
            NeuroCode combines an AI-adaptive learning roadmap, real sandboxed code execution, and
            behavior-verified proctored assessments into one connected platform.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: 'var(--l-orange)', color: '#1A0900' }}
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

        {/* Spatial logo treatment: a continuous idle float + subtle 3D
            rotation + breathing glow (l-hero-logo-spatial, CSS-only),
            with react-parallax-tilt layered on top for hover
            interactivity. No card/box scaffolding and no overlaid text
            this pass — the logo itself is the whole visual, matching
            the Minimalism direction, with the wordmark already present
            in the left column. */}
        <Reveal delay={150}>
          <div className="l-perspective flex items-center justify-center py-10">
            <div className="relative">
              <Braces
                className="absolute -left-10 top-6 h-7 w-7 opacity-25"
                style={{ color: 'var(--l-teal)' }}
              />
              <Terminal
                className="absolute -right-8 bottom-10 h-6 w-6 opacity-25"
                style={{ color: 'var(--l-orange)' }}
              />

              <Tilt
                tiltMaxAngleX={8}
                tiltMaxAngleY={8}
                perspective={1600}
                scale={1.03}
                transitionSpeed={1000}
                glareEnable={false}
              >
                <div className="l-hero-logo-spatial">
                  <Logo variant="icon" size={240} animated={false} />
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
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--l-orange)' }} />
              {label}
            </div>
          ))}
        </div>
      </Reveal>

      <div className="l-scroll-cue relative mt-16 hidden justify-center sm:flex">
        <div className="flex flex-col items-center gap-2">
          <div className="l-scroll-cue-mouse">
            <span className="l-scroll-cue-dot" />
          </div>
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        </div>
      </div>
    </section>
  );
}