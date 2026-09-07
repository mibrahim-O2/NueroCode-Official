import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Code2,
  Swords,
  ClipboardCheck,
  Award,
  GraduationCap,
  ShieldCheck,
  User,
  Settings,
  X,
  Timer,
  FileText,
  PanelLeftClose,
  ChevronRight,
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['student', 'educator', 'admin'] },
  { label: 'Roadmap', path: '/roadmap', icon: Map, roles: ['student', 'educator', 'admin'] },
  { label: 'Practice', path: '/practice', icon: Code2, roles: ['student', 'educator', 'admin'] },
  { label: 'Challenge Gate', path: '/challenge', icon: Swords, roles: ['student', 'educator', 'admin'] },
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

export default function Sidebar({
  open = false,
  onClose = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
}) {
  const { user } = useAuth();
  const userRole = user?.role || 'student';
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const getNavLinkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-input border py-2.5 text-sm font-body transition-all duration-200',
      collapsed ? 'justify-center px-0' : 'px-3',
      isActive
        ? 'border-orange/30 bg-orange/10 text-orange'
        : 'border-transparent text-text-secondary hover:bg-elevated hover:text-text-primary active:scale-[0.98]'
    );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-border bg-charcoal transition-all duration-300 ease-in-out md:static',
          collapsed ? 'w-16 md:w-16' : 'w-64 md:w-64',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header with Logo & Toggle Button */}
        <div
          className={cn(
            'flex h-20 items-center transition-all duration-200',
            collapsed ? 'justify-center px-2' : 'justify-between px-5'
          )}
        >
          {!collapsed ? (
            <>
              <Logo variant="icon" size={56} animated={false} />
              <div className="flex items-center gap-1">
                {/* Desktop Collapse Button */}
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Collapse sidebar"
                  className="hidden rounded-input p-1.5 text-text-muted transition-colors hover:bg-elevated hover:text-orange active:scale-95 md:flex"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-text-muted hover:text-text-primary md:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            /* Desktop Expand Arrow Button */
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-input border border-border text-text-muted transition-all duration-200 hover:border-orange hover:bg-elevated hover:text-orange active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2.5">
          {visibleItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={getNavLinkClass}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Profile & Settings */}
        <div className="flex flex-col gap-1 border-t border-border p-2.5">
          {BOTTOM_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={getNavLinkClass}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
}
