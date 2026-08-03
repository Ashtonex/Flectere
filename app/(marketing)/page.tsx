import Hero from "@/components/home/Hero";
import ProblemSection from "@/components/home/ProblemSection";
import MethodScroller from "@/components/method/MethodScroller";
import CapabilitiesSection from "@/components/home/CapabilitiesSection";
import ScoreTeaser from "@/components/home/ScoreTeaser";
import BeforeAfter from "@/components/home/BeforeAfter";
import TrustSection from "@/components/home/TrustSection";
import InsightsPreview from "@/components/home/InsightsPreview";
import FinalCTA from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <MethodScroller />
      <CapabilitiesSection />
      <ScoreTeaser />
      <BeforeAfter />
      <TrustSection />
      <InsightsPreview />
      <FinalCTA />
    </>
  );
}
