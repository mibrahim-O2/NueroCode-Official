import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import Logo from '@/components/common/Logo';
import { useAuth } from '@/context/AuthContext';
import Reveal from './Reveal';
import HeroNetwork from './HeroNetwork';

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
    <section id="top" className="relative overflow-hidden px-6 pb-20 pt-28 sm:pt-32">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-[140px]"
        style={{
          background: 'radial-gradient(circle, var(--l-orange) 0%, transparent 60%), radial-gradient(circle at 70% 30%, var(--l-teal) 0%, transparent 55%)',
          opacity: 0.16,
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide"
            style={{ borderColor: 'var(--l-border)', color: 'var(--l-orange)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--l-orange)' }} />
            THE AI-POWERED CODING PLATFORM
          </div>

          <h1
            className="mt-6 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
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

          <div className="mt-8 flex flex-wrap items-center gap-4">
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

        {/* Logo composition — network layer behind, orbiting satellites +
            breathing rings around, Tilt for hover, spatial float/rotate
            wrapper for continuous idle motion, Logo's own built-in
            glow+shimmer (animated=true) as an additional layered effect
            on top. Outer scale wrapper handles responsive sizing without
            needing Logo.jsx itself to support responsive props. */}
        <Reveal delay={150}>
          <div className="relative flex items-center justify-center py-6 lg:py-2">
            <HeroNetwork className="left-1/2 top-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 lg:h-[130%] lg:w-[130%]" />

            <div className="l-perspective relative scale-[0.62] sm:scale-[0.8] lg:scale-100">
              <div className="relative">
                <div className="l-hero-ring" />
                <div className="l-hero-ring-outer" />

                <div className="l-orbit">
                  <span className="l-orbit-dot" style={{ backgroundColor: 'var(--l-orange)' }} />
                </div>
                <div className="l-orbit l-orbit-reverse">
                  <span className="l-orbit-dot" style={{ backgroundColor: 'var(--l-teal)' }} />
                </div>

                <Tilt
                  tiltMaxAngleX={9}
                  tiltMaxAngleY={9}
                  perspective={1600}
                  scale={1.03}
                  transitionSpeed={1000}
                  glareEnable={false}
                >
                  <div className="l-hero-logo-spatial relative z-10">
                    <Logo variant="icon" size={340} animated />
                  </div>
                </Tilt>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={250}>
        <div
          className="l-card mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 px-6 py-5 text-xs sm:grid-cols-5"
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

      <div className="l-scroll-cue relative mt-12 hidden justify-center sm:flex">
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