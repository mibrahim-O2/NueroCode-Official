import { useRef, useState } from 'react';
import { X, Download, Link2, Linkedin, Check } from 'lucide-react';
import CertificateTemplate from './CertificateTemplate';
import { exportCertificatePdf, buildLinkedInCaption, buildLinkedInShareUrl } from '@/utils/certificateShare';

export default function CertificateModal({ credential, ownerName, qrDataUrl, verifyUrl, onClose }) {
  const certRef = useRef(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const handleExport = () => {
    exportCertificatePdf(certRef, `neurocode-credential-${credential.badge_level}-${credential.id.slice(0, 8)}.pdf`);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareLinkedIn = async () => {
    const caption = buildLinkedInCaption(credential, ownerName, verifyUrl);
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 4000);
    } catch {
      // Clipboard access can fail silently (permissions/insecure context) —
      // the LinkedIn share window still opens either way.
    }
    window.open(buildLinkedInShareUrl(verifyUrl), '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-dialog border border-border bg-charcoal p-4 shadow-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-text-primary">Your Certificate</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <CertificateTemplate ref={certRef} credential={credential} ownerName={ownerName} qrDataUrl={qrDataUrl} verifyUrl={verifyUrl} />

        {copiedCaption && (
          <p className="text-center text-xs text-emerald">
            Suggested LinkedIn caption copied to your clipboard — paste it into your post!
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-button bg-emerald px-4 py-2 text-xs text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover"
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-button border border-border px-4 py-2 text-xs text-text-secondary transition-colors duration-200 hover:border-emerald hover:text-emerald"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            {copiedLink ? 'Copied!' : 'Copy Verification Link'}
          </button>
          <button
            onClick={handleShareLinkedIn}
            className="flex items-center gap-1.5 rounded-button border border-[#0A66C2] px-4 py-2 text-xs text-[#0A66C2] transition-colors duration-200 hover:bg-[#0A66C2]/10"
          >
            <Linkedin className="h-3.5 w-3.5" /> Share on LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
}