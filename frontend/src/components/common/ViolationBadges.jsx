import { cn } from '@/lib/utils';

export default function ViolationBadges({ violations, className }) {
  if (!violations || violations.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {violations.map((v) => (
        <span
          key={v.event_type}
          className="rounded-badge border border-status-error/30 bg-status-error/10 px-2 py-0.5 text-[10px] text-status-error"
        >
          {v.label} ({v.count})
        </span>
      ))}
    </div>
  );
}