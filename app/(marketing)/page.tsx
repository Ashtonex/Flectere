import Hero from "@/components/home/Hero";
import LiveCommandBand from "@/components/home/LiveCommandBand";
import OrganogramSection from "@/components/home/OrganogramSection";
import ProblemSection from "@/components/home/ProblemSection";
import MethodScroller from "@/components/method/MethodScroller";
import CapabilitiesSection from "@/components/home/CapabilitiesSection";
import ProductArmsSection from "@/components/products/ProductArmsSection";
import ScoreTeaser from "@/components/home/ScoreTeaser";
import BeforeAfter from "@/components/home/BeforeAfter";
import TrustSection from "@/components/home/TrustSection";
import InsightsPreview from "@/components/home/InsightsPreview";
import FinalCTA from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LiveCommandBand />
      <OrganogramSection />
      <ProblemSection />
      <MethodScroller />
      <CapabilitiesSection />
      <ProductArmsSection compact />
      <ScoreTeaser />
      <BeforeAfter />
      <TrustSection />
      <InsightsPreview />
      <FinalCTA />
    </>
  );
}
