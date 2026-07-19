import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const DIFFICULTY_LABEL = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function RoadmapNode({ node, isLast, isSelected, onSelect, justUnlocked }) {
  const isCompleted = node.status === 'completed';
  const isActive = node.status === 'unlocked' || node.status === 'in_progress';
  const isLocked = node.status === 'locked';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <motion.button
          type="button"
          onClick={() => !isLocked && onSelect(node)}
          disabled={isLocked}
          initial={justUnlocked ? { scale: 0.5, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200',
            isCompleted && 'border-emerald bg-emerald text-white',
            isActive && 'border-emerald bg-card text-emerald animate-pulse-emerald',
            isLocked && 'cursor-not-allowed border-border bg-elevated text-text-disabled'
          )}
        >
          {isCompleted && <CheckCircle2 className="h-5 w-5" />}
          {isActive && <Play className="h-4 w-4 fill-current" />}
          {isLocked && <Lock className="h-4 w-4" />}
        </motion.button>
        {!isLast && (
          <div
            className={cn('mt-1 w-0.5 flex-1', isCompleted ? 'bg-emerald' : 'bg-border')}
            style={{ minHeight: 32 }}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => !isLocked && onSelect(node)}
        disabled={isLocked}
        className={cn(
          'mb-4 flex-1 rounded-card border p-4 text-left transition-all duration-200',
          isSelected ? 'border-emerald bg-card shadow-card' : 'border-border bg-card',
          isLocked ? 'cursor-not-allowed opacity-60' : 'hover:border-emerald/50'
        )}
      >
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              'font-heading font-semibold text-sm',
              isLocked ? 'text-text-disabled' : 'text-text-primary'
            )}
          >
            {node.topic}
          </h3>
          <span className="rounded-badge border border-border px-2 py-0.5 text-[10px] uppercase text-text-muted">
            {DIFFICULTY_LABEL[node.difficulty]}
          </span>
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {isCompleted && `Completed — +${node.xp_earned} XP`}
          {isActive && 'Ready to start'}
          {isLocked && 'Complete the previous topic to unlock'}
        </p>
      </button>
    </div>
  );
}