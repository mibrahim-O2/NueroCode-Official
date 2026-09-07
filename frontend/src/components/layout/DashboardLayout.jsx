import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import TestModePanel from '@/components/common/TestModePanel';
import { useTestMode } from '@/context/TestModeContext';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const testModeEnabled = useTestMode();

  return (
      <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
      {testModeEnabled && <TestModePanel />}
    </div>
  );
}
