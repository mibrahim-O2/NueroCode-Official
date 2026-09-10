import SocialBadge from './SocialBadge';
import Reveal from './Reveal';

const TEAM = [
  {
    name: 'Arsal Jan',
    role: 'Lead Frontend Architect · ML & Real-Time Telemetry Engineer · Interactive UI Systems',
    badge: 'Systems & ML',
    accent: 'orange',
    avatar: 'https://github.com/ArsalJan34.png',
    links: {
      github: 'https://github.com/ArsalJan34',
      linkedin: 'https://linkedin.com/in/REPLACE_ARSAL_LINKEDIN',
      email: 'mailto:REPLACE_ARSAL_EMAIL@example.com',
      x: 'https://x.com/REPLACE_ARSAL_X',
      facebook: 'https://facebook.com/REPLACE_ARSAL_FACEBOOK',
    },
  },
  {
    name: 'Muhammad Ibrahim',
    role: 'Lead Engineer & Full-Stack Architect · Backend, AI Integration & Gamification Systems',
    badge: 'Team Leader',
    accent: 'gold',
    avatar: 'https://github.com/mibrahim-O2.png',
    links: {
      github: 'https://github.com/mibrahim-O2',
      linkedin: 'https://github.com/mibrahim-O2',
      email: 'mailto:mibrahimkhalid306@gmail.com',
      x: 'https://x.com/MIbraheem_02',
      facebook: 'https://web.facebook.com/mibrahim.O2',
    },
  },
  {
    name: 'Ali Mugheri',
    role: 'DevOps Engineer · Piston & Deployment Lead · Docker & Containerization Engineer',
    badge: 'DevOps Lead',
    accent: 'teal',
    avatar: 'https://github.com/AliMugheri.png',
    links: {
      github: 'https://github.com/AliMugheri',
      linkedin:'https://www.linkedin.com/in/ali-mugheri-515484368?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      email: 'mailto:alibaloch35400@gmail.com',
      x: 'https://x.com/REPLACE_ALI_X',
      facebook:'https://www.facebook.com/share/1DgLMacU2y/',
    },
  },
];

const ACCENT_STYLES = {
  orange: {
    badgeBg: 'rgba(255, 107, 0, 0.1)',
    badgeText: '#ff6b00',
    badgeBorder: 'rgba(255, 107, 0, 0.25)',
    ring: '#ff6b00',
    cardStyle: {
      borderColor: 'rgba(255, 107, 0, 0.28)',
      boxShadow: '0 4px 20px -8px rgba(255, 107, 0, 0.15)',
    },
  },
  gold: {
    badgeBg: 'rgba(212, 175, 55, 0.1)',
    badgeText: '#d4af37',
    badgeBorder: 'rgba(212, 175, 55, 0.25)',
    ring: '#d4af37',
    cardStyle: {
      borderColor: 'rgba(212, 175, 55, 0.32)',
      boxShadow: '0 4px 20px -8px rgba(212, 175, 55, 0.15)',
    },
  },
  teal: {
    badgeBg: 'rgba(20, 184, 166, 0.1)',
    badgeText: '#14b8a6',
    badgeBorder: 'rgba(20, 184, 166, 0.25)',
    ring: '#14b8a6',
    cardStyle: {
      borderColor: 'rgba(20, 184, 166, 0.28)',
      boxShadow: '0 4px 20px -8px rgba(20, 184, 166, 0.15)',
    },
  },
};

function TeamCard({ member }) {
  const style = ACCENT_STYLES[member.accent] || ACCENT_STYLES.orange;

  return (
    <div
      className="l-card l-shimmer group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={style.cardStyle}
    >
      {/* Subtle Top Accent Line */}
      <div
        className="absolute inset-x-0 top-0 h-[1.5px] opacity-75"
        style={{
          background: `linear-gradient(90deg, transparent, ${style.ring}, transparent)`,
        }}
      />

      {/* Member Role Badge */}
      <div className="absolute right-4 top-4 z-10">
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase backdrop-blur-md"
          style={{
            backgroundColor: style.badgeBg,
            color: style.badgeText,
            borderColor: style.badgeBorder,
          }}
        >
          {member.badge}
        </span>
      </div>

      {/* Clean Avatar Frame */}
      <div className="flex justify-center pt-8">
        <div className="relative h-28 w-28 overflow-hidden rounded-2xl p-[1.5px] transition-transform duration-300 group-hover:scale-[1.03] sm:h-32 sm:w-32">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `linear-gradient(145deg, ${style.ring}80, transparent 70%)`,
            }}
          />
          <img
            src={member.avatar}
            alt={member.name}
            className="relative h-full w-full rounded-2xl object-cover"
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col items-center gap-2.5 p-6 text-center">
        <div>
          <p
            className="font-heading text-lg font-semibold tracking-tight"
            style={{ color: 'var(--l-text-primary)' }}
          >
            {member.name}
          </p>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: 'var(--l-text-secondary)' }}
          >
            {member.role}
          </p>
        </div>

        {/* Social Badges */}
        <div className="mt-auto flex justify-center gap-2 pt-2.5">
          {Object.entries(member.links).map(([platform, href]) => (
            <SocialBadge key={platform} platform={platform} href={href} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TeamSection() {
  return (
    <section id="team" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--l-orange)' }}
          >
            Engineering Team
          </p>
          <h2
            className="mt-3 text-center font-heading text-3xl font-bold sm:text-4xl"
            style={{ color: 'var(--l-text-primary)' }}
          >
            The people behind NeuroCode
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-center text-sm"
            style={{ color: 'var(--l-text-secondary)' }}
          >
            Architecting intelligent proctoring, AST code analysis, and gamified computer science education.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member, i) => (
            <Reveal key={member.name} delay={i * 90}>
              <TeamCard member={member} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
