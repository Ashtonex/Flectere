"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function BendDivider({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <div className={cn("pointer-events-none w-full", className)}>
      <svg
        viewBox="0 0 1200 80"
        fill="none"
        preserveAspectRatio="none"
        className={cn("h-16 w-full", flip && "-scale-y-100")}
      >
        <defs>
          <linearGradient id="bend-line-gradient" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3C3F45" stopOpacity="0" />
            <stop offset="15%" stopColor="#3C3F45" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#C6A159" stopOpacity="0.9" />
            <stop offset="90%" stopColor="#E8D4A0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#E8D4A0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,20 C 150,70 250,70 350,40 C 480,0 550,10 650,40 C 780,80 900,10 1050,30 C 1120,40 1160,25 1200,40"
          stroke="url(#bend-line-gradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </div>
  );
}
