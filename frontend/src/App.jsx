import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LoadingScreen from '@/components/common/LoadingScreen';
import AppRoutes from '@/routes/AppRoutes';

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
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}