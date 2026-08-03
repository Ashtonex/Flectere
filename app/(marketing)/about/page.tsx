import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import FounderStory from "@/components/about/FounderStory";
import FinalCTA from "@/components/home/FinalCTA";
import { principles, credibilityPoints, mottos } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Flectēre is built on one belief: transformation only sticks when it's implemented inside the business. Learn how we work and why.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Flectēre"
        title={
          <>
            Built to help you{" "}
            <span className="text-gradient">bend before you break.</span>
          </>
        }
        description="Flectēre exists because most transformation work fails the same way: it ends at the slide deck. We're built to work inside the business until the system actually changes."
      />

      <FounderStory />

      <section className="relative border-t border-white/5 bg-ink-950 py-20 md:py-24">
        <Container className="max-w-3xl text-center">
          <RevealOnScroll>
            <p className="font-display text-2xl italic tracking-wide text-gradient sm:text-3xl">
              &ldquo;{mottos[1].latin}&rdquo;
            </p>
            <p className="mt-4 text-sm uppercase tracking-widest2 text-fog-500">
              {mottos[1].translation}
            </p>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-fog-500">
              A business that adapts on its own terms, before the market
              forces its hand — that&apos;s the idea underneath every engagement.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      <section className="relative border-t border-white/5 bg-ink-900 py-28 md:py-36">
        <Container>
          <SectionHeading eyebrow="How We Work" title="Four principles behind every engagement." />
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
            {principles.map((p, i) => (
              <RevealOnScroll
                key={p.title}
                delay={i * 0.08}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8"
              >
                <h3 className="font-display text-xl text-fog-100">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fog-500">{p.description}</p>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative border-t border-white/5 bg-ink-950 py-28 md:py-36">
        <Container className="max-w-3xl">
          <RevealOnScroll className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
            <div className="mb-5 flex items-center gap-2 text-gold">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
              <p className="eyebrow text-gold">Experience Across Industries</p>
            </div>
            <p className="text-base leading-relaxed text-fog-300">
              Flectēre works with founder-led and growth-stage companies
              across services, software, and operationally-heavy industries —
              anywhere a business has outgrown the systems it was built on.
              The method stays the same across sectors: find the real
              constraint, redesign around it, implement inside the business,
              and put in place the reporting and automation to keep it
              working.
            </p>
            <ul className="mt-6 space-y-3 border-t border-white/10 pt-6">
              {credibilityPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-fog-400">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {point}
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
