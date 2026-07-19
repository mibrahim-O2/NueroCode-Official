import { Award } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function Credential() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Credentials</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Verifiable proof of what you've mastered</p>
      </div>
      <EmptyState
        icon={Award}
        title="Credentials coming soon"
        description="Earned, QR-verifiable skill credentials will appear here."
      />
    </div>
  );
}