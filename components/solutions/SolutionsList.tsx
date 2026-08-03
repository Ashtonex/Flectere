"use client";

import { Compass, Workflow, Cpu, TrendingUp, BarChart3, Sparkles } from "lucide-react";
import Container from "@/components/ui/Container";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Button from "@/components/ui/Button";
import { capabilities, type Capability } from "@/lib/content";

const ICONS: Record<Capability["icon"], React.ElementType> = {
  compass: Compass,
  workflow: Workflow,
  cpu: Cpu,
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  sparkles: Sparkles,
};

export default function SolutionsList() {
  return (
    <section className="relative bg-ink-950 py-8 md:py-12">
      <Container>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {capabilities.map((cap, i) => {
            const Icon = ICONS[cap.icon];
            return (
              <RevealOnScroll
                key={cap.key}
                className="grid grid-cols-1 gap-8 py-14 md:grid-cols-[auto_1fr] md:gap-12 md:py-16"
              >
                <div className="flex items-start gap-5 md:w-64">
                  <span className="font-display text-sm text-fog-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-bend-gradient-soft">
                      <Icon className="h-5 w-5 text-gold" strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-4 font-display text-2xl leading-tight text-fog-100">
                      {cap.title}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <p className="eyebrow mb-2 text-fog-500">The Problem</p>
                    <p className="text-sm leading-relaxed text-fog-400">{cap.problem}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-2 text-graphite-bright">What We Do</p>
                    <p className="text-sm leading-relaxed text-fog-400">{cap.whatWeDo}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-2 text-gold">The Outcome</p>
                    <p className="text-sm font-medium leading-relaxed text-gradient">
                      {cap.outcome}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>

        <RevealOnScroll className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="max-w-md text-fog-400">
            Not sure which capability matches your constraint?
          </p>
          <Button href="/diagnostic" size="lg">
            Find Out With the Diagnostic
          </Button>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
