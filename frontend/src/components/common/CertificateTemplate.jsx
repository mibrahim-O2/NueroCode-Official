import { forwardRef } from 'react';
import { ShieldCheck, Layers, Gauge, CalendarDays } from 'lucide-react';
import Logo from './Logo';
import { getAssessmentTitle } from '@/utils/certificateShare';

// Tier color themes — kept in exact agreement with CredentialCard.jsx's
// BADGE_STYLES (Part 11) so a credential's list-view badge and its full
// certificate always visually match. Each certificate's overall accent
// now derives from the ACTUAL earned tier, rather than always defaulting
// to a flat gold regardless of what was earned — a Bronze credential
// genuinely looks bronze, a Platinum credential genuinely looks
// platinum, not a re-skinned gold template. Gold remains fully reserved
// for the Gold tier itself and the Team Leader badge elsewhere in the
// app, consistent with the design system's gold-restriction policy.
const TIER_THEMES = {
  bronze: { primary: '#B08D57', accent: '#D4B483', glow: 'rgba(176, 141, 87, 0.35)' },
  silver: { primary: '#C0C0C0', accent: '#E4E4E4', glow: 'rgba(192, 192, 192, 0.3)' },
  gold: { primary: '#D4AF37', accent: '#F3DE8A', glow: 'rgba(212, 175, 55, 0.4)' },
  platinum: { primary: '#E5E4E2', accent: '#FFFFFF', glow: 'rgba(229, 228, 226, 0.35)' },
};

// Integrity is always a trust/status signal, independent of tier — the
// same reasoning already applied to IntegrityScoreBadge (Part 7) and the
// public verification banner (Part 11). It stays status-success green
// on every certificate regardless of badge tier.
const TRUST_GREEN = '#22C55E';

function starGlyph(cx, cy, r) {
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const radius = i % 2 === 0 ? r : r * 0.4;
    points.push(`${(cx + radius * Math.sin(angle)).toFixed(2)},${(cy - radius * Math.cos(angle)).toFixed(2)}`);
  }
  return `M${points.join('L')}Z`;
}

/**
 * TierEmblem — the left SVG badge representing the earned achievement
 * level. Fully recolored per tier via `theme`. Deliberately built from
 * clean geometric shapes only (layered shield, faceted gem, small
 * stars) — no crown, laurel, or ribbon clipart, matching the platform's
 * restrained visual language.
 */
function TierEmblem({ theme, badgeLevel }) {
  return (
    <div className="flex w-28 flex-col items-center gap-2">
      <svg viewBox="0 0 120 140" className="h-[92px] w-[92px]">
        <defs>
          <linearGradient id="tierEmblemBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.accent} />
            <stop offset="50%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.accent} />
          </linearGradient>
          <linearGradient id="tierEmblemGem" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.accent} />
          </linearGradient>
          <radialGradient id="tierEmblemGlow" cx="50%" cy="32%" r="65%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="60" cy="65" r="58" fill="url(#tierEmblemGlow)" />

        <path
          d="M60 8 L104 24 L104 62 Q104 104 60 132 Q16 104 16 62 L16 24 Z"
          fill="#141008"
          stroke="url(#tierEmblemBorder)"
          strokeWidth="3"
        />
        <path
          d="M60 18 L94 31 L94 62 Q94 94 60 118 Q26 94 26 62 L26 31 Z"
          fill="none"
          stroke={theme.accent}
          strokeWidth="1"
          strokeOpacity="0.55"
        />

        <g stroke={theme.accent} strokeOpacity="0.28" strokeWidth="0.75" fill="none">
          <path d="M60 34 L78 60 L60 86 L42 60 Z" />
          <path d="M60 44 L70 60 L60 76 L50 60 Z" />
        </g>

        <polygon points="60,46 72,58 66,72 54,72 48,58" fill="url(#tierEmblemGem)" stroke="#0F0B08" strokeWidth="0.75" />
        <polygon points="60,46 66,72 54,72" fill={theme.primary} opacity="0.55" />

        {[[30, 26], [90, 26], [30, 96], [90, 96]].map(([cx, cy], i) => (
          <path key={i} d={starGlyph(cx, cy, 3.4)} fill={theme.accent} opacity="0.9" />
        ))}
      </svg>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[9px] uppercase tracking-widest text-text-muted">Badge Level</span>
        <span className="font-heading text-sm font-bold capitalize" style={{ color: theme.primary }}>
          {badgeLevel}
        </span>
      </div>
    </div>
  );
}

/**
 * AuthenticitySeal — the right SVG badge representing trust and
 * verification. Fixed identity across every tier — verification status
 * is a constant, not something that scales with achievement level.
 */
