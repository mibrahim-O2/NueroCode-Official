import '@/styles/landing.css';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import ProblemSolution from '@/components/landing/ProblemSolution';
import HowItWorks from '@/components/landing/HowItWorks';
import FeatureGrid from '@/components/landing/FeatureGrid';
import IntegrityConsole from '@/components/landing/IntegrityConsole';
import TeamSection from '@/components/landing/TeamSection';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="landing-page min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <FeatureGrid />
        <IntegrityConsole />
        <TeamSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}