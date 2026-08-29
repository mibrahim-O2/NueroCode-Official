import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, ChevronDown, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-charcoal px-5 py-3 md:px-8">
      <button onClick={onMenuClick} className="text-text-muted hover:text-text-primary md:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-input border border-border text-text-muted transition-all duration-200 hover:border-orange hover:text-orange active:scale-95"
        
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-input border border-border px-2 py-1.5 transition-colors duration-200 hover:border-orange"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-elevated text-xs font-heading text-orange">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="hidden text-left sm:block">
              <p className="font-body text-xs leading-none text-text-primary">{user?.name}</p>
              <p className="mt-0.5 text-[11px] leading-none text-text-muted">{user?.email}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          </button>

          {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-card border border-border bg-card p-1.5 shadow-dropdown animate-slide-fade-in">
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-input px-3 py-2 text-sm text-text-secondary transition-colors duration-200 hover:bg-elevated hover:text-text-primary"
              >
                <UserIcon className="h-4 w-4" /> Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-input px-3 py-2 text-sm text-text-secondary transition-colors duration-200 hover:bg-elevated hover:text-text-primary"
              >
                <SettingsIcon className="h-4 w-4" /> Settings
              </Link>
              <div className="my-1 h-px bg-divider" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-sm text-status-error transition-colors duration-200 hover:bg-status-error/10"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}