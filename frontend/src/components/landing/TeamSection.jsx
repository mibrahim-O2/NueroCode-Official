import SocialBadge from './SocialBadge';
import Reveal from './Reveal';

const SUPERVISOR = {
  name: 'Prof. Ayaz Keerio',
  role: 'Supervisor',
  org: 'Director, IMCS · University of Sindh',
};

const TEAM = [
  {
    name: 'Arsal Jan Chandio',
    role: 'Frontend & Real-Time Systems Engineer · ML Engineer',
    leader: false,
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
    role: 'Full Stack Design · Backend & Systems Architect · AI & Gamified Engineer',
    leader: true,
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
    leader: false,
    avatar: 'https://github.com/AliMugheri.png',
    links: {
      github: 'https://github.com/AliMugheri',
      linkedin: 'https://linkedin.com/in/REPLACE_ALI_LINKEDIN',
      email: 'mailto:REPLACE_ALI_EMAIL@example.com',
      x: 'https://x.com/REPLACE_ALI_X',
      facebook: 'https://facebook.com/REPLACE_ALI_FACEBOOK',
    },
  },
];

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function TeamCard({ member }) {
  return (
    <div
      className="l-card l-shimmer relative flex h-full flex-col overflow-hidden"
      style={
        member.leader
          ? { borderColor: 'var(--l-gold)', boxShadow: '0 0 0 1px var(--l-gold), 0 25px 60px -25px rgba(212,175,55,0.35)' }
          : { borderColor: 'var(--l-border)' }
      }
    >
      {member.leader && (
        <span
          className="absolute z-10 m-4 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: 'var(--l-gold)', color: '#1A1300' }}
        >
          Team Leader
        </span>
      )}

      {/* Photo fills the top of the card — the primary visual, per this
          pass's instruction, replacing the previous small circular
          avatar + skill-tag layout. */}
      <div className="relative aspect-[4/5] w-full">
        <img
          src={member.avatar}
          alt={member.name}
          className="h-full w-full object-cover"
          style={{ borderBottom: `2px solid ${member.leader ? 'var(--l-gold)' : 'var(--l-border)'}` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{ background: 'linear-gradient(180deg, transparent, var(--l-surface))' }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="font-heading text-base font-semibold" style={{ color: member.leader ? 'var(--l-gold)' : 'var(--l-text-primary)' }}>
            {member.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: member.leader ? 'var(--l-gold)' : 'var(--l-text-secondary)' }}>
            {member.role}
          </p>
        </div>

        <div className="mt-auto flex gap-2 pt-2">
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
    <section id="team" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-orange)' }}>
            Team &amp; Supervisors
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl" style={{ color: 'var(--l-text-primary)' }}>
            The people behind NeuroCode
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="l-card mt-10 flex items-center gap-4 p-6">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--l-surface-alt)', color: 'var(--l-text-secondary)', border: '2px solid var(--l-border)' }}
            >
              {initials(SUPERVISOR.name)}
            </div>
            <div>
              <p className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>{SUPERVISOR.name}</p>
              <p className="text-xs" style={{ color: 'var(--l-orange)' }}>{SUPERVISOR.role}</p>
              <p className="text-xs" style={{ color: 'var(--l-text-muted)' }}>{SUPERVISOR.org}</p>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member, i) => (
            <Reveal key={member.name} delay={120 + i * 80}>
              <TeamCard member={member} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}