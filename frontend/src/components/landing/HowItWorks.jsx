import { UserPlus, Map, Sparkles, ShieldCheck, Award } from 'lucide-react';
import Reveal from './Reveal';

const STEPS = [
  { n: '01', icon: UserPlus, title: 'Sign Up', desc: 'Create an account and begin your learning journey.' },
  { n: '02', icon: Map, title: 'Adaptive Roadmap', desc: 'NeuroCode builds a learning roadmap around your performance and weak areas.' },
  { n: '03', icon: Sparkles, title: 'AI-Generated Practice', desc: 'Solve AI-generated coding problems, validated through real execution.' },
  { n: '04', icon: ShieldCheck, title: 'Proctored Assessment', desc: "Complete a behavior-verified assessment using NeuroCode's integrity signals." },
  { n: '05', icon: Award, title: 'Verified Credential', desc: 'A successful assessment earns a publicly verifiable credential.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--l-gold)' }}>
            How It Works
          </p>
          <h2 className="mt-3 text-center font-heading text-3xl font-bold sm:text-4xl" style={{ color: 'var(--l-text-primary)' }}>
            One connected journey, not five separate features
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <div
            className="absolute left-0 right-0 top-8 hidden h-px lg:block"
            style={{ background: 'linear-gradient(90deg, transparent, var(--l-border) 10%, var(--l-border) 90%, transparent)' }}
          />
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-6">
            {STEPS.map(({ n, icon: Icon, title, desc }, i) => (
              <Reveal key={n} delay={i * 100}>
                <div className="relative flex flex-col items-start gap-4 lg:items-center lg:text-center">
                  <div
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2"
                    style={{ borderColor: 'var(--l-gold)', backgroundColor: 'var(--l-bg-alt)', color: 'var(--l-gold)' }}
                  >
                    <Icon className="h-6 w-6" />
                    <span
                      className="absolute -right-1 -top-2 rounded-full px-1.5 text-[10px] font-mono font-semibold"
                      style={{ backgroundColor: 'var(--l-gold)', color: '#0B0B0D' }}
                    >
                      {n}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold" style={{ color: 'var(--l-text-primary)' }}>
                      {title}
                    </h3>
                    <p className="mt-1.5 max-w-[220px] text-sm leading-relaxed" style={{ color: 'var(--l-text-secondary)' }}>
                      {desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}