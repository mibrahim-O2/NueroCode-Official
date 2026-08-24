import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';

const DOCS_URL = 'https://github.com/mibrahim-O2/NueroCode-Official/blob/main/docs/DOCUMENTATION.md';

export default function Footer() {
  return (
    <footer className="border-t px-6 py-14" style={{ borderColor: 'var(--l-border)' }}>
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Logo variant="icon" size={26} animated={false} />
            <span className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
              NeuroCode
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--l-text-muted)' }}>
            Where Intelligence Meets Code — AI-powered learning, real execution, verified
            assessments, trusted credentials.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--l-text-primary)' }}>Product</p>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--l-text-muted)' }}>
            <li><a href="#features">Platform</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#integrity">Integrity</a></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--l-text-primary)' }}>Project</p>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--l-text-muted)' }}>
            <li><a href="#team">Team</a></li>
            <li><a href={DOCS_URL} target="_blank" rel="noopener noreferrer">Documentation ↗</a></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--l-text-primary)' }}>Account</p>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--l-text-muted)' }}>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/login">Get Started</Link></li>
          </ul>
        </div>
      </div>

      <div
        className="mx-auto mt-12 max-w-7xl border-t pt-6 text-xs"
        style={{ borderColor: 'var(--l-border)', color: 'var(--l-text-muted)' }}
      >
        © 2026 NeuroCode. Final Year Project, Institute of Mathematics and Computer Science, University of Sindh.
      </div>
    </footer>
  );
}