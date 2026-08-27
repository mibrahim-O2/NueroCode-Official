import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, Code2, ClipboardCheck, Award,
  GraduationCap, ShieldCheck, User, Settings, X, Timer, FileText,
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['student', 'educator', 'admin'] },
  { label: 'Roadmap', path: '/roadmap', icon: Map, roles: ['student', 'educator', 'admin'] },
  { label: 'Practice', path: '/practice', icon: Code2, roles: ['student', 'educator', 'admin'] },
  { label: 'Mock Interview', path: '/interview', icon: Timer, roles: ['student', 'educator', 'admin'] },
  { label: 'My Submissions', path: '/submissions', icon: FileText, roles: ['student', 'educator', 'admin'] },
  { label: 'Assessment', path: '/assessment', icon: ClipboardCheck, roles: ['student', 'educator', 'admin'] },
  { label: 'Credentials', path: '/credential', icon: Award, roles: ['student', 'educator', 'admin'] },
  { label: 'Educator Portal', path: '/educator', icon: GraduationCap, roles: ['educator', 'admin'] },
  { label: 'Administration', path: '/admin', icon: ShieldCheck, roles: ['admin'] },
];

const BOTTOM_ITEMS = [
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function navLinkClass({ isActive }) {
  return cn(
    'flex items-center gap-3 rounded-input border px-3 py-2.5 text-sm font-body transition-colors duration-200',
    isActive
      ? 'border-emerald/30 bg-emerald/10 text-emerald'
      : 'border-transparent text-text-secondary hover:bg-elevated hover:text-text-primary'
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-charcoal',
          'transition-transform duration-200 md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo variant="icon" size={36} animated={false} />
          <button onClick={onClose} className="text-text-muted hover:text-text-primary md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {visibleItems.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} onClick={onClose} className={navLinkClass}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-border px-3 py-4">
          {BOTTOM_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} onClick={onClose} className={navLinkClass}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
}