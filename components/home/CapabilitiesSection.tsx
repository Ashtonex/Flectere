"use client";

import { Compass, Workflow, Cpu, TrendingUp, BarChart3, Sparkles, type LucideIcon } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Button from "@/components/ui/Button";
import { capabilities, type Capability } from "@/lib/content";

const ICONS: Record<Capability["icon"], LucideIcon> = {
  compass: Compass,
  workflow: Workflow,
  cpu: Cpu,
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  sparkles: Sparkles,
};

export default function CapabilitiesSection() {
  return (
    <section className="relative border-t border-white/5 bg-ink-950 py-28 md:py-36">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Capabilities"
            title="Six ways we help you reshape the business."
            description="Not a services menu — a set of outcomes. Each capability solves a specific constraint, end to end."
            className="max-w-2xl"
          />
          <Button href="/solutions" variant="secondary" className="shrink-0">
            View all solutions
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap, i) => {
            const Icon = ICONS[cap.icon];
            return (
              <RevealOnScroll
                key={cap.key}
                delay={(i % 3) * 0.08}
                className="alive-panel premium-panel group flex flex-col rounded-xl p-7 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-bend-gradient-soft">
                  <Icon className="h-5 w-5 text-gold" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-display text-xl text-fog-100">
                  {cap.title}
                </h3>

                <div className="mt-4 space-y-3 text-sm leading-relaxed">
                  <p className="text-fog-500">
                    <span className="font-medium text-fog-400">Problem — </span>
                    {cap.problem}
                  </p>
                  <p className="text-fog-500">
                    <span className="font-medium text-fog-400">We do — </span>
                    {cap.whatWeDo}
                  </p>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-sm font-medium text-gradient">
                    {cap.outcome}
                  </p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
