"use client";

import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

const SIGNALS = ["FLECTERE", "CAPITAL", "CRM", "BILLING", "WORKFLOW", "INTEL", "PORTFOLIO"];

export default function SiteAura() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(34);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 28, mass: 0.4 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 28, mass: 0.4 });
  const glow = useMotionTemplate`radial-gradient(circle at ${smoothX}% ${smoothY}%, rgba(198,161,89,0.18), rgba(155,161,168,0.06) 18rem, transparent 38rem)`;

  useEffect(() => {
    setMounted(true);
    const onMove = (event: PointerEvent) => {
      mouseX.set((event.clientX / window.innerWidth) * 100);
      mouseY.set((event.clientY / window.innerHeight) * 100);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div className="absolute inset-0 opacity-80" style={{ background: glow }} />
      <div className="living-grid absolute inset-0 opacity-[0.18]" />
      <div className="scanline-field absolute inset-x-0 top-0 h-80 opacity-50" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        className="absolute -right-28 top-[18svh] h-[28rem] w-[28rem] rounded-full border border-gold/10"
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gold/60 shadow-[0_0_28px_rgba(198,161,89,0.75)]" />
        <span className="absolute bottom-16 left-9 h-px w-24 rotate-45 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </motion.div>

      <div className="absolute bottom-10 left-4 hidden w-[min(56rem,70vw)] overflow-hidden border-y border-white/10 py-2 md:block">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-8 text-[10px] uppercase tracking-widest2 text-fog-500"
        >
          {[...SIGNALS, ...SIGNALS].map((signal, index) => (
            <span key={`${signal}-${index}`} className="flex items-center gap-3">
              <i className="h-1 w-1 rounded-full bg-gold/70" />
              {signal}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
