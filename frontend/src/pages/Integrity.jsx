// src/pages/Integrity.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  Eye,
  Lock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useAuth } from '@/context/AuthContext';

export default function Integrity() {
  const { user } = useAuth();
  const [simulatedScore] = useState(94);
  const [telemetryLogs] = useState([
    { id: 1, time: '10:04:12', type: 'KEYSTROKE', msg: 'Flight-time: 142ms (Gaussian variance: 0.04 - Human)', status: 'clean' },
    { id: 2, time: '10:04:18', type: 'VISION', msg: 'OpenCV Haar Cascade: 1 Face Detected (Conf: 0.98)', status: 'clean' },
    { id: 3, time: '10:04:25', type: 'PASTE', msg: 'Monaco buffer insert: 18 chars (< 50 threshold)', status: 'clean' },
    { id: 4, time: '10:04:31', type: 'FOCUS', msg: 'Window focus: Active document (0 blur events)', status: 'clean' }
  ]);

  const navItems = [
    { label: 'Platform', href: '/#how-it-works' },
    { label: 'Integrity Engine', href: '/integrity' },
    { label: 'Credentials', href: '/#credentials' },
    { label: 'Educators', href: '/#educator' },
    { label: 'Roadmap', href: '/roadmap' }
  ];

  const pillars = [
    {
      id: 'keystroke',
      title: 'Keystroke Dynamics ML',
      icon: Activity,
      tag: 'scikit-learn · Isolation Forest',
      summary: 'Detects unauthorized secondary-device entry and copy-typing cadence anomalies.',
      description: 'An unsupervised Isolation Forest algorithm evaluates raw keydown/keyup flight times, hold durations, and typing variance. A dual-gating rule check ensures fast, honest human typists are never falsely penalized.',
      metrics: [
        { label: 'Model Pipeline', val: 'Isolation Forest + Z-Score Filter' },
        { label: 'Latency Sampling', val: 'Sliding 20-Keystroke Window' },
        { label: 'Decision Gate', val: 'Score < -0.5 && Z > 2.8' }
      ]
    },
    {
      id: 'vision',
      title: 'OpenCV Presence Verification',
      icon: Eye,
      tag: 'OpenCV · Haar Cascades',
      summary: 'Confirms continuous single-user presence with zero image storage.',
      description: 'The browser samples downscaled video frames every 5 seconds, evaluating face bounding boxes purely in-memory. In accordance with Privacy by Design principles, frames are instantly discarded after computing presence confidence.',
      metrics: [
        { label: 'Inference Engine', val: 'Haar Feature-Based Cascade' },
        { label: 'Sampling Interval', val: 'Periodic 5000ms Polling' },
        { label: 'Privacy Standard', val: 'Zero Pixel Storage (RAM Only)' }
      ]
    },
    {
      id: 'clipboard',
      title: 'Monaco Paste Volume Gate',
      icon: Lock,
      tag: 'Deterministic Threshold Gate',
      summary: 'Prevents external code injection and large block transfers.',
      description: 'Intercepts internal clipboard events directly inside the Monaco editor workspace. Blocks bulk text insertions exceeding the 50-character threshold, mandating manual programmatic construction.',
      metrics: [
        { label: 'Event Interceptor', val: 'Monaco OnDidChangeModelContent' },
        { label: 'Threshold Bound', val: '< 50 Characters per Event' },
        { label: 'Action Policy', val: 'Flag and Invalidate Buffer' }
      ]
    },
    {
      id: 'telemetry',
      title: 'Client-Verified Integrity',
      icon: Zap,
      tag: 'Browser Detection · REST Persistence · Server-Side Scoring',
      summary: 'Every signal is detected locally in real time, then independently re-verified from the server\'s own records at submission.',
      description: 'Tab switches, large pastes, camera status, and keystroke rhythm are detected directly in the browser during the session for immediate feedback. Each event is persisted to the backend as it happens, and the authoritative integrity score is computed server-side from those stored records at submission — never from a value the client sends.',
      metrics: [
        { label: 'Transport Layer', val: 'Direct REST Event Logging' },
        { label: 'Composite Range', val: '0 – 100 Live Normalized Score' },
        { label: 'Certification Gate', val: 'Minimum ≥ 60 to Mint Credential' }
      ]
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#030906] font-sans text-slate-100 selection:bg-[#10b981]/30 selection:text-[#34d399] overflow-x-hidden antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px] opacity-35" />
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[600px] w-[800px] bg-[radial-gradient(circle,_rgba(16,185,129,0.14)_0%,_transparent_70%)] blur-[130px]" />
      <div className="pointer-events-none absolute top-[500px] -left-40 h-[600px] w-[600px] bg-[radial-gradient(circle,_rgba(245,158,11,0.06)_0%,_transparent_70%)] blur-[140px]" />

      <header className="relative z-50 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 border-b border-white/[0.06]">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            NuroCode
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`text-xs font-medium transition-colors ${
                item.href === '/integrity' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 hover:border-white/20 hover:text-white transition-all"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Link>

          <Link
            to={user ? '/dashboard' : '/login'}
            className="rounded-xl bg-[#10b981] px-4 py-1.5 text-xs font-bold text-[#030906] transition-all hover:bg-[#059669] hover:text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            Launch Session
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 flex flex-col gap-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" /> The 4-Pillar Behavioral Integrity Engine
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Assessments That <span className="text-amber-400">Cannot Be Faked</span>.
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            NuroCode combines real-time temporal machine learning, privacy-first computer vision, and client telemetry into a single tamper-proof integrity gate—ensuring verifiable credentials represent genuine skill.
          </p>
        </div>

        <div className="rounded-2xl bg-[#091512] border border-emerald-900/40 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-heading text-sm font-bold text-white">Live Proctoring Simulation Console</h3>
                <p className="text-[11px] font-mono text-gray-400">Proctoring Signals: Active · 4 Detection Channels Monitored</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-mono font-bold text-[#34d399]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Score: {simulatedScore}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[#060e0c] border border-emerald-950">
              <div className="relative flex h-40 w-40 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#062216" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - (simulatedScore / 100) * 0.78)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-4xl font-extrabold text-white">{simulatedScore}<span className="text-xs text-gray-400 font-normal">/100</span></span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Integrity Score</span>
                </div>
              </div>

              <span className="mt-3 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-3.5 py-0.5 text-[10px] font-bold text-[#34d399]">
                Eligible for Platinum Credential
              </span>
            </div>

            <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Telemetry Ingestion Log</span>
                <span className="text-[10px] font-mono text-emerald-400">Stream Status: Nominal</span>
              </div>

              <div className="h-44 rounded-xl bg-[#050b09] border border-emerald-950/80 p-3.5 font-mono text-xs overflow-y-auto space-y-2">
                {telemetryLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <span className="text-gray-500">[{log.time}]</span>
                    <span className="text-amber-400 font-bold">{log.type}</span>
                    <span className="text-slate-300">{log.msg}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-1">
                <span>Tab Switches: <strong className="text-emerald-400">0 Flags</strong></span>
                <span>Paste Threshold: <strong className="text-emerald-400">Clean</strong></span>
                <span>Camera Verification: <strong className="text-emerald-400">100%</strong></span>
                <span>Keystroke Variance: <strong className="text-emerald-400">Human Cadence</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="text-left space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Architectural Breakdown</span>
            <h2 className="font-heading text-3xl font-extrabold text-white">How Each Stream Operates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.id}
                  className="rounded-2xl bg-[#091512] border border-emerald-900/40 p-7 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="font-mono text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-md">
                        {pillar.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-lg font-bold text-white">{pillar.title}</h3>
                      <p className="text-xs font-medium text-emerald-400/90 mt-0.5">{pillar.summary}</p>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-emerald-950 pt-4 font-mono text-[11px]">
                    {pillar.metrics.map((m) => (
                      <div key={m.label} className="flex justify-between items-center text-slate-400">
                        <span>{m.label}:</span>
                        <span className="text-slate-200 font-bold">{m.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#05140d]/80 p-8 text-left space-y-6 backdrop-blur-xl">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Ethical AI & Fairness</span>
            <h3 className="font-heading text-2xl font-bold text-white">Guaranteed Privacy & False-Positive Immunity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-[#060e0c] border border-emerald-950 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Zero Pixel Storage
              </div>
              <p className="text-gray-400 leading-relaxed">
                Webcam video frames are never written to disk, sent to external APIs, or persisted in the database. Frames are evaluated in transient RAM and dropped instantly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060e0c] border border-emerald-950 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Dual-Gating Safeguard
              </div>
              <p className="text-gray-400 leading-relaxed">
                No single biometric signal can fail a candidate. The keystroke ML model requires agreement between statistical flight-time bounds and machine-learning trees.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060e0c] border border-emerald-950 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Gated Assessment Scope
              </div>
              <p className="text-gray-400 leading-relaxed">
                Proctoring streams are strictly locked to summative examination gates. Practice roadmaps, chatbot hints, and open playground modes remain completely unmonitored.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#062416] via-[#091512] to-[#062416] p-10 text-center space-y-6">
          <h3 className="font-heading text-3xl font-extrabold text-white">
            Ready to Take a Behavior-Verified Assessment?
          </h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Progress through your adaptive roadmap, master topic clusters, and unlock your first verifiable Platinum certificate.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/roadmap"
              className="flex items-center gap-2 rounded-xl bg-[#10b981] px-7 py-3 text-xs font-bold text-[#030906] shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:bg-[#059669] hover:text-white"
            >
              <span>Explore Adaptive Roadmap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 lg:px-16 bg-[#020504] border-t border-emerald-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Logo size={22} />
            <span>NuroCode Integrity Subsystem</span>
          </div>
          <p>© 2026 NuroCode • Institute of Mathematics and Computer Science (IMCS). All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-emerald-400 transition">Landing</Link>
            <Link to="/roadmap" className="hover:text-emerald-400 transition">Roadmap</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
