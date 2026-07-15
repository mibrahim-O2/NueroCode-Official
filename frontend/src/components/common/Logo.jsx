import { cn } from '@/lib/utils';

function BrainMark({ className, style }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect x="6" y="6" width="36" height="36" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <path d="M24 8v32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />

      <path d="M13 18h6v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="18" r="1.6" fill="currentColor" />

      <path d="M35 18h-6v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="35" cy="18" r="1.6" fill="currentColor" />

      <path d="M13 30h6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="30" r="1.6" fill="currentColor" />

      <path d="M35 30h-6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="35" cy="30" r="1.6" fill="currentColor" />

      <path
        d="M18 24l-3 -3 3 -3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 18l3 3 -3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ variant = 'full', size = 32, className }) {
  if (variant === 'icon') {
    return (
      <BrainMark
        className={cn('text-emerald', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <BrainMark className="text-emerald shrink-0" style={{ width: size, height: size }} />
      <span
        className="font-heading font-bold text-text-primary leading-none"
        style={{ fontSize: size * 0.6 }}
      >
        Neuro<span className="text-emerald">Code</span>
      </span>
    </div>
  );
}