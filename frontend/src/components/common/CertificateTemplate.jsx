import { forwardRef, useId } from 'react';
import { ShieldCheck, Layers, Gauge, CalendarDays } from 'lucide-react';
import Logo from './Logo';
import { getAssessmentTitle } from '@/utils/certificateShare';

// Each tier gets a fully distinct color identity — border, glow, badge
// gradient, and accent text all derive from this single source, so the
// badge automatically looks different per level with no extra logic
// anywhere else in the component.
const BADGE_THEMES = {
  bronze: { label: 'Bronze', primary: '#B08D57', accent: '#C68642', text: '#D9B98C' },
  silver: { label: 'Silver', primary: '#C7C9CC', accent: '#9CA3AF', text: '#E2E4E7' },
  gold: { label: 'Gold', primary: '#D4AF37', accent: '#F3DE8A', text: '#F3DE8A' },
  platinum: { label: 'Platinum', primary: '#D9E4EC', accent: '#6E8CA0', text: '#CFE0EA' },
};

function starPath(cx, cy, r) {
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const radius = i % 2 === 0 ? r : r * 0.4;
    points.push(`${(cx + radius * Math.sin(angle)).toFixed(2)},${(cy - radius * Math.cos(angle)).toFixed(2)}`);
  }
  return `M${points.join('L')}Z`;
}

/**
 * Left badge — the achievement level. Entirely SVG (scalable, crisp in
 * PDF export at any DPI): a layered shield with a metallic gradient
 * border, a subtle inner geometric facet pattern, a faceted gem as the
 * centerpiece (deliberately not a crown/laurel/ribbon), and four small
 * decorative stars. Every visual property — border color, gradient,
 * glow, accent — comes from `theme`, so swapping badge_level is the
 * only thing that ever needs to change to get a completely different
 * look.
 */
