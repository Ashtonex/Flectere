"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const ProductConstellationScene = dynamic(
  () => import("@/components/visuals/ProductConstellationScene"),
  { ssr: false }
);

export default function ProductHero() {
  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden border-b border-white/5 bg-ink-950 pt-24">
      <div className="absolute inset-0 bg-grid opacity-[0.11]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_38%,rgba(198,161,89,0.22),transparent_31rem)]" />
      <div className="absolute inset-y-0 right-[-18%] w-[82%] opacity-95">
        <ProductConstellationScene />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#05070A_0%,rgba(5,7,10,0.92)_35%,rgba(5,7,10,0.42)_68%,#05070A_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink-950 to-transparent" />

      <Container className="relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_21rem]">
          <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="eyebrow mb-6"
          >
            Flectēre Portfolio
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl font-display text-4xl font-semibold leading-[1.02] text-engraved sm:text-5xl md:text-6xl"
          >
            Sector platforms for serious operators.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 max-w-xl text-base leading-8 text-fog-300 sm:text-lg"
          >
            A private group of operational systems for industries where
            control, speed, risk, and margin decide who survives.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.68, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Button href="/contact" size="lg">
              Request Access
            </Button>
            <Button href="#portfolio" variant="secondary" size="lg">
              View Platforms
            </Button>
          </motion.div>
        </div>

          <motion.div
            initial={{ opacity: 0, x: 28, rotateY: -8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1.05, delay: 0.78, ease: [0.16, 1, 0.3, 1] }}
            className="alive-panel premium-panel hidden rounded-xl p-4 lg:block"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <p className="eyebrow text-gold">Portfolio Access</p>
                <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] uppercase tracking-widest2 text-gold">
                  Private
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {["11 sector arms", "central CRM", "billing spine", "capital control"].map(
                  (item, index) => (
                    <motion.div
                      key={item}
                      animate={{ x: [0, 3, 0], opacity: [0.68, 1, 0.68] }}
                      transition={{
                        duration: 3.2,
                        delay: index * 0.28,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-950/60 px-3 py-3"
                    >
                      <span className="text-sm text-fog-300">{item}</span>
                      <i className="h-1.5 w-1.5 rounded-full bg-gold/80 shadow-[0_0_18px_rgba(198,161,89,0.65)]" />
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
