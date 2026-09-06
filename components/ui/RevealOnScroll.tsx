"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RevealOnScroll({
  children,
  className,
  delay = 0,
  y = 30,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(10px)", scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      viewport={{ once, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 1.15, delay, ease: [0.19, 1, 0.22, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
