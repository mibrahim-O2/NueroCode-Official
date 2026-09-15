import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LoadingScreen from '@/components/common/LoadingScreen';
import AppRoutes from '@/routes/AppRoutes';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { DemoModeProvider } from '@/context/DemoModeContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitializing(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            {/* DemoModeProvider sits inside AuthProvider: it needs the signed-in
                user to decide whether to ask the backend for Demo Mode status. */}
            <DemoModeProvider>
              <AppRoutes />
            </DemoModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}