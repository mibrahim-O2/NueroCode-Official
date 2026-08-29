import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Reveal from './Reveal';

export default function FinalCTA() {
  const { user } = useAuth();

  return (
    <section className="px-6 py-20">
      <Reveal>
        <div
          className="l-card mx-auto flex max-w-5xl flex-col items-center gap-6 p-10 text-center sm:flex-row sm:justify-between sm:text-left"
          style={{ borderColor: 'var(--l-orange)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--l-surface-alt)', color: 'var(--l-orange)' }}
            >
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold sm:text-2xl" style={{ color: 'var(--l-text-primary)' }}>
                Start your intelligent coding journey today.
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--l-text-secondary)' }}>
                Join a platform built for learning that actually counts.
              </p>
            </div>
          </div>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: 'var(--l-orange)', color: '#1A0900' }}
          >
            {user ? 'Go to Dashboard' : 'Get Started'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}