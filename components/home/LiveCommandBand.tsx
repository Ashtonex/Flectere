"use client";

import { useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { Activity, CircleDollarSign, FileStack, Network, Radar, Workflow } from "lucide-react";
import Container from "@/components/ui/Container";

const STREAMS = [
  { label: "Client Signal", value: "Captured", icon: Activity },
  { label: "Revenue Line", value: "Tracked", icon: CircleDollarSign },
  { label: "Documents", value: "Indexed", icon: FileStack },
  { label: "Workflow", value: "Routed", icon: Workflow },
  { label: "Sector Arms", value: "Connected", icon: Network },
  { label: "Risk", value: "Early", icon: Radar },
];

export default function LiveCommandBand() {
  const [active, setActive] = useState(0);
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 26 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 26 });
  const spotlight = useMotionTemplate`radial-gradient(circle at ${smoothX}% ${smoothY}%, rgba(198,161,89,0.18), rgba(255,255,255,0.035) 14rem, transparent 30rem)`;

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-ink-950 py-10 md:py-14">
      <Container>
        <motion.div
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            mouseX.set(((event.clientX - rect.left) / rect.width) * 100);
            mouseY.set(((event.clientY - rect.top) / rect.height) * 100);
          }}
          className="alive-panel premium-panel rounded-xl p-4 md:p-5"
        >
          <motion.div className="absolute inset-0" style={{ background: spotlight }} />
          <div className="relative z-10 grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div className="border-b border-white/10 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
              <p className="eyebrow text-gold">Live Operating Taste</p>
              <h2 className="mt-3 max-w-md font-display text-2xl font-semibold leading-tight text-engraved md:text-3xl">
                Every movement becomes a signal.
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STREAMS.map((stream, index) => {
                const Icon = stream.icon;
                const selected = active === index;
                return (
                  <motion.button
                    key={stream.label}
                    type="button"
                    onPointerEnter={() => setActive(index)}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative min-h-28 overflow-hidden rounded-lg border border-white/10 bg-ink-950/62 p-4 text-left transition-colors hover:border-gold/35"
                  >
                    <motion.span
                      className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                      animate={{ opacity: selected ? 1 : 0.18, scaleX: selected ? 1 : 0.42 }}
                      transition={{ duration: 0.45 }}
                    />
                    <Icon className="h-5 w-5 text-gold" strokeWidth={1.7} />
                    <p className="mt-5 text-sm font-medium text-fog-100">{stream.label}</p>
                    <motion.p
                      animate={{ opacity: selected ? 1 : 0.55, x: selected ? 4 : 0 }}
                      className="mt-1 text-xs uppercase tracking-widest2 text-fog-500"
                    >
                      {stream.value}
                    </motion.p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
