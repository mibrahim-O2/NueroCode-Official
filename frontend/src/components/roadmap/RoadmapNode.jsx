import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, Sparkles, Swords, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DIFFICULTY_LABEL = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function RoadmapNode({
  node,
  isLast,
  isSelected,
  onSelect,
  onTakeChallenge,
  onPractice,
  justUnlocked,
  recommended = false,
}) {
  const isCompleted = node?.status === 'completed';
  const isLocked = node?.status === 'locked';
  const isActive = node?.status === 'unlocked' || node?.status === 'in_progress';

  return (
    <div className="flex gap-4">
      {/* Node Status Indicator Pin */}
      <div className="flex flex-col items-center">
        <motion.button
          type="button"
          onClick={() => !isLocked && onSelect?.(node)}
          disabled={isLocked}
          initial={justUnlocked ? { scale: 0.5, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={!isLocked ? { scale: 1.06 } : {}}
          whileTap={!isLocked ? { scale: 0.94 } : {}}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200',
            isCompleted && 'border-status-success bg-status-success text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]',
            isActive && 'border-orange bg-orange/10 text-orange animate-pulse',
            isLocked && 'cursor-not-allowed border-border bg-elevated text-text-disabled'
          )}
        >
          {isCompleted && <CheckCircle2 className="h-5 w-5" />}
          {isActive && <Play className="h-4 w-4 fill-current" />}
          {isLocked && <Lock className="h-4 w-4" />}
        </motion.button>

        {!isLast && (
          <div
            className={cn(
              'mt-1 w-0.5 flex-1 transition-colors duration-300',
              isCompleted ? 'bg-status-success' : 'bg-border'
            )}
            style={{ minHeight: 36 }}
          />
        )}
      </div>

      {/* Main Node Card Body */}
      <div
        className={cn(
          'mb-4 flex-1 rounded-card border p-4 text-left transition-all duration-200 flex flex-col justify-between gap-3',
          isSelected ? 'border-orange bg-card shadow-card' : 'border-border bg-card',
          isLocked ? 'cursor-not-allowed opacity-60' : 'hover:border-orange/50 hover:-translate-y-0.5'
        )}
      >
        <div
          onClick={() => !isLocked && onSelect?.(node)}
          className={cn(!isLocked && 'cursor-pointer')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'font-heading font-semibold text-sm',
                  isLocked ? 'text-text-disabled' : 'text-text-primary'
                )}
              >
                {node?.topic}
              </h3>
              {recommended && (
                <span className="flex items-center gap-1 rounded-badge border border-teal/40 bg-teal/10 px-2 py-0.5 text-[10px] uppercase text-teal">
                  <Sparkles className="h-2.5 w-2.5" /> Recommended
                </span>
              )}
            </div>
            <span className="rounded-badge border border-border px-2 py-0.5 text-[10px] uppercase text-text-muted">
              {DIFFICULTY_LABEL[node?.difficulty] || node?.difficulty || 'Beginner'}
            </span>
          </div>

          <p className="mt-1 text-xs text-text-muted">
            {isCompleted && `Completed — +${node?.xp_earned || 50} XP`}
            {isActive && `Ready for checkpoint challenge — +${node?.xp_reward || 150} XP`}
            {isLocked && 'Complete the previous topic challenge to unlock'}
          </p>
        </div>

        {/* Action Buttons Row */}
        {!isLocked && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              {/* Practice Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPractice) {
                    onPractice(node);
                  } else {
                    onSelect?.(node);
                  }
                }}
                className="flex items-center gap-1.5 rounded-button border border-border bg-charcoal px-3 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-orange/40 hover:text-text-primary active:scale-95"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Practice</span>
              </button>

              {/* Challenge Gate Button */}
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTakeChallenge) {
                      onTakeChallenge(node);
                    } else {
                      onSelect?.(node);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-button bg-orange px-3.5 py-1.5 text-xs font-semibold text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95"
                >
                  <Swords className="h-3.5 w-3.5" />
                  <span>Take Challenge Gate</span>
                </button>
              )}
            </div>

            {isCompleted && (
              <span className="text-[11px] font-mono text-status-success flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Node Passed
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
