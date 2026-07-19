import { cn } from '@/lib/utils';

export default function EmptyState({ icon: Icon, title, description, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-card px-8 py-16 text-center shadow-card',
        className
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10">
          <Icon className="h-6 w-6 text-emerald" />
        </div>
      )}
      <h2 className="font-heading font-semibold text-lg text-text-primary">{title}</h2>
      {description && <p className="max-w-sm font-body text-sm text-text-muted">{description}</p>}
    </div>
  );
}