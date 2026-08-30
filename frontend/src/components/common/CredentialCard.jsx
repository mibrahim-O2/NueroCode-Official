import { Award, Calendar, Eye } from 'lucide-react';
import { getAssessmentTitle } from '@/utils/certificateShare';
import { cn } from '@/lib/utils';

// Bug fix: platinum previously used 'text-mint' — the same teal/mint
// token used everywhere else in the product for AI-metadata and
// technical readouts, not an achievement tier color at all. Platinum is
// documented as the HIGHEST badge tier (above gold), so it should read
// as more premium than gold, not as an unrelated informational hue. Now
// uses a genuine cool platinum/silver-white tone — distinct from both
// teal and gold, but still clearly in the same "precious metal" family
// as bronze/silver/gold.
const BADGE_STYLES = {
  bronze: 'text-[#B08D57] border-[#B08D57]/40 bg-[#B08D57]/10',
  silver: 'text-[#C0C0C0] border-[#C0C0C0]/40 bg-[#C0C0C0]/10',
  gold: 'text-gold border-gold/40 bg-gold/10',
  platinum: 'text-[#E5E4E2] border-[#E5E4E2]/40 bg-[#E5E4E2]/10',
};

export default function CredentialCard({ credential, onView }) {
  const badgeStyle = BADGE_STYLES[credential.badge_level] || BADGE_STYLES.bronze;
  const title = getAssessmentTitle(credential.topics_mastered);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dialog">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border', badgeStyle)}>
          <Award className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={cn('text-[10px] font-body uppercase tracking-wide', badgeStyle.split(' ')[0])}>
            {credential.badge_level} Credential
          </p>
          <h3 className="truncate font-heading font-semibold text-text-primary">{title}</h3>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          Score: <span className="text-orange">{credential.assessment_score}%</span>
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {new Date(credential.created_at).toLocaleDateString()}
        </span>
      </div>

      <button
        onClick={onView}
        className="flex items-center justify-center gap-1.5 rounded-button border border-border py-2 text-xs text-text-secondary transition-all duration-200 hover:border-orange hover:text-orange active:scale-95"
      >
        <Eye className="h-3.5 w-3.5" /> View Certificate
      </button>
    </div>
  );
}