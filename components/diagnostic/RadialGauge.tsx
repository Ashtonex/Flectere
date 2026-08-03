"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function RadialGauge({
  score,
  size = 220,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const [display, setDisplay] = useState(0);
  const stroke = size * 0.07;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));

  useEffect(() => {
    let raf: number;
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * clamped));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3C3F45" />
            <stop offset="55%" stopColor="#C6A159" />
            <stop offset="100%" stopColor="#E8D4A0" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gauge-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-4xl text-fog-100">{display}</span>
        {label && (
          <span className="mt-1 text-[11px] uppercase tracking-widest2 text-fog-500">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
