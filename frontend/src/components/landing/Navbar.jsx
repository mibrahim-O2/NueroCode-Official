import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const NAV_LINKS = [
  { label: 'Platform', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Integrity', href: '#integrity' },
  { label: 'Team', href: '#team' },
];

const DOCS_URL = 'https://github.com/mibrahim-O2/NueroCode-Official/blob/main/docs/DOCUMENTATION.md';

export default function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (href) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    // Always solid, matching the page's own background exactly — no
    // transparent-until-scroll state, no border. This is what makes it
    // read as a genuinely fixed, integrated bar rather than a floating
    // overlay, matching the reference navbar's always-solid appearance.
    <header className="fixed inset-x-0 top-0 z-50" style={{ backgroundColor: 'var(--l-bg)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo variant="icon" size={38} animated={false} />
          <span className="font-heading text-lg font-semibold" style={{ color: 'var(--l-text-primary)' }}>
            Neuro<span style={{ color: 'var(--l-orange)' }}>Code</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              style={{ color: 'var(--l-text-secondary)' }}
              className="transition-opacity hover:opacity-80"
            >
              {link.label}
            </button>
          ))}
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--l-text-secondary)' }}
            className="transition-opacity hover:opacity-80"
          >
            Documentation
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="hidden h-9 w-9 items-center justify-center rounded-full border sm:flex"
            style={{ borderColor: 'var(--l-border)', color: 'var(--l-text-secondary)' }}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            to={user ? '/dashboard' : '/login'}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: 'var(--l-orange)', color: '#1A0900' }}
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </Link>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-2 lg:hidden"
            style={{ color: 'var(--l-text-secondary)' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="flex flex-col gap-3 border-t px-6 py-4 lg:hidden"
          style={{ borderColor: 'var(--l-border)', backgroundColor: 'var(--l-surface)' }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="py-1 text-left text-sm"
              style={{ color: 'var(--l-text-secondary)' }}
            >
              {link.label}
            </button>
          ))}
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="py-1 text-sm" style={{ color: 'var(--l-text-secondary)' }}>
            Documentation ↗
          </a>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs"
            style={{ borderColor: 'var(--l-border)', color: 'var(--l-text-secondary)' }}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Toggle theme
          </button>
        </div>
      )}
    </header>
  );
}