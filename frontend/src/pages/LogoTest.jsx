import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Logo from '@/components/common/Logo';
import LoadingScreen from '@/components/common/LoadingScreen';

const COLOR_GROUPS = [
  {
    title: 'Background',
    swatches: [
      ['Obsidian', '#0B0B0C'],
      ['Charcoal', '#17181C'],
      ['Elevated', '#21242B'],
      ['Card', '#1C1F24'],
      ['Border', '#2A2D34'],
      ['Divider', '#343843'],
    ],
  },
  {
    title: 'Primary',
    swatches: [
      ['Emerald', '#00A676'],
      ['Emerald Hover', '#00B67F'],
      ['Emerald Active', '#008F65'],
      ['Mint', '#00C48C'],
      ['Mint Hover', '#00D99B'],
    ],
  },
  {
    title: 'Accent (Gold — achievements only)',
    swatches: [
      ['Gold', '#D4AF37'],
      ['Gold Hover', '#E6C65C'],
      ['Gold Soft', '#F3DE8A'],
    ],
  },
  {
    title: 'Text',
    swatches: [
      ['Primary', '#F8FAFC'],
      ['Secondary', '#CBD5E1'],
      ['Muted', '#94A3B8'],
      ['Disabled', '#4B5563'],
    ],
  },
  {
    title: 'Status',
    swatches: [
      ['Success', '#22C55E'],
      ['Warning', '#F59E0B'],
      ['Error', '#EF4444'],
      ['Info', '#00A676'],
    ],
  },
];

function Swatch({ name, hex }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-card border border-border shadow-card"
        style={{ backgroundColor: hex }}
      />
      <div className="text-xs font-body text-text-secondary">{name}</div>
      <div className="text-xs font-mono text-text-muted">{hex}</div>
    </div>
  );
}

export default function LogoTest() {
  const [showLoading, setShowLoading] = useState(false);

  const triggerLoading = () => {
    setShowLoading(true);
    setTimeout(() => setShowLoading(false), 1600);
  };

  return (
    <div className="min-h-screen px-6 py-12 md:px-12 animate-fade-in">
      {showLoading && <LoadingScreen />}

      <div className="mx-auto max-w-5xl flex flex-col gap-14">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-muted hover:text-emerald text-sm transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <button
            onClick={triggerLoading}
            className="flex items-center gap-2 rounded-button border border-border bg-charcoal px-4 py-2 text-sm text-text-secondary hover:border-emerald hover:text-emerald transition-colors duration-200 shadow-button"
          >
            <RotateCcw className="h-4 w-4" /> Replay Loading Animation
          </button>
        </div>

        {/* Logo lockups */}
        <section className="flex flex-col gap-6">
          <h2 className="font-heading font-semibold text-xl text-text-primary">Logo</h2>
          <div className="flex flex-wrap items-center gap-10 rounded-card border border-border bg-card p-8 shadow-card">
            <Logo size={64} />
            <Logo size={32} />
            <Logo variant="icon" size={40} />
            <Logo variant="icon" size={24} />
          </div>
        </section>

        {/* Colors */}
        <section className="flex flex-col gap-6">
          <h2 className="font-heading font-semibold text-xl text-text-primary">Color Palette</h2>
          {COLOR_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="font-body text-sm text-text-muted">{group.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {group.swatches.map(([name, hex]) => (
                  <Swatch key={name} name={name} hex={hex} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Typography */}
        <section className="flex flex-col gap-4">
          <h2 className="font-heading font-semibold text-xl text-text-primary">Typography</h2>
          <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-8 shadow-card">
            <p className="font-heading font-bold text-3xl text-text-primary">Sora 700 — Heading Bold</p>
            <p className="font-heading font-semibold text-2xl text-text-primary">Sora 600 — Heading Semibold</p>
            <p className="font-body font-normal text-base text-text-secondary">Inter 400 — Body Regular</p>
            <p className="font-body font-medium text-base text-text-secondary">Inter 500 — Body Medium</p>
            <p className="font-body font-semibold text-base text-text-secondary">Inter 600 — Body Semibold</p>
            <p className="font-mono text-sm text-mint">const neuroCode = "Where Intelligence Meets Code";</p>
          </div>
        </section>

        {/* Radius */}
        <section className="flex flex-col gap-4">
          <h2 className="font-heading font-semibold text-xl text-text-primary">Border Radius</h2>
          <div className="flex flex-wrap gap-6">
            <div className="h-20 w-20 rounded-button bg-emerald/20 border border-emerald flex items-center justify-center text-xs text-emerald">Button 12px</div>
            <div className="h-20 w-20 rounded-input bg-emerald/20 border border-emerald flex items-center justify-center text-xs text-emerald">Input 12px</div>
            <div className="h-20 w-20 rounded-card bg-emerald/20 border border-emerald flex items-center justify-center text-xs text-emerald">Card 16px</div>
            <div className="h-20 w-20 rounded-dialog bg-emerald/20 border border-emerald flex items-center justify-center text-xs text-emerald">Dialog 20px</div>
            <div className="h-10 w-24 rounded-badge bg-emerald/20 border border-emerald flex items-center justify-center text-xs text-emerald">Badge</div>
          </div>
        </section>

        {/* Motion */}
        <section className="flex flex-col gap-4 pb-12">
          <h2 className="font-heading font-semibold text-xl text-text-primary">Motion</h2>
          <div className="flex flex-wrap items-center gap-6">
            <button className="rounded-button bg-emerald px-5 py-2.5 text-white text-sm font-body shadow-button hover:-translate-y-0.5 hover:bg-emerald-hover transition-all duration-200">
              Hover Lift Button
            </button>
            <div className="h-20 w-40 rounded-card border border-border bg-card shadow-card flex items-center justify-center text-xs text-text-muted hover:scale-[1.02] hover:border-emerald transition-all duration-200 cursor-pointer">
              Card Hover Scale
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}