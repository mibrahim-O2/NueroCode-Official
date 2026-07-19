import { Map } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function Roadmap() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Roadmap</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Your adaptive learning path</p>
      </div>
      <EmptyState
        icon={Map}
        title="Roadmap coming soon"
        description="Your personalized, AI-generated learning path will appear here."
      />
    </div>
  );
}