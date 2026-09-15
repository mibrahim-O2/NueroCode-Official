import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FlaskConical, Loader2 } from 'lucide-react';
import { getDemoVerificationNotice } from '@/services/demoService';

// Shown if the backend can't be reached, so this page can never display
// anything other than the demo notice.
const FALLBACK_NOTICE = {
  title: 'This is a demo credential',
  message:
    'This credential was issued from NeuroCode Demo Mode for evaluation purposes and does not certify real ' +
    'achievement. Join NeuroCode with a real account to earn a genuine, verifiable credential.',
};

// Public landing page for every demo credential's QR code and link. It is a
// separate route from the real /verify/:uuid page on purpose: it only ever
// renders the backend's fixed "this is a demo credential" notice and never
// looks up or shows credential data, so a demo credential can't pass as real.
export default function DemoVerifyCredential() {
  const { uuid } = useParams();
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    getDemoVerificationNotice(uuid)
      .then(setNotice)
      .catch(() => setNotice(FALLBACK_NOTICE));
  }, [uuid]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12">
      {!notice && <Loader2 className="h-6 w-6 animate-spin text-text-muted" />}

      {notice && (
        <div className="animate-slide-fade-in flex w-full max-w-lg flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center gap-2 rounded-input border border-status-warning/40 bg-status-warning/10 px-4 py-2 text-sm text-status-warning">
            <FlaskConical className="h-4 w-4" /> Demo credential — not independently verified
          </div>
          <h1 className="font-heading font-semibold text-xl text-text-primary">{notice.title}</h1>
          <p className="text-sm text-text-muted">{notice.message}</p>
          <Link
            to="/login"
            className="rounded-button bg-orange px-5 py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95"
          >
            Join NeuroCode
          </Link>
        </div>
      )}
    </main>
  );
}