function AuthenticitySeal() {
  const dots = Array.from({ length: 18 });
  return (
    <div className="flex w-28 flex-col items-center gap-2">
      <svg viewBox="0 0 120 120" className="h-[92px] w-[92px]">
        <defs>
          <linearGradient id="sealRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3DE8A" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <radialGradient id="sealGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={TRUST_GREEN} stopOpacity="0.32" />
            <stop offset="100%" stopColor={TRUST_GREEN} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="60" cy="60" r="56" fill="url(#sealGlow)" />

        {dots.map((_, i) => {
          const angle = (2 * Math.PI * i) / dots.length;
          const x = 60 + 52 * Math.cos(angle);
          const y = 60 + 52 * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="1.3" fill="#D4AF37" opacity="0.75" />;
        })}

        <circle cx="60" cy="60" r="46" fill="#141008" stroke="url(#sealRingGradient)" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="37" fill="none" stroke={TRUST_GREEN} strokeWidth="1.2" strokeOpacity="0.6" />
        <circle cx="60" cy="60" r="30" fill="none" stroke="#D4AF37" strokeWidth="0.75" strokeOpacity="0.4" strokeDasharray="2 3" />

        <path d="M60 38 L78 45 L78 63 Q78 82 60 92 Q42 82 42 63 L42 45 Z" fill="#0F0B08" stroke={TRUST_GREEN} strokeWidth="2" />
        <path d="M51 62 L57 69 L70 53" fill="none" stroke={TRUST_GREEN} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[9px] uppercase tracking-widest" style={{ color: TRUST_GREEN }}>Verified &amp;</span>
        <span className="font-heading text-xs font-bold" style={{ color: TRUST_GREEN }}>Secured</span>
      </div>
    </div>
  );
}

function CredentialMetric({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex min-h-[68px] items-center gap-3 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-3.5">
      <Icon className="h-4 w-4 shrink-0" style={{ color: tone }} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
        <p
          className="whitespace-normal break-words font-heading text-sm font-semibold leading-snug"
          style={{ color: tone === TRUST_GREEN || tone ? tone : '#F7F4F0' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * CertificateTemplate — the single shared certificate design, reused
 * unchanged across the student's private credential view, the public
 * /verify/:uuid page, and PDF export. Every value below is driven
 * entirely by the credential/ownerName/qrDataUrl/verifyUrl props — no
 * hardcoded student data anywhere. Deliberately animation-free: this
 * component is captured as a static frame by html2canvas for PDF
 * export, so any CSS animation here would be irrelevant at best and
 * risk an inconsistent mid-animation capture at worst.
 */
const CertificateTemplate = forwardRef(function CertificateTemplate(
  { credential, ownerName, qrDataUrl, verifyUrl },
  ref
) {
  const theme = TIER_THEMES[credential.badge_level] || TIER_THEMES.bronze;
  const assessmentTitle = getAssessmentTitle(credential.topics_mastered);
  const earnedDate = new Date(credential.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const shortId = credential.id?.slice(0, 8).toUpperCase();

  return (
    <div ref={ref} className="relative mx-auto w-full bg-[#0F0B08] text-[#F7F4F0]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${theme.primary} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          opacity: 0.05,
        }}
      />
      <div className="pointer-events-none absolute inset-3 rounded-lg border-2" style={{ borderColor: theme.primary }} />
      <div
        className="pointer-events-none absolute inset-5 rounded-md border"
        style={{ borderColor: theme.primary, opacity: 0.35 }}
      />

      <div className="relative flex flex-col gap-7 px-14 py-10">
        <div className="flex items-start justify-between">
          <TierEmblem theme={theme} badgeLevel={credential.badge_level} />

          <div className="flex flex-col items-center gap-3 pt-1">
            <Logo variant="icon" size={60} animated={false} />
            <span className="font-heading text-xl font-bold" style={{ color: '#F7F4F0' }}>
              Neuro<span style={{ color: theme.primary }}>Code</span>
            </span>
          </div>

          <AuthenticitySeal />
        </div>

        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1
            className="font-heading font-bold uppercase tracking-[0.2em]"
            style={{ fontSize: '2rem', color: theme.primary }}
          >
            NeuroCode Credential
          </h1>
          <div className="h-px w-40" style={{ backgroundColor: theme.primary }} />
          <p className="text-xs uppercase tracking-widest text-text-muted">Awarded to</p>
          <h2 className="font-heading font-bold" style={{ fontSize: '2.75rem', color: theme.accent }}>
            {ownerName}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[#C9BFB2]">
            Successfully completed the <strong style={{ color: '#F7F4F0' }}>{assessmentTitle}</strong> Assessment
            with verified technical excellence, integrity, and problem-solving proficiency.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3.5">
          <CredentialMetric icon={Layers} label="Topics Mastered" value={credential.topics_mastered.join(', ')} tone={theme.primary} />
          <CredentialMetric icon={Gauge} label="Assessment Score" value={`${credential.assessment_score}%`} tone={theme.primary} />
          <CredentialMetric icon={ShieldCheck} label="Integrity Score" value={`${credential.integrity_score}%`} tone={TRUST_GREEN} />
          <CredentialMetric icon={CalendarDays} label="Date Earned" value={earnedDate} tone="#C9BFB2" />
        </div>

        <div className="grid grid-cols-3 items-center gap-4 border-t pt-5" style={{ borderColor: theme.primary, borderTopWidth: 1, opacity: 1 }}>
          <div className="flex flex-col gap-0.5 text-left">
            <span className="font-heading text-xs italic text-[#C9BFB2]">NeuroCode Assessment Engine</span>
            <span className="text-[10px] uppercase tracking-wide text-text-disabled">AI Verification System</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Verification QR code"
                className="h-[72px] w-[72px] rounded-md border-2 bg-white p-1"
                style={{ borderColor: theme.primary }}
              />
            )}
            <p className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: TRUST_GREEN }}>
              <ShieldCheck className="h-3 w-3" /> Verify this credential
            </p>
            <p className="max-w-[240px] break-all text-center font-mono text-[9px] text-text-muted">{verifyUrl}</p>
          </div>

          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-[10px] uppercase tracking-wide text-text-disabled">Credential ID</span>
            <span className="font-mono text-xs text-[#C9BFB2]">{shortId}</span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-text-disabled">Digitally Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;