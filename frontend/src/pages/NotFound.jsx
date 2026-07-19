import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Logo from '@/components/common/Logo';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo variant="icon" size={48} animated={false} />
      <div>
        <p className="font-heading font-bold text-6xl text-emerald">404</p>
        <h1 className="mt-2 font-heading font-semibold text-xl text-text-primary">Page not found</h1>
        <p className="mt-1 font-body text-sm text-text-muted">
          The page you're looking for doesn't exist or has moved.
        </p>
      </div>
      <Link
        to="/"
        className="flex items-center gap-2 rounded-button bg-emerald px-4 py-2 text-sm font-body text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover"
      >
        <Home className="h-4 w-4" /> Back to Home
      </Link>
    </main>
  );
}