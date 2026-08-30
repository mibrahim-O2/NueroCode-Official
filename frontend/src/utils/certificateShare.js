import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Presentational-only mirror of assessment_service.py's CLUSTERS list, used
// purely to show a friendly assessment name instead of a raw topic list.
// Nothing here touches the backend's actual cluster definitions or grading
// logic — if a future cluster isn't in this map, the fallback below still
// produces a correct, readable title with zero code changes required.
const CLUSTER_NAME_LOOKUP = {
  'Arrays|Strings': 'Fundamentals',
  'Hash Maps|Two Pointers': 'Lookups & Efficiency',
  'Sliding Window|Stacks & Queues': 'Windows & Structures',
  'Recursion & Backtracking|Trees': 'Recursive Thinking',
  'Dynamic Programming|Graphs': 'Advanced Structures',
};

export function getAssessmentTitle(topicsMastered) {
  const key = [...topicsMastered].sort().join('|');
  return CLUSTER_NAME_LOOKUP[key] || `${topicsMastered.join(' & ')} Assessment`;
}

/**
 * Captures the certificate DOM node as a high-resolution image and places
 * it into a landscape A4 PDF. Using the SAME rendered component that's
 * already on screen (rather than a separate PDF layout) guarantees the
 * PDF, the credential page, and the verification page can never visually
 * drift apart from each other.
 */
export async function exportCertificatePdf(nodeRef, filename) {
  const node = nodeRef.current;
  if (!node) return;

  const canvas = await html2canvas(node, {
    scale: 3, // high resolution — print/LinkedIn/resume quality
    // Bug fix: this was '#0B0B0C', the OLD pre-redesign cool-toned
    // Obsidian value — stale since Part 1 changed the base tone to the
    // warm '#0F0B08'. html2canvas uses this as the capture backdrop for
    // any transparent/anti-aliased edge pixel, so leaving it mismatched
    // risked a subtle but real color fringe around the exported
    // certificate's border that wouldn't match the certificate's own
    // (now-warm) background.
    backgroundColor: '#0F0B08',
    useCORS: true,
  });

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const yOffset = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 0;

  pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, yOffset, imgWidth, Math.min(imgHeight, pageHeight));
  pdf.save(filename);
}

export function buildLinkedInCaption(credential, ownerName, verifyUrl) {
  const title = getAssessmentTitle(credential.topics_mastered);
  return [
    `I just earned a ${credential.badge_level.toUpperCase()} credential on NeuroCode for the "${title}" assessment, mastering ${credential.topics_mastered.join(' & ')}!`,
    '',
    `Assessment Score: ${credential.assessment_score}%`,
    `Integrity Verified: ${credential.integrity_score}%`,
    `Proctored & AI-Verified`,
    '',
    `Verify my credential here:`,
    verifyUrl,
    '',
    `#NeuroCode #CodingSkills #TechEducation`,
  ].join('\n');
}

// LinkedIn's only current, officially supported third-party sharing
// endpoint. It accepts a URL and nothing else — see the explanation below
// for why text/title can't be reliably pre-filled through this endpoint.
export function buildLinkedInShareUrl(verifyUrl) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
}