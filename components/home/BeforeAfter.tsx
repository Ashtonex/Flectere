"use client";

import { Check, X } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import BendDivider from "@/components/visuals/BendDivider";
import { beforeAfter } from "@/lib/content";

export default function BeforeAfter() {
  return (
    <section className="relative border-t border-white/5 bg-ink-950 py-28 md:py-36">
      <Container>
        <SectionHeading
          eyebrow="The Transformation"
          title="The same business. A completely different system."
          align="center"
        />

        <div className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RevealOnScroll className="alive-panel rounded-xl border border-white/10 bg-white/[0.015] p-8 transition-all duration-500 hover:border-fog-500/30 md:p-10">
            <p className="eyebrow mb-6 text-fog-500">Before Flectēre</p>
            <ul className="space-y-4">
              {beforeAfter.before.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-fog-600" strokeWidth={2} />
                  <span className="text-sm leading-relaxed text-fog-500 sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </RevealOnScroll>

          <RevealOnScroll
            delay={0.12}
            className="alive-panel premium-panel rounded-xl border-gold/25 bg-bend-gradient-soft p-8 md:p-10"
          >
            <p className="eyebrow mb-6">After Flectēre</p>
            <ul className="space-y-4">
              {beforeAfter.after.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={2} />
                  <span className="text-sm leading-relaxed text-fog-100 sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        </div>

        <BendDivider className="mt-16" />
      </Container>
    </section>
  );
}
