"use client";

import { Compass, Workflow, Cpu, TrendingUp, BarChart3, Sparkles, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
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
                className="group relative grid grid-cols-1 gap-8 overflow-hidden py-14 md:grid-cols-[auto_1fr] md:gap-12 md:py-16"
              >
                <motion.div
                  className="absolute inset-y-6 left-0 hidden w-px bg-gradient-to-b from-transparent via-gold/60 to-transparent md:block"
                  initial={{ scaleY: 0, opacity: 0 }}
                  whileInView={{ scaleY: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-20% 0px" }}
                  transition={{ duration: 1.1, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                />
                <div className="flex items-start gap-5 md:w-64">
                  <span className="font-display text-sm text-fog-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.06 }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-bend-gradient-soft shadow-[0_0_34px_rgba(198,161,89,0.08)]"
                    >
                      <Icon className="h-5 w-5 text-gold" strokeWidth={1.75} />
                    </motion.div>
                    <h3 className="mt-4 font-display text-2xl leading-tight text-fog-100">
                      {cap.title}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="alive-panel rounded-lg border border-white/10 bg-white/[0.015] p-4 transition-colors duration-300 group-hover:border-gold/25">
                    <p className="eyebrow mb-2 text-fog-500">The Problem</p>
                    <p className="text-sm leading-relaxed text-fog-400">{cap.problem}</p>
                  </div>
                  <div className="alive-panel rounded-lg border border-white/10 bg-white/[0.015] p-4 transition-colors duration-300 group-hover:border-graphite-bright/20">
                    <p className="eyebrow mb-2 text-graphite-bright">What We Do</p>
                    <p className="text-sm leading-relaxed text-fog-400">{cap.whatWeDo}</p>
                  </div>
                  <div className="alive-panel rounded-lg border border-white/10 bg-white/[0.015] p-4 transition-colors duration-300 group-hover:border-gold/30">
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
