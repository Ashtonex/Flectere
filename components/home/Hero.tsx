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
