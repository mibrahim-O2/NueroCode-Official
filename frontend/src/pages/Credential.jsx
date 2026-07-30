import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Award, Loader2 } from 'lucide-react';
import { getMyCredentials } from '@/services/credentialService';
import CredentialCard from '@/components/common/CredentialCard';
import CertificateModal from '@/components/common/CertificateModal';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/context/AuthContext';

const VERIFY_BASE_URL = window.location.origin;

export default function Credential() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getMyCredentials()
      .then(async (data) => {
        setCredentials(data);
        const codes = {};
        for (const cred of data) {
          const url = `${VERIFY_BASE_URL}/verify/${cred.verify_uuid}`;
          codes[cred.id] = await QRCode.toDataURL(url, { margin: 1, width: 200 });
        }
        setQrCodes(codes);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Credentials</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Verifiable proof of what you've mastered</p>
      </div>

      {credentials.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No credentials yet"
          description="Pass a proctored assessment to earn your first verifiable credential."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map((cred) => (
            <CredentialCard key={cred.id} credential={cred} onView={() => setSelected(cred)} />
          ))}
        </div>
      )}

      {selected && (
        <CertificateModal
          credential={selected}
          ownerName={user?.name}
          qrDataUrl={qrCodes[selected.id]}
          verifyUrl={`${VERIFY_BASE_URL}/verify/${selected.verify_uuid}`}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}