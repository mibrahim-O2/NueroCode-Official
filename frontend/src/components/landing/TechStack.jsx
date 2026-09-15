// "Built With" section: NeuroCode's real, current technology stack shown as
// an icon-only grid. By design there is no visible text label under each
// icon — every tile still carries the technology's name in aria-label (for
// screen readers) and title (for hover tooltips), so the grid stays accessible.
import {
  SiReact, SiVite, SiTailwindcss, SiFastapi, SiPython, SiPostgresql, SiSupabase,
  SiFirebase, SiDocker, SiGooglegemini, SiScikitlearn, SiOpencv, SiJsonwebtokens,
} from 'react-icons/si';
import { Database, BrainCircuit, ListTree } from 'lucide-react';
import Reveal from './Reveal';

// Each Simple Icons export below was checked against the installed
// react-icons (5.7.0) before use. ChromaDB, OpenAI and Tree-sitter have no
// brand icon in that set (OpenAI's logo isn't in Simple Icons), so they use
// lucide-react fallbacks that still describe what the technology does.
const STACK = [
  { name: 'React', icon: SiReact },
  { name: 'Vite', icon: SiVite },
  { name: 'Tailwind CSS', icon: SiTailwindcss },
  { name: 'FastAPI', icon: SiFastapi },
  { name: 'Python', icon: SiPython },
  { name: 'PostgreSQL', icon: SiPostgresql },
  { name: 'Supabase', icon: SiSupabase },
  { name: 'ChromaDB', icon: Database }, // fallback: vector database
  { name: 'Firebase', icon: SiFirebase },
  { name: 'Docker', icon: SiDocker },
  { name: 'Google Gemini', icon: SiGooglegemini },
  { name: 'OpenAI', icon: BrainCircuit }, // fallback: AI model provider
  { name: 'Tree-sitter', icon: ListTree }, // fallback: syntax-tree parser
  { name: 'scikit-learn', icon: SiScikitlearn },
  { name: 'OpenCV', icon: SiOpencv },
  { name: 'JWT', icon: SiJsonwebtokens },
];

export default function TechStack() {
  return (
    <section id="tech-stack" className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-orange)' }}>
            Tech Stack
          </p>
          <h2 className="mt-3 text-center font-heading text-3xl font-bold sm:text-4xl" style={{ color: 'var(--l-text-primary)' }}>
            Built With
          </h2>
        </Reveal>

        <ul className="mt-12 grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
          {STACK.map(({ name, icon: Icon }, i) => (
            <li key={name}>
              <Reveal delay={i * 40}>
                <div
                  role="img"
                  aria-label={name}
                  title={name}
                  className="l-card flex aspect-square items-center justify-center transition-transform duration-200 hover:-translate-y-1"
                >
                  {/* Same alternating orange/teal accent rhythm as the feature grid. */}
                  <Icon
                    aria-hidden="true"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    style={{ color: i % 2 === 0 ? 'var(--l-orange)' : 'var(--l-teal)' }}
                  />
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
