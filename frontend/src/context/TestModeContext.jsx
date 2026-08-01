import { createContext, useContext, useEffect, useState } from 'react';
import { getTestModeStatus } from '@/services/testModeService';

const TestModeContext = createContext(false);

export function TestModeProvider({ children }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    getTestModeStatus()
      .then((res) => setEnabled(res.enabled))
      .catch(() => setEnabled(false));
  }, []);

  return <TestModeContext.Provider value={enabled}>{children}</TestModeContext.Provider>;
}

export function useTestMode() {
  return useContext(TestModeContext);
}