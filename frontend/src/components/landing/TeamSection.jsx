import SocialBadge from './SocialBadge';
import Reveal from './Reveal';

const SUPERVISOR = {
  name: 'Prof. Ayaz Keerio',
  role: 'Supervisor',
  org: 'Director, IMCS · University of Sindh',
};

// Placeholder links for Arsal and Ali are intentionally structured but
// non-functional — clearly meant to be swapped for real URLs later, not
// invented usernames.
const TEAM = [
  {
    name: 'Muhammad Ibrahim',
    role: 'Team Leader · Lead Backend, AI & Gamification Engineer',
    leader: true,
    avatar: 'https://github.com/mibrahim-O2.png',
    responsibilities: [
      'Backend architecture & development', 'FastAPI', 'PostgreSQL / Supabase', 'API development',
      'AI/ML integration', 'Proctoring & assessment systems', 'Gamification system & progression logic',
      'DevOps, deployment & testing', 'Git/GitHub', 'Overall technical architecture',
      'Frontend integration where required',
    ],
    links: {
      github: 'https://github.com/mibrahim-O2',
      linkedin: 'https://github.com/mibrahim-O2',
      email: 'mailto:mibrahimkhalid306@gmail.com',
      x: 'https://x.com/MIbraheem_02',
      facebook: 'https://web.facebook.com/mibrahim.O2',
    },
  },
  {
    name: 'Arsal Jan Chandio',
    role: 'AI/RAG · Security Engineer',
    leader: false,
    avatar: null,
    responsibilities: [
      'AI/RAG pipeline', 'Claude API and prompting', 'ChromaDB / Tree-sitter',
      'Security-related implementation', 'Authentication/integration work',
    ],
    links: {
      github: 'https://github.com/REPLACE_ARSAL_GITHUB',
      linkedin: 'https://linkedin.com/in/REPLACE_ARSAL_LINKEDIN',
      email: 'mailto:REPLACE_ARSAL_EMAIL@example.com',
      x: 'https://x.com/REPLACE_ARSAL_X',
      facebook: 'https://facebook.com/REPLACE_ARSAL_FACEBOOK',
    },
  },
  {
    name: 'Ali Mugheri',
    role: 'Frontend · UI/UX Engineer',
    leader: false,
    avatar: null,
    responsibilities: [
      'Frontend UI implementation', 'React', 'Tailwind', 'Component development', 'UI/UX',
      'Responsive interfaces', 'Documentation', 'Frontend testing', 'Vercel/frontend deployment support',
    ],
    links: {
      github: 'https://github.com/REPLACE_ALI_GITHUB',
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
      className="l-card l-shimmer flex h-full flex-col gap-4 p-6"
      style={
        member.leader
          ? { borderColor: 'var(--l-gold)', boxShadow: '0 0 0 1px var(--l-gold), 0 25px 60px -25px rgba(212,175,55,0.35)' }
          : undefined
      }
    >
      {member.leader && (
        <span
          className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: 'var(--l-gold)', color: '#0B0B0D' }}
        >
          Team Leader
        </span>
      )}
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name}
            className="h-14 w-14 rounded-xl object-cover"
            style={{ border: `2px solid ${member.leader ? 'var(--l-gold)' : 'var(--l-border)'}` }}
          />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--l-bg-alt)', color: 'var(--l-text-secondary)', border: '2px solid var(--l-border)' }}
          >
            {initials(member.name)}
          </div>
        )}
        <div>
          <p className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>{member.name}</p>
          <p className="text-xs" style={{ color: member.leader ? 'var(--l-gold)' : 'var(--l-text-secondary)' }}>{member.role}</p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {member.responsibilities.slice(0, 4).map((r) => (
          <li
            key={r}
            className="rounded-full px-2 py-0.5 text-[10px]"
            style={{ backgroundColor: 'var(--l-bg-alt)', color: 'var(--l-text-muted)' }}
          >
            {r}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex gap-2 pt-2">
        {Object.entries(member.links).map(([platform, href]) => (
          <SocialBadge key={platform} platform={platform} href={href} />
        ))}
      </div>
    </div>
  );
}

export default function TeamSection() {
  return (
    <section id="team" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-gold)' }}>
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
              style={{ backgroundColor: 'var(--l-bg-alt)', color: 'var(--l-text-secondary)', border: '2px solid var(--l-border)' }}
            >
              {initials(SUPERVISOR.name)}
            </div>
            <div>
              <p className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>{SUPERVISOR.name}</p>
              <p className="text-xs" style={{ color: 'var(--l-gold)' }}>{SUPERVISOR.role}</p>
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