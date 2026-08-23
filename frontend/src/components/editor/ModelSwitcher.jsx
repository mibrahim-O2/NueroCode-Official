import { useState, useRef, useEffect } from 'react';
import { ChevronUp, Sparkles, Cpu, Bot, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminPasscodeModal from './AdminPasscodeModal';
import SubscriptionPaywall from '@/components/paywall/SubscriptionPaywall';

const PROVIDER_META = {
  gemini: { label: 'Gemini', icon: Sparkles },
  openai: { label: 'GPT', icon: Cpu },
  claude: { label: 'Claude (Sonnet 5)', icon: Bot },
};

const PROVIDER_ORDER = ['gemini', 'openai', 'claude'];

export default function ModelSwitcher({ activeProvider, onProviderChange, onGenerate, loading, disabled, hasProblem }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [paywallProvider, setPaywallProvider] = useState(null);
  const [openAiUnlocked, setOpenAiUnlocked] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const active = PROVIDER_META[activeProvider] || PROVIDER_META.gemini;
  const ActiveIcon = active.icon;

  const handleSelect = (providerKey) => {
    setOpen(false);

    if (providerKey === 'gemini') {
      onProviderChange('gemini');
      return;
    }

    if (providerKey === 'openai') {
      if (openAiUnlocked) {
        onProviderChange('openai');
        return;
      }
      if (user?.role === 'admin') {
        setShowPasscode(true);
      } else {
        setPaywallProvider('openai');
      }
      return;
    }

    // Claude: no working backend integration yet regardless of role —
    // always the paywall preview for now.
    setPaywallProvider('claude');
  };

  const handlePasscodeSuccess = () => {
    setOpenAiUnlocked(true);
    setShowPasscode(false);
    onProviderChange('openai');
  };

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <div className="flex overflow-hidden rounded-button border border-border">
        <button
          onClick={onGenerate}
          disabled={disabled || loading}
          className="flex items-center gap-2 bg-emerald px-4 py-2.5 text-sm font-body text-white transition-colors duration-200 hover:bg-emerald-hover disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ActiveIcon className="h-4 w-4" />}
          {hasProblem ? 'Generate Another' : 'Generate Problem'}
          <span className="text-white/80">({active.label})</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          aria-label="Choose AI model"
          className="flex items-center justify-center border-l border-emerald-active bg-emerald px-2.5 text-white transition-colors duration-200 hover:bg-emerald-hover disabled:opacity-50"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-card border border-border bg-card p-1.5 shadow-dropdown animate-fade-in">
          {PROVIDER_ORDER.filter((key) => key !== activeProvider).map((key) => {
            const meta = PROVIDER_META[key];
            const Icon = meta.icon;
            const locked = key === 'claude' || (key === 'openai' && !openAiUnlocked);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                className="flex w-full items-center gap-2.5 rounded-input px-3 py-2.5 text-left text-sm text-text-secondary transition-colors duration-200 hover:bg-elevated hover:text-text-primary"
              >
                <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                <span className="flex-1">{meta.label}</span>
                {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-text-disabled" />}
              </button>
            );
          })}
        </div>
      )}

      {showPasscode && <AdminPasscodeModal onClose={() => setShowPasscode(false)} onSuccess={handlePasscodeSuccess} />}

      {paywallProvider && (
        <SubscriptionPaywall provider={paywallProvider} onClose={() => setPaywallProvider(null)} />
      )}
    </div>
  );
}