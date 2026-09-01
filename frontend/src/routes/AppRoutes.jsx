// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Integrity from '@/pages/Integrity';
import LogoTest from '@/pages/LogoTest';
import Login from '@/pages/Login';
import VerifyCredential from '@/pages/VerifyCredential';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Roadmap from '@/pages/Roadmap';
import Practice from '@/pages/Practice';
import Challenge from '@/pages/Challenge';
import MockInterview from '@/pages/MockInterview';
import MySubmissions from '@/pages/MySubmissions';
import Assessment from '@/pages/Assessment';
import Credential from '@/pages/Credential';
import Educator from '@/pages/Educator';
import StudentTimeline from '@/pages/StudentTimeline';
import Admin from '@/pages/Admin';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/integrity" element={<Integrity />} />
      <Route path="/logo-test" element={<LogoTest />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify/:uuid" element={<VerifyCredential />} />

      {/* Authenticated Dashboard & Learning Routes */}
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
        <Route path="/practice/:nodeId" element={<Practice />} />
        <Route path="/challenge" element={<Challenge />} />
        <Route path="/challenge/:nodeId" element={<Challenge />} />
        <Route path="/interview" element={<MockInterview />} />
        <Route path="/submissions" element={<MySubmissions />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/credential" element={<Credential />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Educator / Admin Gated Routes */}
        <Route
          path="/educator"
          element={
            <ProtectedRoute roles={['educator', 'admin']}>
              <Educator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/educator/students/:userId"
          element={
            <ProtectedRoute roles={['educator', 'admin']}>
              <StudentTimeline />
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

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
