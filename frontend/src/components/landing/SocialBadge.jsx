import { Github, Linkedin, Mail, Twitter, Facebook } from 'lucide-react';

const ICONS = { github: Github, linkedin: Linkedin, email: Mail, x: Twitter, facebook: Facebook };

export default function SocialBadge({ platform, href }) {
  const Icon = ICONS[platform];
  if (!Icon) return null;

  return (
    
    <a
      href={href}
      target={platform === 'email' ? undefined : '_blank'}
      rel="noopener noreferrer"
      aria-label={platform}
      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-200"
      style={{ borderColor: 'var(--l-border)', color: 'var(--l-text-muted)' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--l-gold)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--l-text-muted)'; }}
    >
      <Icon className="h-3.5 w-3.5" />
    </a>
  );
}