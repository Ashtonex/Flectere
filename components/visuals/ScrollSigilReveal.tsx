"use client";

import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export default function ScrollSigilReveal() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.4 });
  const x = useTransform(smooth, [0, 0.18, 0.52, 1], ["42%", "18%", "28%", "8%"]);
  const y = useTransform(smooth, [0, 0.18, 0.52, 1], ["-30vh", "-8vh", "18vh", "36vh"]);
  const rotate = useTransform(smooth, [0, 1], [-18, 42]);
  const opacity = useTransform(smooth, [0, 0.08, 0.86, 1], [0, 0.42, 0.3, 0.12]);
  const scale = useTransform(smooth, [0, 0.42, 1], [0.92, 1.12, 0.98]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed right-[-18rem] top-1/2 z-[2] hidden h-[38rem] w-[38rem] -translate-y-1/2 lg:block"
      style={{ x, y, rotate, opacity, scale }}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(198,161,89,0.16),transparent_62%)] blur-2xl" />
      <Image
        src="/brand/flectere-seal.png"
        alt=""
        fill
        sizes="608px"
        className="object-contain drop-shadow-[0_0_70px_rgba(198,161,89,0.22)]"
        priority
      />
    </motion.div>
  );
}
