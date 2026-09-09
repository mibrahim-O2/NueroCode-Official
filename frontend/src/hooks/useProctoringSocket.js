import { useCallback, useMemo, useState } from 'react';

/**
 * Local, client-side proctoring score + event feed for the student's own
 * in-session visibility.
 *
 * There is NO real-time socket server in this codebase, so this hook does
 * not connect to anything. It simply accumulates the proctoring events
 * that the browser actually detects during the session (tab switches,
 * large pastes, camera alerts, keystroke-rhythm alerts) and derives a
 * live score from the SAME penalty weights the backend uses.
 *
 * The backend independently computes and enforces the authoritative
 * integrity score from the persisted `proctoring_logs` rows after
 * submission. This local number is purely UX feedback; the two normally
 * agree because they sum the same events, just in two places for two
 * purposes.
 */

// Penalty weights — kept in lockstep with the backend
// (backend/app/services/assessment_service.py INTEGRITY_EVENT_PENALTIES):
// tab_switch -5, paste -8, camera_alert -10, keystroke_alert -6, floor 0.
const EVENT_META = {
  tab_switch: { penalty: 5, message: 'Tab switch / window left focus' },
  paste: { penalty: 8, message: 'Large paste into the editor' },
  camera_alert: { penalty: 10, message: 'Camera check failed (no face, multiple faces, or access denied)' },
  keystroke_alert: { penalty: 6, message: 'Unusual typing rhythm detected' },
};

export function useProctoringSocket() {
  // Newest first, matching how ProctoringLogFeed renders the list.
  const [events, setEvents] = useState([]);

  const score = useMemo(() => {
    const penalty = events.reduce((sum, e) => sum + (EVENT_META[e.eventType]?.penalty ?? 0), 0);
    return Math.max(0, 100 - penalty);
  }, [events]);

  const recordEvent = useCallback((eventType, severity) => {
    const meta = EVENT_META[eventType];
    if (!meta) return;
    setEvents((prev) => [
      { eventType, severity, message: meta.message, timestamp: Date.now() },
      ...prev,
    ]);
  }, []);

  return { score, log: events, recordEvent };
}
