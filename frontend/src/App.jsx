import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LoadingScreen from '@/components/common/LoadingScreen';
import AppRoutes from '@/routes/AppRoutes';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { TestModeProvider } from '@/context/TestModeContext';
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
            <TestModeProvider>
              <AppRoutes />
            </TestModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}