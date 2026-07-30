import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import { getPublicCredential } from '@/services/credentialService';
import Logo from '@/components/common/Logo';
import CredentialCard from '@/components/common/CredentialCard';

export default function VerifyCredential() {
  const { uuid } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPublicCredential(uuid)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [uuid]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      <Logo size={48} />

      {loading && <Loader2 className="h-6 w-6 animate-spin text-text-muted" />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="h-10 w-10 text-status-error" />
          <h1 className="font-heading font-semibold text-lg text-text-primary">Credential not found</h1>
          <p className="max-w-sm text-sm text-text-muted">
            This verification link doesn't match any issued NeuroCode credential.
          </p>
          <Link to="/" className="text-sm text-emerald hover:underline">
            Back to NeuroCode
          </Link>
        </div>
      )}

      {!loading && data && (
        <div className="flex w-full max-w-md flex-col gap-4">
          <div className="flex items-center justify-center gap-2 rounded-input border border-emerald/40 bg-emerald/10 px-4 py-2 text-sm text-emerald">
            <ShieldCheck className="h-4 w-4" /> Verified NeuroCode Credential
          </div>
          <CredentialCard credential={data.credential} ownerName={data.owner_name} showActions={false} />
          <p className="text-center text-xs text-text-muted">
            This credential was independently verified through NeuroCode's assessment and behavioral integrity
            system.
          </p>
        </div>
      )}
    </main>
  );
}