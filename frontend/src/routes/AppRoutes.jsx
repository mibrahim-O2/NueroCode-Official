import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import LogoTest from '@/pages/LogoTest';
import Login from '@/pages/Login';
import VerifyCredential from '@/pages/VerifyCredential';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Roadmap from '@/pages/Roadmap';
import Practice from '@/pages/Practice';
import Assessment from '@/pages/Assessment';
import Credential from '@/pages/Credential';
import Educator from '@/pages/Educator';
import Admin from '@/pages/Admin';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/logo-test" element={<LogoTest />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify/:uuid" element={<VerifyCredential />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/credential" element={<Credential />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/educator"
          element={
            <ProtectedRoute roles={['educator', 'admin']}>
              <Educator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}