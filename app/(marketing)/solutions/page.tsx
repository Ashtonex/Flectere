import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import SolutionsList from "@/components/solutions/SolutionsList";
import ProductArmsSection from "@/components/products/ProductArmsSection";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Six ways Flectēre helps you reshape the business — strategy, operations, AI & automation, growth, data, and brand. Each mapped to a real problem and outcome.",
};

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title={
          <>
            Six outcomes.{" "}
            <span className="text-gradient">One reshaped business.</span>
          </>
        }
        description="Not a services menu — a set of outcomes. Each capability solves a specific constraint, end to end, from diagnosis to implementation."
      />
      <SolutionsList />
      <ProductArmsSection compact />
      <FinalCTA />
    </>
  );
}
