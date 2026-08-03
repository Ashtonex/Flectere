"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { problems } from "@/lib/content";

export default function ProblemSection() {
  return (
    <section className="relative border-t border-white/5 bg-ink-950 py-28 md:py-36">
      <Container>
        <SectionHeading
          eyebrow="The Real Problem"
          title="Most businesses don't fail from lack of effort."
          description="They fail because their systems stop fitting the market. Growth exposes the cracks that used to be invisible."
        />

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, i) => (
            <RevealOnScroll
              key={problem.title}
              delay={i * 0.05}
              className="group relative bg-ink-900 p-8 transition-colors duration-300 hover:bg-ink-800"
            >
              <AlertTriangle
                className="h-5 w-5 text-gold transition-transform duration-300 group-hover:-translate-y-0.5"
                strokeWidth={1.75}
              />
              <h3 className="mt-5 font-display text-lg text-fog-100">
                {problem.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-fog-500">
                {problem.description}
              </p>
            </RevealOnScroll>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 max-w-2xl text-lg leading-relaxed text-fog-300"
        >
          None of this is a motivation problem. It&apos;s a{" "}
          <span className="text-gradient font-medium">design</span> problem —
          and design problems need to be reshaped, not pushed through.
        </motion.p>
      </Container>
    </section>
  );
}
