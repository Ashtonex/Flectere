"use client";

import { motion } from "framer-motion";
import { RotateCcw, TrendingUp, TrendingDown, Target } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import RadialGauge from "./RadialGauge";
import type { DiagnosticResult } from "@/lib/scoring";

function scoreVerdict(score: number) {
  if (score >= 80) return "Highly Adaptive";
  if (score >= 60) return "Flexible, With Gaps";
  if (score >= 40) return "Rigid in Key Areas";
  return "Structurally Brittle";
}

export default function ScoreResult({
  result,
  onRestart,
}: {
  result: DiagnosticResult;
  onRestart: () => void;
}) {
  const contactHref = `/contact?source=diagnostic&score=${result.score}&focus=${encodeURIComponent(
    result.weakest.label
  )}`;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-ink-950 pt-32 pb-24">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <Container className="relative max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="eyebrow mb-4">Your Result</p>
          <h1 className="font-display text-3xl text-fog-100 sm:text-4xl">
            Business Flexibility Score
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col items-center"
        >
          <RadialGauge score={result.score} size={240} label={scoreVerdict(result.score)} />
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gold/25 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 text-gold">
              <TrendingUp className="h-4 w-4" />
              <p className="eyebrow text-gold">Strongest Area</p>
            </div>
            <p className="mt-3 font-display text-xl text-fog-100">
              {result.strongest.label}
            </p>
            <p className="mt-1 text-sm text-fog-500">Score: {result.strongest.score}/100</p>
          </div>
          <div className="rounded-2xl border border-graphite/40 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 text-graphite-bright">
              <TrendingDown className="h-4 w-4" />
              <p className="eyebrow text-graphite-bright">Weakest Area</p>
            </div>
            <p className="mt-3 font-display text-xl text-fog-100">
              {result.weakest.label}
            </p>
            <p className="mt-1 text-sm text-fog-500">Score: {result.weakest.score}/100</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <p className="eyebrow mb-5 text-fog-500">Full Breakdown</p>
          <div className="space-y-4">
            {result.dimensionScores.map((d) => (
              <div key={d.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-fog-300">{d.label}</span>
                  <span className="text-fog-500">{d.score}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full bg-bend-gradient"
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.05] p-6 md:p-8">
          <div className="flex items-center gap-2 text-gold">
            <Target className="h-4 w-4" />
            <p className="eyebrow text-gold">Recommended Next Step</p>
          </div>
          <p className="mt-3 text-base leading-relaxed text-fog-200">
            {result.recommendation}
          </p>
          {(result.statedConstraintLabel || result.stated90DayLabel) && (
            <p className="mt-4 text-sm leading-relaxed text-fog-500">
              You told us your biggest constraint is{" "}
              <span className="text-fog-300">{result.statedConstraintLabel}</span>
              {result.stated90DayLabel && (
                <>
                  , and you&apos;d fix{" "}
                  <span className="text-fog-300">{result.stated90DayLabel}</span> first.
                </>
              )}
            </p>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <Button href={contactHref} size="lg">
            Book My Flectēre Diagnostic Call
          </Button>
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 text-sm text-fog-500 transition-colors hover:text-fog-200"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retake the diagnostic
          </button>
        </div>
      </Container>
    </section>
  );
}
