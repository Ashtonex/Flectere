"use client";

import dynamic from "next/dynamic";
import {
  BadgeDollarSign,
  Banknote,
  Building2,
  Factory,
  GraduationCap,
  HeartPulse,
  Pickaxe,
  ShieldCheck,
  ShoppingBasket,
  Truck,
  Wheat,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Button from "@/components/ui/Button";
import { productArms, type ProductArm } from "@/lib/content";
import { cn } from "@/lib/utils";

const ProductConstellationScene = dynamic(
  () => import("@/components/visuals/ProductConstellationScene"),
  { ssr: false }
);

const ICONS: Record<ProductArm["key"], LucideIcon> = {
  shield: ShieldCheck,
  cuniculus: Pickaxe,
  cropus: Wheat,
  vectura: Truck,
  fabrica: Factory,
  potentia: Zap,
  salus: HeartPulse,
  doctrina: GraduationCap,
  stirps: ShoppingBasket,
  aedificium: Building2,
  argentaria: Banknote,
};

export default function ProductArmsSection({
  compact = false,
}: {
  compact?: boolean;
}) {
  const items = compact ? productArms.slice(0, 6) : productArms;
  const { scrollYProgress } = useScroll();
  const drift = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-ink-950 py-24 md:py-32">
      <motion.div
        style={{ y: drift }}
        className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] opacity-70"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(198,161,89,0.16),transparent_34rem)]" />
        <ProductConstellationScene />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#05070A_0%,rgba(5,7,10,0.62)_22%,#05070A_72%)]" />

      <Container className="relative" >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div id="portfolio" className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Flectēre Products"
              title="Built to answer expensive problems."
              description="Each platform is a controlled operating system for one sector. The public layer shows enough to understand the intent; the deeper workflows stay private."
              className="max-w-xl"
            />

            <div className="mt-10 premium-panel rounded-xl p-6">
              <div className="relative z-10 flex items-center gap-4">
                <div className="sigil-ring flex h-16 w-16 items-center justify-center rounded-full">
                  <BadgeDollarSign className="h-7 w-7 text-gold" strokeWidth={1.55} />
                </div>
                <div>
                  <p className="eyebrow text-gold">Private Infrastructure</p>
                  <p className="mt-1 text-sm leading-6 text-fog-300">
                    One command layer sits beneath the portfolio: capital discipline,
                    client control, billing, records, workflow, and intelligence.
                  </p>
                </div>
              </div>
            </div>

            {compact && (
              <Button href="/products" variant="secondary" className="mt-8">
                View the portfolio
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {items.map((arm, index) => {
              const Icon = ICONS[arm.key];

              return (
                <RevealOnScroll key={arm.key} delay={(index % 4) * 0.045}>
                  <motion.article
                    whileHover={{ y: -4, scale: 1.008 }}
                    transition={{ type: "spring", stiffness: 240, damping: 24 }}
                    className="premium-panel group rounded-xl p-5 md:p-6"
                  >
                    <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:items-start">
                      <div className="flex items-center gap-4 md:block">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-gold/25 bg-ink-950/80 shadow-[0_0_34px_rgba(198,161,89,0.13)]">
                          <Icon className="h-6 w-6 text-gold" strokeWidth={1.6} />
                        </div>
                        <span className="font-display text-sm text-fog-600 md:mt-5 md:block">
                          {String(arm.rank).padStart(2, "0")}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-2xl font-semibold leading-tight text-engraved md:text-3xl">
                            {arm.productName}
                          </h3>
                          <span
                            className={cn(
                              "rounded-md border px-2 py-1 text-[10px] uppercase tracking-widest2",
                              arm.status === "Priority"
                                ? "border-gold/40 bg-gold/10 text-gold"
                                : "border-white/10 bg-white/[0.02] text-fog-500"
                            )}
                          >
                            {arm.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-widest2 text-fog-500">
                          {arm.sector}
                        </p>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-fog-400">
                          {arm.positioning}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {arm.aiOpportunities.slice(0, 2).map((item) => (
                            <span
                              key={item}
                              className="rounded-md border border-white/10 bg-ink-950/50 px-2.5 py-1 text-xs text-fog-300"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>

        {!compact && <PortfolioArchitecture />}
      </Container>
    </section>
  );
}

function PortfolioArchitecture() {
  return (
    <RevealOnScroll className="mt-16 premium-panel rounded-xl p-6 md:p-8">
      <div className="relative z-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[0.85fr_1.15fr] md:items-center">
          <div>
            <p className="eyebrow text-gold">Control Layer</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-engraved md:text-3xl">
              The portfolio is visible. The machinery is private.
            </h2>
          </div>
          <p className="text-sm leading-7 text-fog-300">
            Every platform is built to remove costly operational uncertainty in its sector.
            Flectēre stays behind the glass as the capital, governance, client, billing,
            workflow, and intelligence layer.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {["Capital", "Workflow", "Intelligence"].map((signal) => (
            <div key={signal} className="rounded-lg border border-white/10 bg-ink-950/55 p-5">
              <p className="text-xs uppercase tracking-widest2 text-gold">{signal}</p>
              <p className="mt-3 text-sm leading-6 text-fog-500">
                Controlled inside Flectēre Core.
              </p>
            </div>
          ))}
        </div>
      </div>
    </RevealOnScroll>
  );
}
