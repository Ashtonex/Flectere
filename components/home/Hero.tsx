"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import HeroFallback from "@/components/visuals/HeroFallback";
import useWebGLSupported from "@/components/visuals/useWebGLSupported";

const HeroScene = dynamic(() => import("@/components/visuals/HeroScene"), {
  ssr: false,
});

export default function Hero() {
  const webglOk = useWebGLSupported();

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink-950 pt-20">
      <div className="absolute inset-0 bg-grid opacity-[0.12]" />
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="absolute inset-0">
        {webglOk ? <HeroScene /> : <HeroFallback />}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/70" />

      <Container className="relative z-10">
        <div className="grid min-h-[calc(100svh-5rem)] items-center gap-12 py-20 lg:grid-cols-[1fr_24rem]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="eyebrow mb-6"
            >
              Business Transformation, Engineered
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.3, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
              className="max-w-4xl font-display text-5xl leading-[1.05] tracking-tight text-fog-100 sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Bend before
              <br />
              <span className="text-gradient">you break.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.55, ease: [0.19, 1, 0.22, 1] }}
              className="mt-8 max-w-xl text-lg leading-relaxed text-fog-300 sm:text-xl"
            >
              Flectēre helps ambitious companies redesign strategy, operations,
              technology, and growth systems so they can adapt faster than the
              market changes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.85, ease: [0.19, 1, 0.22, 1] }}
              className="mt-11 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Button href="/diagnostic" size="lg">
                Start the Diagnostic
              </Button>
              <Button href="/method" variant="secondary" size="lg">
                Explore the Method
              </Button>
            </motion.div>
          </div>

          <motion.div
            whileHover={{ y: -8, rotateX: 2, rotateY: -4 }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            className="perspective-shell"
          >
            <CommandSignal />
          </motion.div>
        </div>
      </Container>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-fog-500 sm:flex"
      >
        <span className="text-[10px] uppercase tracking-widest2">Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-fog-500 to-transparent" />
      </motion.div>
    </section>
  );
}

function CommandSignal() {
  const rows = [
    ["Constraint", "Mapped", "94%"],
    ["Revenue", "Tracked", "Live"],
    ["Workflow", "Locked", "11 arms"],
    ["Risk", "Flagged", "Early"],
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, x: 28, rotateY: -10 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 1.25, delay: 1.05, ease: [0.19, 1, 0.22, 1] }}
      className="alive-panel premium-panel hidden rounded-xl p-4 lg:block"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <p className="eyebrow text-gold">Command Layer</p>
          <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_22px_rgba(198,161,89,0.8)]" />
        </div>
        <div className="mt-4 space-y-3">
          {rows.map(([label, status, value], index) => (
            <motion.div
              key={label}
              animate={{ opacity: [0.62, 1, 0.62], x: [0, 4, 0] }}
              transition={{ duration: 3.4, delay: index * 0.35, repeat: Infinity }}
              className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-ink-950/55 p-3"
            >
              <div>
                <p className="text-sm font-medium text-fog-200">{label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest2 text-fog-500">{status}</p>
              </div>
              <p className="font-display text-sm text-gold">{value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
