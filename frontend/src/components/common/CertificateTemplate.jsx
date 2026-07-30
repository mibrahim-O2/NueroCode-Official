import { forwardRef } from 'react';
import { ShieldCheck, Code2, Target, Calendar, BadgeCheck } from 'lucide-react';
import Logo from './Logo';
import { getAssessmentTitle } from '@/utils/certificateShare';

// Bronze and silver aren't part of DESIGN_SYSTEM.md's core palette (only
// Gold/Emerald/Mint are defined) — these two hex values are a deliberate,
// minimal, badge-tier-only addition so all four tiers are visually
// distinct. Gold and Platinum map to already-approved tokens.
const BADGE_TIERS = {
  bronze: { label: 'Bronze', ring: '#B08D57', glow: 'rgba(176,141,87,0.35)' },
  silver: { label: 'Silver', ring: '#C0C0C0', glow: 'rgba(192,192,192,0.3)' },
  gold: { label: 'Gold', ring: '#D4AF37', glow: 'rgba(212,175,55,0.4)' },
  platinum: { label: 'Platinum', ring: '#00C48C', glow: 'rgba(0,196,140,0.4)' },
};

function StatBox({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2.5">
      <Icon className={accent ? 'h-4 w-4 shrink-0 text-emerald' : 'h-4 w-4 shrink-0 text-text-muted'} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
        <p className={`truncate text-sm font-heading font-semibold ${accent ? 'text-emerald' : 'text-text-primary'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * Fully dynamic certificate — every value below comes from the
 * `credential` / `ownerName` / `qrDataUrl` / `verifyUrl` props. Nothing
 * is hardcoded except static branding text ("NeuroCode Credential",
 * "Verified & Secured", etc). This single component is reused, unchanged,
 * on /credential (inside a modal), /verify/:uuid (full page), and as the
 * PDF export source — there is only one certificate design in the entire
 * codebase.
 */
const CertificateTemplate = forwardRef(function CertificateTemplate(
  { credential, ownerName, qrDataUrl, verifyUrl },
  ref
) {
  const tier = BADGE_TIERS[credential.badge_level] || BADGE_TIERS.bronze;
  const assessmentTitle = getAssessmentTitle(credential.topics_mastered);
  const earnedDate = new Date(credential.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const shortId = credential.id?.slice(0, 8).toUpperCase();

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full overflow-hidden bg-obsidian text-text-primary"
      style={{ aspectRatio: '1.4142 / 1', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Decorative dot-grid, kept under 8% opacity per DESIGN_SYSTEM.md's
          "Background Graphics" rule — subtle texture, never distracting. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #00A676 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.06,
        }}
      />

      <div className="absolute inset-3 rounded-lg border-2" style={{ borderColor: '#D4AF37' }} />
      <div className="absolute inset-5 rounded-md border" style={{ borderColor: 'rgba(212,175,55,0.35)' }} />

      <div className="relative flex h-full flex-col justify-between px-12 py-8">
        {/* Header: badge tier (dynamic) — logo — verified seal */}
        <div className="flex items-start justify-between">
          <div
            className="flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-center"
            style={{ borderColor: tier.ring, boxShadow: `0 0 20px ${tier.glow}` }}
          >
            <BadgeCheck className="h-6 w-6" style={{ color: tier.ring }} />
            <span className="text-[10px] uppercase tracking-widest text-text-muted">Badge Level</span>
            <span className="font-heading font-bold text-sm" style={{ color: tier.ring }}>
              {tier.label}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Logo variant="icon" size={44} animated={false} />
            <span className="font-heading font-bold text-lg">
              Neuro<span className="text-emerald">Code</span>
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-full border border-emerald/50 px-4 py-3 text-center">
            <ShieldCheck className="h-6 w-6 text-emerald" />
            <span className="text-[10px] uppercase tracking-widest text-emerald">Verified &amp;</span>
            <span className="text-[10px] uppercase tracking-widest text-emerald">Secured</span>
          </div>
        </div>

        {/* Title block — student name (dynamic), assessment title (derived) */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-heading font-bold uppercase tracking-[0.2em]" style={{ fontSize: '2rem', color: '#D4AF37' }}>
            NeuroCode Credential
          </h1>
          <div className="h-px w-40" style={{ backgroundColor: '#D4AF37' }} />
          <p className="text-xs uppercase tracking-widest text-text-muted">Awarded to</p>
          <h2 className="font-heading font-bold" style={{ fontSize: '2.75rem', color: '#F3DE8A' }}>
            {ownerName}
          </h2>
          <p className="max-w-xl text-sm text-text-secondary">
            For successfully passing the <strong className="text-text-primary">{assessmentTitle}</strong> proctored
            assessment, demonstrating verified skill, integrity, and problem-solving ability.
          </p>
        </div>

        {/* Stats row — all four values dynamic */}
        <div className="grid grid-cols-4 gap-3">
          <StatBox icon={Code2} label="Topics Mastered" value={credential.topics_mastered.join(', ')} />
          <StatBox icon={Target} label="Assessment Score" value={`${credential.assessment_score}%`} accent />
          <StatBox icon={ShieldCheck} label="Integrity Score" value={`${credential.integrity_score}%`} accent />
          <StatBox icon={Calendar} label="Date Earned" value={earnedDate} />
        </div>

        {/* Footer — QR (dynamic), verification URL (dynamic), credential ID (dynamic) */}
        <div className="flex items-end justify-between gap-6 border-t pt-4" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
          <div className="flex items-center gap-4">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Verification QR code"
                className="h-20 w-20 rounded-md border-2 bg-white p-1"
                style={{ borderColor: '#D4AF37' }}
              />
            )}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald">
                <ShieldCheck className="h-3.5 w-3.5" /> Verify this credential
              </p>
              <p className="mt-1 max-w-xs break-all font-mono text-[10px] text-text-muted">{verifyUrl}</p>
              <p className="mt-1 text-[10px] text-text-disabled">
                Scan the QR code or visit the link above to verify authenticity.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-heading text-xs italic text-text-secondary">NeuroCode Assessment Engine</span>
            <div className="h-px w-28" style={{ backgroundColor: 'rgba(212,175,55,0.4)' }} />
            <span className="text-[10px] uppercase tracking-wide text-text-disabled">AI Verification System</span>
          </div>

          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-[10px] uppercase tracking-wide text-text-disabled">Credential ID</span>
            <span className="font-mono text-xs text-text-secondary">{shortId}</span>
            <span className="mt-1 text-[10px] uppercase tracking-wide text-text-disabled">Digitally Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;