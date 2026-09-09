import Logo from './Logo';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <Logo variant="icon" size={80} />
      <p className="text-text-muted text-sm font-body tracking-wide animate-pulse-emerald">
        Loading NeuroCode...
      </p>
    </div>
  );
}