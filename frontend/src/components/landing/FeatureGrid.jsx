import { Sparkles, Code2, Map, GitBranch, Gauge, ShieldCheck, Cpu, Mic, MessageSquare, BookCheck, RotateCcw, Users } from 'lucide-react';
import Reveal from './Reveal';

// status: 'live' (shipped and working today) vs 'soon' (actively in
// development — honest, forward-looking language rather than a false
// present-tense claim). Flip a single status string here once a feature
// ships; no layout or copy restructuring needed.
const UPCOMING_FEATURES = [
  { icon: Mic, title: 'Mock Interview Mode', desc: 'A timed, unassisted interview simulation.' },
  { icon: MessageSquare, title: 'Teacher Comments', desc: 'Real educator feedback on your own code.' },
  { icon: BookCheck, title: 'Official Solutions', desc: 'Compare your approach once you\'re done.' },
  { icon: RotateCcw, title: 'Spaced Review', desc: 'Gentle nudges to revisit older topics.' },
  { icon: Users, title: 'Peer Discussion', desc: 'See how others solved the same problem.' },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-gold)' }}>
            The Platform
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl" style={{ color: 'var(--l-text-primary)' }}>
            Built like a real engineering product
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal className="sm:col-span-2 lg:col-span-2">
            <div className="l-card l-shimmer flex h-full flex-col justify-center gap-3 p-7">
              <Sparkles className="h-6 w-6" style={{ color: 'var(--l-gold)' }} />
              <h3 className="font-heading text-lg font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                AI-Generated Practice, Execution-Validated
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                Every practice problem's canonical solution is actually executed through a sandbox before
                it's ever shown to a student — not just trusted from the AI's own output.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="l-card l-shimmer flex h-full flex-col gap-3 p-6">
              <Code2 className="h-5 w-5" style={{ color: 'var(--l-gold)' }} />
              <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                Real Sandboxed Execution
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                Python, JavaScript, and C++ — graded against real test cases, not simulated.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="l-card l-shimmer flex h-full flex-col gap-3 p-6">
              <Map className="h-5 w-5" style={{ color: 'var(--l-gold)' }} />
              <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                Adaptive Roadmap
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                Reorders itself based on your actual submission history, not a fixed syllabus.
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="l-card l-shimmer flex h-full flex-col gap-3 p-6">
              <GitBranch className="h-5 w-5" style={{ color: 'var(--l-gold)' }} />
              <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                Tree-sitter Code Analysis
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                Structural complexity and anti-pattern detection from a real parse tree.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="l-card l-shimmer flex h-full flex-col gap-3 p-6">
              <Gauge className="h-5 w-5" style={{ color: 'var(--l-gold)' }} />
              <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                Complexity &amp; Anti-Pattern Feedback
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                Personalized, AI-written explanations grounded in what was actually detected.
              </p>
            </div>
          </Reveal>

          <Reveal className="sm:col-span-2 lg:col-span-1" delay={240}>
            <div className="l-card l-shimmer flex h-full flex-col gap-3 p-6">
              <ShieldCheck className="h-5 w-5" style={{ color: 'var(--l-gold)' }} />
              <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                Behavior-Based Proctoring
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                Four independent integrity signals, combined into one live score during assessments.
              </p>
            </div>
          </Reveal>

          <Reveal className="sm:col-span-2 lg:col-span-3" delay={280}>
            <div className="l-card l-shimmer flex h-full flex-col gap-3 p-6 sm:flex-row sm:items-center sm:gap-6">
              <Cpu className="h-8 w-8 shrink-0" style={{ color: 'var(--l-gold)' }} />
              <div>
                <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                  RAG-Powered Learning Assistant
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                  A retrieval-grounded chatbot offers hints based on your own past submissions during
                  practice — never a full answer, and never available during a proctored assessment.
                </p>
              </div>
            </div>
                    </Reveal>
        </div>

        <Reveal delay={320}>
          <div className="mt-14 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--l-green-mid)' }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-gray-green)' }}>
              Launching Very Soon
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {UPCOMING_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="l-card flex flex-col gap-2 p-4"
                style={{ borderStyle: 'dashed', borderColor: 'var(--l-border)' }}
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4" style={{ color: 'var(--l-gray-green)' }} />
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: 'var(--l-surface-alt)', color: 'var(--l-gray-green)' }}
                  >
                    Soon
                  </span>
                </div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--l-text-primary)' }}>{title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--l-text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
          