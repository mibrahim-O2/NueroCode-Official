import { useEffect, useRef } from 'react';
import { checkKeystrokeRhythm } from '@/services/proctoringService';

const BATCH_INTERVAL_MS = 30000;
const MIN_SAMPLES = 6;

const MODIFIER_KEYS = new Set(['Control', 'Meta', 'Shift', 'Alt']);

export function useKeystrokeMonitor(onAnomaly) {
  const timestamps = useRef([]);

  useEffect(() => {
    const handleKeydown = (e) => {
      // Modifier keys and Ctrl/Cmd+<key> shortcuts (paste, copy, undo, etc.)
      // aren't characters being typed — including them contaminates the
      // rhythm sample with artificial near-zero intervals that look like
      // anomalies but are really just a keyboard shortcut being pressed.
      if (MODIFIER_KEYS.has(e.key) || e.ctrlKey || e.metaKey) return;
      timestamps.current.push(Date.now());
    };
    document.addEventListener('keydown', handleKeydown);

    const intervalId = setInterval(async () => {
      const stamps = timestamps.current;
      timestamps.current = [];
      if (stamps.length < MIN_SAMPLES) return;

      const intervals = [];
      for (let i = 1; i < stamps.length; i++) {
        intervals.push(stamps[i] - stamps[i - 1]);
      }

      try {
        const result = await checkKeystrokeRhythm(intervals);
        if (result.anomalous) onAnomaly(result);
      } catch {
        // Non-critical — a failed check shouldn't disrupt the session
      }
    }, BATCH_INTERVAL_MS);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      clearInterval(intervalId);
    };
  }, [onAnomaly]);
}