import { Award, ShieldCheck, Calendar, ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const BADGE_STYLES = {
  bronze: 'text-[#B08D57] border-[#B08D57]/40 bg-[#B08D57]/10',
  silver: 'text-[#C0C0C0] border-[#C0C0C0]/40 bg-[#C0C0C0]/10',
  gold: 'text-gold border-gold/40 bg-gold/10',
  platinum: 'text-mint border-mint/40 bg-mint/10',
};

export default function CredentialCard({
  credential,
  ownerName,
  qrDataUrl,
  verifyUrl,
  showActions = false,
  onExportPdf,
}) {
  const badgeStyle = BADGE_STYLES[credential.badge_level] || BADGE_STYLES.bronze;

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-full border', badgeStyle)}>
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className={cn('text-xs font-body uppercase tracking-wide', badgeStyle.split(' ')[0])}>
              {credential.badge_level} Credential
            </p>
            <h3 className="font-heading font-semibold text-text-primary">{ownerName}</h3>
          </div>
        </div>
        {qrDataUrl && (
          <img src={qrDataUrl} alt="Verification QR code" className="h-16 w-16 rounded-input border border-border bg-white p-1" />
        )}
      </div>

      <div>
        <p className="text-xs text-text-muted">Topics Mastered</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {credential.topics_mastered.map((t) => (
            <span key={t} className="rounded-badge border border-emerald/30 bg-emerald/10 px-2.5 py-1 text-xs text-emerald">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-text-muted">Assessment Score</p>
          <p className="font-heading font-bold text-lg text-text-primary">{credential.assessment_score}%</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs text-text-muted">
            <ShieldCheck className="h-3 w-3" /> Integrity Score
          </p>
          <p className="font-heading font-bold text-lg text-text-primary">{credential.integrity_score}%</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Calendar className="h-3.5 w-3.5" />
        Earned {new Date(credential.created_at).toLocaleDateString()}
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-xs text-text-secondary transition-colors duration-200 hover:border-emerald hover:text-emerald"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Verification Link
          </a>
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 rounded-button bg-emerald px-3 py-2 text-xs text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover"
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </button>
        </div>
      )}
    </div>
  );
}