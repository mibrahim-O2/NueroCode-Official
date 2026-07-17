import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const TextInput = forwardRef(function TextInput({ icon: Icon, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          'flex items-center gap-2 rounded-input border bg-elevated px-3.5 py-2.5',
          error ? 'border-status-error' : 'border-border focus-within:border-emerald',
          'transition-colors duration-200'
        )}
      >
        {Icon && <Icon className="h-4 w-4 text-text-muted shrink-0" />}
        <input
          ref={ref}
          className={cn(
            'w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted font-body outline-none',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-status-error">{error}</span>}
    </div>
  );
});

export default TextInput;