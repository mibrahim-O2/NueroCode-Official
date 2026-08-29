import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IntegrityScoreBadge({ score }) {
  const tier = score >= 90 ? 'good' : score >= 70 ? 'warning' : 'bad';
  const Icon = tier === 'good' ? ShieldCheck : tier === 'warning' ? ShieldAlert : ShieldX;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-input border px-4 py-2 transition-colors duration-300',
        tier === 'good' && 'border-status-success/40 bg-status-success/10 text-status-success',
        tier === 'warning' && 'border-status-warning/40 bg-status-warning/10 text-status-warning',
        tier === 'bad' && 'border-status-error/40 bg-status-error/10 text-status-error'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="font-heading font-bold">{score}</span>
      <span className="text-xs opacity-80">Integrity Score</span>
    </div>
  );
}