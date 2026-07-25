import { useEffect, useRef } from 'react';

export function useTabVisibility(onSwitch) {
  const wasHidden = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden.current = true;
      } else if (wasHidden.current) {
        wasHidden.current = false;
        onSwitch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onSwitch]);
}