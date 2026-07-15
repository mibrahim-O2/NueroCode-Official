import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import LogoTest from '@/pages/LogoTest';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/logo-test" element={<LogoTest />} />
    </Routes>
  );
}