import SocialBadge from './SocialBadge';
import Reveal from './Reveal';

const TEAM = [
  {
    name: 'Arsal Jan',
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
    name: 'Ali',
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

      <div className="flex justify-center pt-6">
        <div className="relative h-28 w-28 overflow-hidden rounded-2xl sm:h-32 sm:w-32">
          <img
            src={member.avatar}
            alt={member.name}
            className="h-full w-full object-cover"
            style={{ border: `2px solid ${member.leader ? 'var(--l-gold)' : 'var(--l-border)'}` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-3 p-5 text-center">
        <div>
          {/* Name/role now match every other card's text color exactly —
              gold stays reserved for the border, badge, and photo ring
              above, which already communicate "leader" clearly without
              needing the text itself to be gold (which read as less
              professional and had real contrast issues in light mode). */}
          <p className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
            {member.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
            {member.role}
          </p>
        </div>
        <div className="mt-auto flex justify-center gap-2 pt-2">
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
    <section id="team" className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-orange)' }}>
            Team
          </p>
          <h2 className="mt-3 text-center font-heading text-3xl font-bold sm:text-4xl" style={{ color: 'var(--l-text-primary)' }}>
            The people behind NeuroCode
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member, i) => (
            <Reveal key={member.name} delay={i * 80}>
              <TeamCard member={member} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}