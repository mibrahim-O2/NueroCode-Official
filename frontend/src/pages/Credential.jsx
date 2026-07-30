import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Award, Loader2 } from 'lucide-react';
import { getMyCredentials } from '@/services/credentialService';
import CredentialCard from '@/components/common/CredentialCard';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/context/AuthContext';

const VERIFY_BASE_URL = window.location.origin;

export default function Credential() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState({});

  useEffect(() => {
    getMyCredentials()
      .then(async (data) => {
        setCredentials(data);
        const codes = {};
        for (const cred of data) {
          const url = `${VERIFY_BASE_URL}/verify/${cred.verify_uuid}`;
          codes[cred.id] = await QRCode.toDataURL(url, { margin: 1, width: 160 });
        }
        setQrCodes(codes);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExportPdf = (credential) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('NeuroCode Credential', 20, 25);
    doc.setFontSize(12);
    doc.text(`Awarded to: ${user?.name}`, 20, 40);
    doc.text(`Badge Level: ${credential.badge_level.toUpperCase()}`, 20, 50);
    doc.text(`Topics Mastered: ${credential.topics_mastered.join(', ')}`, 20, 60);
    doc.text(`Assessment Score: ${credential.assessment_score}%`, 20, 70);
    doc.text(`Integrity Score: ${credential.integrity_score}%`, 20, 80);
    doc.text(`Date Earned: ${new Date(credential.created_at).toLocaleDateString()}`, 20, 90);
    doc.text(`Verify at: ${VERIFY_BASE_URL}/verify/${credential.verify_uuid}`, 20, 100);

    const qrDataUrl = qrCodes[credential.id];
    if (qrDataUrl) doc.addImage(qrDataUrl, 'PNG', 140, 30, 50, 50);

    doc.save(`neurocode-credential-${credential.badge_level}.pdf`);
  };

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
        <div className="grid gap-6 md:grid-cols-2">
          {credentials.map((cred) => (
            <CredentialCard
              key={cred.id}
              credential={cred}
              ownerName={user?.name}
              qrDataUrl={qrCodes[cred.id]}
              verifyUrl={`${VERIFY_BASE_URL}/verify/${cred.verify_uuid}`}
              showActions
              onExportPdf={() => handleExportPdf(cred)}
            />
          ))}
        </div>
      )}
    </div>
  );
}