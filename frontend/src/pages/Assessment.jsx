import { ClipboardCheck } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function Assessment() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Assessment</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Proctored evaluations of your mastery</p>
      </div>
      <EmptyState
        icon={ClipboardCheck}
        title="Assessments coming soon"
        description="Proctored, timed assessments with integrity monitoring will appear here."
      />
    </div>
  );
}