function AchievementBadge({ theme }) {
  const uid = useId();
  return (
    <div className="flex w-28 flex-col items-center gap-2">
      <svg viewBox="0 0 120 140" className="h-[92px] w-[92px]">
        <defs>
          <linearGradient id={`shield-border-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.accent} />
            <stop offset="50%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.accent} />
          </linearGradient>
          <linearGradient id={`gem-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.accent} />
          </linearGradient>
          <radialGradient id={`shield-glow-${uid}`} cx="50%" cy="32%" r="65%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="60" cy="65" r="58" fill={`url(#shield-glow-${uid})`} />

        {/* outer shield layer */}
        <path
          d="M60 8 L104 24 L104 62 Q104 104 60 132 Q16 104 16 62 L16 24 Z"
          fill="#111315"
          stroke={`url(#shield-border-${uid})`}
          strokeWidth="3"
        />
        {/* inset second layer — gives the "layered shield" depth */}
        <path
          d="M60 18 L94 31 L94 62 Q94 94 60 118 Q26 94 26 62 L26 31 Z"
          fill="none"
          stroke={theme.accent}
          strokeWidth="1"
          strokeOpacity="0.55"
        />

        {/* inner geometric facet pattern */}
        <g stroke={theme.accent} strokeOpacity="0.28" strokeWidth="0.75" fill="none">
          <path d="M60 34 L78 60 L60 86 L42 60 Z" />
          <path d="M60 44 L70 60 L60 76 L50 60 Z" />
        </g>

        {/* faceted gem centerpiece */}
        <polygon
          points="60,46 72,58 66,72 54,72 48,58"
          fill={`url(#gem-${uid})`}
          stroke="#0B0B0C"
          strokeWidth="0.75"
        />
        <polygon points="60,46 66,72 54,72" fill={theme.primary} opacity="0.55" />

        {/* decorative stars */}
        {[[30, 26], [90, 26], [30, 96], [90, 96]].map(([cx, cy], i) => (
          <path key={i} d={starPath(cx, cy, 3.4)} fill={theme.accent} opacity="0.9" />
        ))}
      </svg>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[9px] uppercase tracking-widest text-text-muted">Badge Level</span>
        <span className="font-heading text-sm font-bold" style={{ color: theme.text }}>
          {theme.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Right badge — the verification seal. Fixed identity regardless of
 * badge tier (verification status doesn't change per level) — circular
 * certification-seal styling with concentric rings, a dotted outer
 * perimeter, gold metallic detailing, and a green checkmark shield at
 * the center, in the spirit of Microsoft/Cisco/AWS-style cert seals.
 */
function VerificationSeal() {
  const uid = useId();
  const dots = Array.from({ length: 18 });
  return (
    <div className="flex w-28 flex-col items-center gap-2">
      <svg viewBox="0 0 120 120" className="h-[92px] w-[92px]">
        <defs>
          <linearGradient id={`seal-ring-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3DE8A" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <radialGradient id={`seal-glow-${uid}`} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#00C48C" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#00C48C" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="60" cy="60" r="56" fill={`url(#seal-glow-${uid})`} />

        {dots.map((_, i) => {
          const angle = (2 * Math.PI * i) / dots.length;
          const x = 60 + 52 * Math.cos(angle);
          const y = 60 + 52 * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="1.3" fill="#D4AF37" opacity="0.75" />;
        })}

        <circle cx="60" cy="60" r="46" fill="#111315" stroke={`url(#seal-ring-${uid})`} strokeWidth="2.5" />
        <circle cx="60" cy="60" r="37" fill="none" stroke="#00A676" strokeWidth="1.2" strokeOpacity="0.6" />
        <circle cx="60" cy="60" r="30" fill="none" stroke="#D4AF37" strokeWidth="0.75" strokeOpacity="0.4" strokeDasharray="2 3" />

        <path d="M60 38 L78 45 L78 63 Q78 82 60 92 Q42 82 42 63 L42 45 Z" fill="#0B0B0C" stroke="#00C48C" strokeWidth="2" />
        <path d="M51 62 L57 69 L70 53" fill="none" stroke="#00C48C" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[9px] uppercase tracking-widest text-emerald">Verified &amp;</span>
        <span className="font-heading text-xs font-bold text-emerald">Secured</span>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="flex min-h-[68px] items-center gap-3 rounded-md border border-border bg-card/60 px-4 py-3.5">
      <Icon className={accent ? 'h-4 w-4 shrink-0 text-emerald' : 'h-4 w-4 shrink-0 text-text-muted'} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
        <p
          className={`whitespace-normal break-words text-sm font-heading font-semibold leading-snug ${
            accent ? 'text-emerald' : 'text-text-primary'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * Fully dynamic certificate — every value below comes from the
 * `credential` / `ownerName` / `qrDataUrl` / `verifyUrl` props. Nothing
 * is hardcoded except static branding text. This single component is
 * reused, unchanged, on /credential (inside a modal), /verify/:uuid
 * (full page), and as the PDF export source — there is only one
 * certificate design in the entire codebase.
 */
const CertificateTemplate = forwardRef(function CertificateTemplate(
  { credential, ownerName, qrDataUrl, verifyUrl },
  ref
) {
  const tier = BADGE_THEMES[credential.badge_level] || BADGE_THEMES.bronze;
  const assessmentTitle = getAssessmentTitle(credential.topics_mastered);
  const earnedDate = new Date(credential.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const shortId = credential.id?.slice(0, 8).toUpperCase();

  return (
    <div ref={ref} className="relative mx-auto w-full bg-obsidian text-text-primary" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Decorative dot-grid — under 8% opacity per DESIGN_SYSTEM.md's
          "Background Graphics" rule. Absolutely positioned, so it never
          needs overflow-hidden to stay contained within the border. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #00A676 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.06,
        }}
      />
      <div className="pointer-events-none absolute inset-3 rounded-lg border-2" style={{ borderColor: '#D4AF37' }} />
      <div className="pointer-events-none absolute inset-5 rounded-md border" style={{ borderColor: 'rgba(212,175,55,0.35)' }} />

      <div className="relative flex flex-col gap-7 px-14 py-10">
        {/* Header — bigger, centered logo as the visual focal point */}
        <div className="flex items-start justify-between">
          <AchievementBadge theme={tier} />

          <div className="flex flex-col items-center gap-3 pt-1">
            <Logo variant="icon" size={60} animated={false} />
            <span className="font-heading font-bold text-xl">
              Neuro<span className="text-emerald">Code</span>
            </span>
          </div>

          <VerificationSeal />
        </div>

        {/* Title block */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1
            className="font-heading font-bold uppercase tracking-[0.2em]"
            style={{ fontSize: '2rem', color: '#D4AF37' }}
          >
            NeuroCode Credential
          </h1>
          <div className="h-px w-40" style={{ backgroundColor: '#D4AF37' }} />
          <p className="text-xs uppercase tracking-widest text-text-muted">Awarded to</p>
          <h2 className="font-heading font-bold" style={{ fontSize: '2.75rem', color: '#F3DE8A' }}>
            {ownerName}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
            Successfully completed the <strong className="text-text-primary">{assessmentTitle}</strong> Assessment
            with verified technical excellence, integrity, and problem-solving proficiency.
          </p>
        </div>

        {/* Stats row — taller cards, no truncation, icons swapped away
            from the generic set */}
        <div className="grid grid-cols-4 gap-3.5">
          <StatBox icon={Layers} label="Topics Mastered" value={credential.topics_mastered.join(', ')} />
          <StatBox icon={Gauge} label="Assessment Score" value={`${credential.assessment_score}%`} accent />
          <StatBox icon={ShieldCheck} label="Integrity Score" value={`${credential.integrity_score}%`} accent />
          <StatBox icon={CalendarDays} label="Date Earned" value={earnedDate} />
        </div>

        {/* Footer — QR centered with URL beneath it, engine left, ID right */}
        <div className="grid grid-cols-3 items-center gap-4 border-t pt-5" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
          <div className="flex flex-col gap-0.5 text-left">
            <span className="font-heading text-xs italic text-text-secondary">NeuroCode Assessment Engine</span>
            <span className="text-[10px] uppercase tracking-wide text-text-disabled">AI Verification System</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Verification QR code"
                className="h-[72px] w-[72px] rounded-md border-2 bg-white p-1"
                style={{ borderColor: '#D4AF37' }}
              />
            )}
            <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald">
              <ShieldCheck className="h-3 w-3" /> Verify this credential
            </p>
            <p className="max-w-[240px] break-all text-center font-mono text-[9px] text-text-muted">{verifyUrl}</p>
          </div>

          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-[10px] uppercase tracking-wide text-text-disabled">Credential ID</span>
            <span className="font-mono text-xs text-text-secondary">{shortId}</span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-text-disabled">Digitally Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;