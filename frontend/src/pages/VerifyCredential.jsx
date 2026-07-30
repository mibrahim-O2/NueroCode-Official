import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { ShieldCheck, XCircle, Loader2, Download } from 'lucide-react';
import { getPublicCredential } from '@/services/credentialService';
import CertificateTemplate from '@/components/common/CertificateTemplate';
import { exportCertificatePdf, getAssessmentTitle } from '@/utils/certificateShare';

// Best-effort Open Graph tags for this specific credential, set client-side.
// IMPORTANT LIMITATION (see written explanation): LinkedIn's crawler does
// not execute JavaScript, so these tags will NOT be picked up by LinkedIn's
// own preview generator for this SPA. They still correctly set the browser
// tab title and are the right approach for any crawler that does render
// JS. A true per-credential LinkedIn preview requires server-rendered
// meta tags, which is a backend change outside this task's scope.
function useCertificateMeta(data, verifyUrl) {
  useEffect(() => {
    if (!data) return undefined;

    const title = getAssessmentTitle(data.credential.topics_mastered);
    const description = `${data.owner_name} earned a ${data.credential.badge_level} NeuroCode credential for ${title} — verified score ${data.credential.assessment_score}%, integrity ${data.credential.integrity_score}%.`;
    const previousTitle = document.title;
    document.title = `${data.owner_name}'s NeuroCode Credential`;

    const tagsToSet = [
      { property: 'og:title', content: `${data.owner_name}'s NeuroCode Credential` },
      { property: 'og:description', content: description },
      { property: 'og:url', content: verifyUrl },
      { property: 'og:type', content: 'profile' },
    ];
    const createdTags = tagsToSet.map(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      const isNew = !tag;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
      return { tag, isNew };
    });

    return () => {
      document.title = previousTitle;
      createdTags.forEach(({ tag, isNew }) => {
        if (isNew) tag.remove();
      });
    };
  }, [data, verifyUrl]);
}

export default function VerifyCredential() {
  const { uuid } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const certRef = useRef(null);

  const verifyUrl = `${window.location.origin}/verify/${uuid}`;

  useEffect(() => {
    getPublicCredential(uuid)
      .then(async (result) => {
        setData(result);
        setQrDataUrl(await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 }));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  useCertificateMeta(data, verifyUrl);

  const handleExport = () => {
    if (!data) return;
    exportCertificatePdf(certRef, `neurocode-credential-${data.credential.badge_level}.pdf`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12">
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
        <div className="flex w-full max-w-4xl flex-col gap-4">
          <div className="flex items-center justify-center gap-2 rounded-input border border-emerald/40 bg-emerald/10 px-4 py-2 text-sm text-emerald">
            <ShieldCheck className="h-4 w-4" /> Independently Verified NeuroCode Credential
          </div>

          <CertificateTemplate ref={certRef} credential={data.credential} ownerName={data.owner_name} qrDataUrl={qrDataUrl} verifyUrl={verifyUrl} />

          <div className="flex justify-center">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-button border border-border px-4 py-2 text-xs text-text-secondary transition-colors duration-200 hover:border-emerald hover:text-emerald"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
          </div>

          <p className="text-center text-xs text-text-muted">
            This credential was independently verified through NeuroCode's assessment and behavioral integrity
            system.
          </p>
        </div>
      )}
    </main>
  );
}