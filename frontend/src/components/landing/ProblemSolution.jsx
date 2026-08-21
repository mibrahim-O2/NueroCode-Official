import { BookOpen, Code2, BarChart3, ShieldCheck, Award } from 'lucide-react';
import Reveal from './Reveal';

const FLOW = [
  { icon: BookOpen, label: 'Learn' },
  { icon: Code2, label: 'Practice' },
  { icon: BarChart3, label: 'Analyze' },
  { icon: ShieldCheck, label: 'Assess' },
  { icon: Award, label: 'Credential' },
];

export default function ProblemSolution() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="l-card h-full p-8">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-gold)' }}>
              The Problem
            </p>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
              Coding practice, feedback, assessments, and credentials usually live in disconnected tools.
              Students can practice a lot, but nothing proves mastery — and nothing they do informs what
              they study next.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="l-card h-full p-8">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-gold)' }}>
              Our Approach
            </p>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
              NeuroCode connects the entire journey in one intelligent platform.
            </p>
            <div className="mt-7 flex items-center justify-between gap-1">
              {FLOW.map(({ icon: Icon, label }, i) => (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full border"
                      style={{ borderColor: 'var(--l-gold)', color: 'var(--l-gold)' }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--l-text-muted)' }}>{label}</span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <span className="flex-1 text-center" style={{ color: 'var(--l-text-muted)' }}>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}