import {
  Sparkles, Code2, Map, GitBranch, Gauge, ShieldCheck, Cpu,
  Mic, MessageSquare, BookCheck, RotateCcw, Users,
} from 'lucide-react';
import Reveal from './Reveal';

// All twelve are real, shipped features as of this pass — no more
// Live/Soon split. Bento layout: two large tiles anchor the grid, the
// rest fill in at standard size, giving visual variety without
// inventing content.
const FEATURES = [
  {
    icon: Sparkles, title: 'AI-Generated Practice, Execution-Validated',
    desc: "Every practice problem's canonical solution is actually executed through a sandbox before it's ever shown to a student — not just trusted from the AI's own output.",
    span: 'sm:col-span-2 lg:col-span-2',
  },
  {
    icon: ShieldCheck, title: 'Behavior-Based Proctoring',
    desc: 'Four independent integrity signals — tab-switching, paste detection, camera verification, keystroke rhythm — combined into one live score during assessments.',
    span: 'sm:col-span-2 lg:col-span-2',
  },
  { icon: Code2, title: 'Real Sandboxed Execution', desc: 'Python, JavaScript, and C++ — graded against real test cases, not simulated.' },
  { icon: Map, title: 'Adaptive Roadmap', desc: 'Reorders itself based on your actual submission history, not a fixed syllabus.' },
  { icon: GitBranch, title: 'Tree-sitter Code Analysis', desc: 'Structural complexity and anti-pattern detection from a real parse tree.' },
  { icon: Gauge, title: 'Personalized AI Feedback', desc: 'Written explanations grounded in what was actually detected in your code.' },
  { icon: Cpu, title: 'RAG-Powered Learning Assistant', desc: "Hints grounded in your own past submissions during practice — never a full answer." },
  { icon: Mic, title: 'Mock Interview Mode', desc: 'A timed, unassisted interview simulation — no hints, no chatbot, real pressure.' },
  { icon: MessageSquare, title: 'Teacher Comments', desc: "Real educator feedback written directly on your submitted code." },
  { icon: BookCheck, title: 'Official Solutions', desc: 'Compare your approach against the validated correct solution once you finish.' },
  { icon: RotateCcw, title: 'Spaced Review', desc: "Gentle reminders to revisit topics you haven't practiced in a while." },
  { icon: Users, title: 'Peer Discussion', desc: 'See how others solved the same practice problem — never shown for assessments.' },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-orange)' }}>
            The Platform
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl" style={{ color: 'var(--l-text-primary)' }}>
            Everything built, working together
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc, span }, i) => (
            <Reveal key={title} delay={i * 60} className={span || ''}>
              <div className="l-card l-shimmer flex h-full flex-col gap-3 p-6">
                <Icon className="h-5 w-5" style={{ color: i % 2 === 0 ? 'var(--l-orange)' : 'var(--l-teal)' }} />
                <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                  {desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}