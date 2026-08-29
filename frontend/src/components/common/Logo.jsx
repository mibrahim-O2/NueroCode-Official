import logoMark from '@/assets/logo-mark.png';
import { cn } from '@/lib/utils';

function Mark({ size, animated }) {
  return (
    <div className="relative inline-flex" style={{ height: size }}>
      <img
        src={logoMark}
        alt="NeuroCode"
        draggable={false}
        className={cn('h-full w-auto select-none', animated && 'animate-logo-glow')}
      />
      {animated && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-logo-shimmer"
          style={{
            WebkitMaskImage: `url(${logoMark})`,
            maskImage: `url(${logoMark})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      )}
    </div>
  );
}

export default function Logo({ size = 64, variant = 'full', animated = true, className }) {
  if (variant === 'icon') {
    return (
      <div className={className}>
        <Mark size={size} animated={animated} />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Mark size={size} animated={animated} />
      <span className="font-heading font-bold leading-none" style={{ fontSize: size * 0.42 }}>
        <span className="text-text-primary">Neuro</span>
        <span className="text-orange">Code</span>
      </span>
    </div>
  );
}