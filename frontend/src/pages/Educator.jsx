import { GraduationCap } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function Educator() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Educator Portal</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Monitor and support your students</p>
      </div>
      <EmptyState
        icon={GraduationCap}
        title="Educator tools coming soon"
        description="Class rosters, progress tracking, and assessment review will appear here."
      />
    </div>
  );
}