import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import Button from "@/components/ui/Button";
import MethodScroller from "@/components/method/MethodScroller";
import MethodDetailGrid from "@/components/method/MethodDetailGrid";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Method",
  description:
    "Sense. Shape. Shift. Scale. — the four-stage method Flectēre uses to find the real constraint and reshape the business around it.",
};

export default function MethodPage() {
  return (
    <>
      <PageHero
        eyebrow="The Flectēre Method"
        title={
          <>
            Sense. Shape. Shift.{" "}
            <span className="text-gradient">Scale.</span>
          </>
        }
        description="A repeatable, four-stage method for finding the real constraint holding a business back — and reshaping strategy, systems, and teams around it."
      >
        <Button href="/diagnostic" size="lg">
          Start the Diagnostic
        </Button>
      </PageHero>
      <MethodScroller />
      <MethodDetailGrid />
      <FinalCTA />
    </>
  );
}
