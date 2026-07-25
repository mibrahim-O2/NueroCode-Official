import { useEffect } from 'react';

const LARGE_PASTE_THRESHOLD = 30;

export function usePasteDetection(onLargePaste) {
  useEffect(() => {
    const handlePaste = (e) => {
      const text = e.clipboardData?.getData('text') || '';
      if (text.length >= LARGE_PASTE_THRESHOLD) {
        onLargePaste(text.length);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onLargePaste]);
}