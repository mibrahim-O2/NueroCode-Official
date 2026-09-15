// This section was changed from a three-person team grid to a single
// developer card because NeuroCode is a solo Final Year Project: the public
// landing page now presents its one developer only, and no other person's
// details appear here. The section keeps id="team" so every existing #team
// anchor (Navbar, Footer) keeps scrolling here without changes.
import SocialBadge from './SocialBadge';
import Reveal from './Reveal';

// Every URL below is carried over unchanged from the previous team data for
// Muhammad Ibrahim — none are new.
const DEVELOPER = {
  firstName: 'Muhammad',
  lastName: 'Ibrahim',
  role: 'Full Stack Design · Backend & Systems Architect · AI & Gamified Engineer',
  bio: "Every great idea begins with code. I'm an AI engineer and software developer building intelligent, real-world solutions.",
  avatar: 'https://github.com/mibrahim-O2.png',
  githubProfile: 'https://github.com/mibrahim-O2',
  links: {
    github: 'https://github.com/mibrahim-O2',
    linkedin: 'https://github.com/mibrahim-O2',
    email: 'mailto:mibrahimkhalid306@gmail.com',
    x: 'https://x.com/MIbraheem_02',
    facebook: 'https://web.facebook.com/mibrahim.O2',
  },
};

// Faint circuit motif behind the portrait — a scaled-down echo of
// HeroNetwork's traces and nodes, reusing the page's existing
// .l-network-line / .l-network-node animation classes rather than a new
// visual technique. Purely decorative, so hidden from assistive tech.
const CIRCUIT_TRACES = [
  { d: 'M8,40 H48 L70,62', color: 'var(--l-orange)', node: [70, 62] },
  { d: 'M8,160 H44 L66,138', color: 'var(--l-orange)', node: [66, 138] },
  { d: 'M192,52 H154 L132,74', color: 'var(--l-teal)', node: [132, 74] },
  { d: 'M192,150 H158 L136,128', color: 'var(--l-teal)', node: [136, 128] },
  { d: 'M100,6 V34', color: 'var(--l-orange)', node: [100, 34] },
  { d: 'M100,194 V166', color: 'var(--l-teal)', node: [100, 166] },
];

function PortraitCircuit() {
  return (
    <svg viewBox="0 0 200 200" className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0.35 }} aria-hidden="true">
      <g fill="none" strokeWidth="1.2">
        {CIRCUIT_TRACES.map((trace, i) => (
          <path key={i} d={trace.d} stroke={trace.color} className="l-network-line" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </g>
      {CIRCUIT_TRACES.map((trace, i) => (
        <circle
          key={i}
          cx={trace.node[0]}
          cy={trace.node[1]}
          r="2.4"
          fill="currentColor"
          className="l-network-node"
          style={{ color: trace.color, animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </svg>
  );
}

export default function TeamSection() {
  return (
    <section id="team" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="l-card relative overflow-hidden p-8 sm:p-12">
            <div className="grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-14">
              {/* Left: circular portrait. The soft radial glow is the same
                  blurred radial-gradient technique as the hero's background
                  glow, and the ring reuses the hero logo's breathing
                  .l-hero-ring, both scaled down for a small portrait. */}
              <div className="relative mx-auto flex h-60 w-60 items-center justify-center sm:h-72 sm:w-72">
                <PortraitCircuit />
                <div
                  className="pointer-events-none absolute inset-8 rounded-full blur-2xl"
                  style={{ background: 'radial-gradient(circle, var(--l-orange) 0%, transparent 65%)', opacity: 0.35 }}
                />
                <div className="relative h-44 w-44 sm:h-52 sm:w-52">
                  <div className="l-hero-ring" style={{ inset: '-10px' }} />
                  <img
                    src={DEVELOPER.avatar}
                    alt={`${DEVELOPER.firstName} ${DEVELOPER.lastName}`}
                    className="relative h-full w-full rounded-full border-2 object-cover"
                    style={{ borderColor: 'var(--l-orange)', boxShadow: '0 0 40px -8px rgba(255, 110, 26, 0.55)' }}
                  />
                </div>
              </div>

              {/* Right: text block */}
              <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-orange)' }}>
                  The Developer
                </p>

                {/* Two-tone name, mirroring the logo wordmark ("Neuro" + orange "Code"). */}
                <h2 className="font-heading text-4xl font-bold leading-tight sm:text-5xl">
                  <span style={{ color: 'var(--l-text-primary)' }}>{DEVELOPER.firstName}</span>{' '}
                  <span style={{ color: 'var(--l-orange)' }}>{DEVELOPER.lastName}</span>
                </h2>

                <div
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
                  style={{ borderColor: 'var(--l-border)', color: 'var(--l-text-secondary)' }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--l-orange)' }} />
                  {DEVELOPER.role}
                </div>

                <blockquote
                  className="max-w-xl border-l-2 pl-4 text-left text-base italic leading-relaxed"
                  style={{ borderColor: 'var(--l-orange)', color: 'var(--l-text-secondary)' }}
                >
                  “{DEVELOPER.bio}”
                </blockquote>

                <a
                  href={DEVELOPER.githubProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--l-orange)' }}
                >
                  Explore more of my work on GitHub ↗
                </a>

                <div className="flex gap-2">
                  {Object.entries(DEVELOPER.links).map(([platform, href]) => (
                    <SocialBadge key={platform} platform={platform} href={href} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
