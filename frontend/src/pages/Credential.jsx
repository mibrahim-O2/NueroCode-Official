import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Award, Loader2, AlertCircle } from 'lucide-react';
import { getMyCredentials } from '@/services/credentialService';
import {
  buildDemoVerifyUrl,
  getDemoAssessments,
  getDemoCredentials,
  issueDemoCredential,
} from '@/services/demoService';
import CredentialCard from '@/components/common/CredentialCard';
import CertificateModal from '@/components/common/CertificateModal';
import EmptyState from '@/components/common/EmptyState';
import { useDemoMode, useDisplayIdentity } from '@/context/DemoModeContext';

const VERIFY_BASE_URL = window.location.origin;
const BADGE_TIERS = ['bronze', 'silver', 'gold', 'platinum'];

export default function Credential() {
  const { demoModeEnabled } = useDemoMode();
  // Certificates show the display identity: the demo persona in Demo Mode.
  const identity = useDisplayIdentity();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState({});
  const [selected, setSelected] = useState(null);

  const [demoAssessments, setDemoAssessments] = useState([]);
  const [issueTier, setIssueTier] = useState('gold');
  const [issueAssessmentKey, setIssueAssessmentKey] = useState('assessment_1');
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState(null);

  // Demo credentials' QR codes and links ALWAYS point at the demo notice page
  // (/demo/verify/...), never the real /verify page.
  const verifyUrlFor = useCallback(
    (cred) => (demoModeEnabled ? buildDemoVerifyUrl(cred.verify_uuid) : `${VERIFY_BASE_URL}/verify/${cred.verify_uuid}`),
    [demoModeEnabled]
  );

  const loadCredentials = useCallback(() => {
    setLoading(true);
    return (demoModeEnabled ? getDemoCredentials() : getMyCredentials())
      .then(async (data) => {
        setCredentials(data);
        const codes = {};
        for (const cred of data) {
          codes[cred.id] = await QRCode.toDataURL(verifyUrlFor(cred), { margin: 1, width: 200 });
        }
        setQrCodes(codes);
      })
      .finally(() => setLoading(false));
  }, [demoModeEnabled, verifyUrlFor]);

  useEffect(() => {
    setSelected(null);
    loadCredentials();
    if (demoModeEnabled) {
      getDemoAssessments()
        .then((data) => {
          const list = data.assessments || [];
          setDemoAssessments(list);
          // Pre-select the tier a passing attempt actually earned (computed by
          // the real tier rule). The presenter can still pick any tier.
          const earned = list.find((a) => a.earned_badge_level);
          if (earned) {
            setIssueTier(earned.earned_badge_level);
            setIssueAssessmentKey(earned.key);
          }
        })
        .catch(() => setDemoAssessments([]));
    }
  }, [demoModeEnabled, loadCredentials]);

  const handleIssue = async () => {
    setIssuing(true);
    setIssueError(null);
    try {
      await issueDemoCredential(issueTier, issueAssessmentKey);
      await loadCredentials();
    } catch (err) {
      setIssueError(err.message || 'Could not issue the demo credential.');
    } finally {
      setIssuing(false);
    }
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

      {/* Presenter-triggered issuing, Demo Mode only (any tier may be chosen). */}
      {demoModeEnabled && (
        <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-card p-5 shadow-card">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Assessment</label>
            <select
              value={issueAssessmentKey}
              onChange={(e) => setIssueAssessmentKey(e.target.value)}
              className="rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-orange"
            >
              {demoAssessments.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Tier</label>
            <select
              value={issueTier}
              onChange={(e) => setIssueTier(e.target.value)}
              className="rounded-input border border-border bg-elevated px-3 py-2 text-sm capitalize text-text-primary outline-none transition-colors duration-200 focus:border-orange"
            >
              {BADGE_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleIssue}
            disabled={issuing || demoAssessments.length === 0}
            className="flex items-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm font-body text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
          >
            {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Issue Demo Credential
          </button>
          {issueError && (
            <p className="flex w-full items-center gap-1.5 text-xs text-status-error">
              <AlertCircle className="h-3.5 w-3.5" /> {issueError}
            </p>
          )}
        </div>
      )}

      {credentials.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No credentials yet"
          description={
            demoModeEnabled
              ? 'Issue a demo credential above to see the certificate and its verification link.'
              : 'Pass a proctored assessment to earn your first verifiable credential.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map((cred, i) => (
            <div key={cred.id} className="animate-slide-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <CredentialCard credential={cred} onView={() => setSelected(cred)} />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <CertificateModal
          credential={selected}
          ownerName={identity.name}
          qrDataUrl={qrCodes[selected.id]}
          verifyUrl={verifyUrlFor(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
