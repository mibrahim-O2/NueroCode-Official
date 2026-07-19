import { Code2 } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function Practice() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Practice</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Sharpen your skills with AI-generated problems</p>
      </div>
      <EmptyState
        icon={Code2}
        title="Practice editor coming soon"
        description="The Monaco-based coding workspace and problem set will appear here."
      />
    </div>
  );
}