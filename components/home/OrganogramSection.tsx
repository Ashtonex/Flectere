"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useInView, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import Container from "@/components/ui/Container";
import useWebGLSupported from "@/components/visuals/useWebGLSupported";
import { cn } from "@/lib/utils";

const CoreOrganogramScene = dynamic(
  () => import("@/components/visuals/CoreOrganogramScene"),
  { ssr: false }
);

const LAYERS = [
  {
    key: "core",
    label: "Core",
    title: "Control, capital, workflow, intelligence.",
    body:
      "One operating center keeps the portfolio coherent while every sector can move independently.",
    signals: ["1 control layer", "Private command room", "Systems compound"],
  },
  {
    key: "arms",
    label: "Arms",
    title: "Sector businesses orbit the same operating system.",
    body:
      "Each arm enters a market with reusable intelligence, shared infrastructure, and a sharper path to execution.",
    signals: ["11 sector arms", "Reusable systems", "Faster market entry"],
  },
  {
    key: "users",
    label: "Users",
    title: "Markets stay scattered. The system finds the pattern.",
    body:
      "Customers, teams, partners, and operators remain distinct while Flectere reads the relationships between them.",
    signals: ["Scattered demand", "Visible relationships", "Decision signals"],
  },
] as const;

export default function OrganogramSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { margin: "150px" });
  const progressRef = useRef(0);
  const [activeLayer, setActiveLayer] = useState(0);
  const selectedLayer = LAYERS[activeLayer];
  const webglOk = useWebGLSupported();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const panelY = useTransform(scrollYProgress, [0, 1], [60, -80]);
  const panelOpacity = useTransform(scrollYProgress, [0, 0.16, 0.82, 1], [0, 1, 1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    progressRef.current = value;
    const index = Math.min(LAYERS.length - 1, Math.floor(value * LAYERS.length));
    setActiveLayer((current) => (current === index ? current : index));
  });

  return (
    <section ref={containerRef} className="relative h-[260vh] bg-ink-950">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(198,161,89,0.18),transparent_34rem)]" />
        <div className="absolute inset-0 bg-grid opacity-[0.08]" />
        <div className="absolute inset-0">
          {webglOk ? (
            <CoreOrganogramScene activeLayer={activeLayer} progressRef={progressRef} inView={inView} />
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#05070A_0%,rgba(5,7,10,0.1)_42%,#05070A_100%)]" />

        <Container className="relative z-10 flex h-full items-center">
          <motion.div
            style={{ y: panelY, opacity: panelOpacity }}
            className="alive-panel max-w-md rounded-xl border border-white/10 bg-ink-950/62 p-5 backdrop-blur-xl md:p-6"
          >
            <motion.div
              key={selectedLayer.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="eyebrow text-gold">Operating Universe</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-engraved md:text-4xl">
              {selectedLayer.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-fog-400">
                {selectedLayer.body}
              </p>
            </motion.div>

            <div className="mt-6 flex gap-2">
              {LAYERS.map((layer, index) => (
                <button
                  key={layer.key}
                  type="button"
                  onClick={() => setActiveLayer(index)}
                  onPointerEnter={() => setActiveLayer(index)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-[10px] uppercase tracking-widest2 transition-colors",
                    activeLayer === index
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-white/10 bg-white/[0.02] text-fog-500"
                  )}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {selectedLayer.signals.map((signal, index) => (
                <motion.div
                  key={signal}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3"
                >
                  <span className="block text-[10px] uppercase tracking-widest2 text-fog-600">
                    Signal
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-5 text-fog-200">
                    {signal}
                  </span>
                </motion.div>
              ))}
            </div>

            {selectedLayer.key === "arms" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 overflow-hidden rounded-lg border border-gold/20 bg-gold/[0.06] p-4"
              >
                <div className="flex flex-wrap gap-2">
                  {["Insurance", "Mining", "Agriculture", "Logistics"].map((sector) => (
                    <span
                      key={sector}
                      className="rounded-md border border-gold/20 bg-ink-950/50 px-2.5 py-1 text-xs text-gold"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
