import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, Braces, Terminal } from 'lucide-react';
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

// Circuit-board brain — a dense outline pass in dark green (the
// "shadow"/depth lines, mirroring the reference image's dark-blue
// layer) plus a brighter, sparser gold pass on top (the "lit" traces,
// mirroring the reference's light-blue glow layer). Same structural
// idea as the reference's brain icon, recolored to our locked palette.
function CircuitBrain() {
  return (
    <svg viewBox="0 0 300 220" className="h-[150px] w-[210px]" aria-hidden="true">
      <defs>
        <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* brain silhouette */}
      <path
        d="M150 14C95 14 56 46 60 88c2 22 16 32 16 50 0 14 12 26 26 26h6"
        fill="none" stroke="var(--l-green-dark)" strokeWidth="2" strokeLinecap="round" opacity="0.7"
      />
      <path
        d="M150 14c55 0 94 32 90 74-2 22-16 32-16 50 0 14-12 26-26 26h-6"
        fill="none" stroke="var(--l-green-dark)" strokeWidth="2" strokeLinecap="round" opacity="0.7"
      />

      {/* dark-green "shadow" trace layer — dense, background depth */}
      <g stroke="var(--l-green-dark)" strokeWidth="1" fill="none" opacity="0.65">
        <path d="M90 60 L120 48 M120 48 L140 68 M140 68 L110 90 M110 90 L84 78" />
        <path d="M140 68 L166 88 M166 88 L190 66 M166 88 L150 118 M150 118 L120 108" />
        <path d="M150 118 L170 142 M170 142 L150 166 M170 142 L198 130" />
        <path d="M110 90 L96 118 M96 118 L114 140 M114 140 L150 166" />
        <rect x="136" y="62" width="8" height="8" fill="none" stroke="var(--l-green-dark)" />
        <rect x="184" y="60" width="7" height="7" fill="none" stroke="var(--l-green-dark)" />
      </g>

      {/* gold "lit" trace layer — sparser, the visual focal points */}
      <g stroke="var(--l-gold)" strokeWidth="1.3" fill="none" filter="url(#goldGlow)">
        <path d="M120 48 L140 68 L110 90 L150 118" opacity="0.9" />
        <path d="M150 118 L170 142 L150 166" opacity="0.9" />
        <path d="M140 68 L166 88 L190 66" opacity="0.75" />
      </g>
      <g fill="var(--l-gold)" filter="url(#goldGlow)">
        <circle cx="120" cy="48" r="2.6" />
        <circle cx="140" cy="68" r="3" />
        <circle cx="110" cy="90" r="2.6" />
        <circle cx="150" cy="118" r="3.4" />
        <circle cx="170" cy="142" r="2.6" />
        <circle cx="150" cy="166" r="2.6" />
        <circle cx="166" cy="88" r="2.2" opacity="0.85" />
      </g>
    </svg>
  );
}

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
              <Braces
                className="absolute -left-9 top-2 h-6 w-6 opacity-25"
                style={{ color: 'var(--l-gray-green)' }}
              />
              <Terminal
                className="absolute -right-7 bottom-6 h-5 w-5 opacity-25"
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
                  <div className="l-card-face l-card-front relative flex flex-col items-center justify-between overflow-hidden p-5">
                    <div className="mt-2 flex flex-1 items-center justify-center">
                      <CircuitBrain />
                    </div>

                    {/* bottom scrim so the text stays legible over the artwork,
                        matching the reference card's bottom-anchored text block */}
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                      style={{ background: 'linear-gradient(180deg, transparent, var(--l-surface) 75%)' }}
                    />

                    <div className="relative z-10 w-full text-left">
                      <p className="font-heading text-2xl font-black" style={{ color: 'var(--l-text-primary)' }}>
                        NeuroCode
                      </p>
                      <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--l-gray-green)' }}>
                        Where Intelligence Meets Code
                      </p>
                      <p className="mt-2 text-[10px]" style={{ color: 'var(--l-text-muted)' }}>
                        Final Year Project · IMCS, University of Sindh
                      </p>
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