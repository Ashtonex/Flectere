"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const SIGNALS = ["FLECTERE", "CAPITAL", "CRM", "BILLING", "WORKFLOW", "INTEL", "PORTFOLIO"];

export default function SiteAura() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const smoothX = useSpring(mouseX, { stiffness: 240, damping: 32, mass: 0.1 });
  const smoothY = useSpring(mouseY, { stiffness: 240, damping: 32, mass: 0.1 });

  useEffect(() => {
    setMounted(true);
    const onMove = (event: PointerEvent) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 100% GPU-composited cursor spotlight */}
      <motion.div
        style={{ x: smoothX, y: smoothY, willChange: "transform" }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(198,161,89,0.14)_0%,rgba(155,161,168,0.04)_42%,transparent_70%)]"
      />

      {/* GPU-accelerated drifting grid */}
      <div className="living-grid opacity-[0.16]" />
      <div className="scanline-field absolute inset-x-0 top-0 h-80 opacity-40" />

      {/* Orbiting celestial brass ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
        className="absolute -right-28 top-[18svh] h-[28rem] w-[28rem] rounded-full border border-gold/10"
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gold/60 shadow-[0_0_24px_rgba(198,161,89,0.8)]" />
        <span className="absolute bottom-16 left-9 h-px w-24 rotate-45 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </motion.div>

      {/* Bottom signals marquee ticker */}
      <div className="absolute bottom-10 left-4 hidden w-[min(56rem,70vw)] overflow-hidden border-y border-white/10 py-2 md:block">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ willChange: "transform" }}
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
