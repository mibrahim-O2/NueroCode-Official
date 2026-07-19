import { ShieldCheck } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function Admin() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Administration</h1>
        <p className="mt-1 font-body text-sm text-text-muted">System-wide oversight and configuration</p>
      </div>
      <EmptyState
        icon={ShieldCheck}
        title="Admin tools coming soon"
        description="User management, analytics, and system settings will appear here."
      />
    </div>
  );
}