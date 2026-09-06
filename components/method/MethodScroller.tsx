"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useInView, useMotionValueEvent, useScroll } from "framer-motion";
import Container from "@/components/ui/Container";
import useWebGLSupported from "@/components/visuals/useWebGLSupported";
import { methodSteps, mottos } from "@/lib/content";
import { cn } from "@/lib/utils";

const MethodScene = dynamic(() => import("@/components/visuals/MethodScene"), {
  ssr: false,
});

export default function MethodScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { margin: "150px" });
  const progressRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const webglOk = useWebGLSupported();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
    const idx = Math.min(methodSteps.length - 1, Math.floor(v * methodSteps.length));
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  });

  return (
    <section ref={containerRef} className="relative h-[200vh] bg-ink-950">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 opacity-80">
          {webglOk && <MethodScene progressRef={progressRef} inView={inView} />}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/10 to-ink-950" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.08]" />

        <Container className="relative z-10 flex h-full flex-col justify-center pt-16">
          <p className="eyebrow mb-2">The Flectēre Method</p>
          <p className="mb-6 font-display text-base italic tracking-wide text-graphite-bright">
            {mottos[0].latin} — {mottos[0].translation}
          </p>

          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              {methodSteps.map((step, i) => (
                <span
                  key={step.key}
                  className={cn(
                    "block transition-colors duration-700",
                    i === activeIndex ? "text-fog-100" : "text-fog-600/30"
                  )}
                >
                  {step.title}
                  {i < methodSteps.length - 1 ? "." : "."}
                </span>
              ))}
            </h2>

            <div>
              {methodSteps.map((step, i) => {
                const active = i === activeIndex;
                return (
                  <div key={step.key} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 transition-all duration-500",
                          active
                            ? "border-gold bg-gold shadow-[0_0_18px_3px_rgba(198,161,89,0.55)]"
                            : i < activeIndex
                            ? "border-graphite bg-graphite/70"
                            : "border-white/20 bg-transparent"
                        )}
                      />
                      {i < methodSteps.length - 1 && (
                        <span
                          className={cn(
                            "w-px flex-1 transition-colors duration-500",
                            i < activeIndex
                              ? "bg-gradient-to-b from-gold to-graphite"
                              : "bg-white/10"
                          )}
                          style={{ minHeight: active ? 96 : 28 }}
                        />
                      )}
                    </div>

                    <div
                      className={cn(
                        "pb-7 transition-opacity duration-500",
                        active ? "opacity-100" : "opacity-35"
                      )}
                    >
                      <p className="text-xs font-semibold tracking-widest2 text-gold">
                        {step.number}
                      </p>
                      <h3 className="mt-1.5 font-display text-xl text-fog-100 sm:text-2xl">
                        {step.title}{" "}
                        <span className="font-sans text-base font-normal text-fog-400">
                          — {step.tagline}
                        </span>
                      </h3>

                      {active && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="mt-3 max-w-md text-sm leading-relaxed text-fog-400">
                            {step.description}
                          </p>
                          <ul className="mt-3 space-y-1.5">
                            {step.details.map((d) => (
                              <li
                                key={d}
                                className="flex items-start gap-2 text-sm text-fog-500"
                              >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
