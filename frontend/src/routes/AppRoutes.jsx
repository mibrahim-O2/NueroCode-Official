// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Integrity from '@/pages/Integrity';
import Login from '@/pages/Login';
import GetStarted from '@/pages/GetStarted';
import VerifyCredential from '@/pages/VerifyCredential';
import DemoVerifyCredential from '@/pages/DemoVerifyCredential';
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
      <Route path="/login" element={<Login />} />
      {/* Public explainer that every landing-page Get Started / Sign In button
          now opens, since the deployed preview has no live backend. /login above
          stays unchanged for local setups. */}
      <Route path="/get-started" element={<GetStarted />} />
      <Route path="/verify/:uuid" element={<VerifyCredential />} />
      {/* Demo credentials' QR codes and links land here, never on the real
          /verify page — it only ever shows the "this is a demo credential" notice. */}
      <Route path="/demo/verify/:uuid" element={<DemoVerifyCredential />} />

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
