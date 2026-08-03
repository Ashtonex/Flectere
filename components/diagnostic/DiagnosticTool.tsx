"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { questions } from "@/lib/diagnosticData";
import { computeResult, type Answers } from "@/lib/scoring";
import ScoreResult from "./ScoreResult";
import Container from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { mottos } from "@/lib/content";

export default function DiagnosticTool() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState(1);
  const [locked, setLocked] = useState(false);

  const total = questions.length;
  const current = questions[index];

  const result = useMemo(() => (done ? computeResult(answers) : null), [done, answers]);

  // The outgoing question stays mounted (with its old onClick closures) for
  // the duration of its exit transition, so options must be locked out the
  // moment one is picked and only unlocked once the next question is live.
  useEffect(() => {
    setLocked(false);
  }, [current.id]);

  function selectOption(value: string | number) {
    if (locked) return;
    setLocked(true);

    const nextAnswers = { ...answers, [current.id]: value };
    setAnswers(nextAnswers);

    window.setTimeout(() => {
      if (index < total - 1) {
        setDirection(1);
        setIndex((i) => i + 1);
      } else {
        setDone(true);
      }
    }, 260);
  }

  function goBack() {
    if (index === 0 || locked) return;
    setDirection(-1);
    setIndex((i) => i - 1);
  }

  function restart() {
    setAnswers({});
    setIndex(0);
    setDone(false);
  }

  if (done && result) {
    return <ScoreResult result={result} onRestart={restart} />;
  }

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-ink-950 pt-32 pb-20">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" />

      <Container className="relative max-w-2xl">
        {index === 0 && (
          <p className="mb-8 text-center font-display text-base italic tracking-wide text-graphite-bright">
            {mottos[2].latin} — {mottos[2].translation}
          </p>
        )}

        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={index === 0 || locked}
            className="flex items-center gap-1.5 text-sm text-fog-500 transition-colors hover:text-fog-200 disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xs uppercase tracking-widest2 text-fog-500">
            Question {index + 1} of {total}
          </span>
        </div>

        <div className="mb-12 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-bend-gradient"
            initial={false}
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* No `mode="wait"`: the next question mounts immediately instead of
            waiting on the outgoing one's exit-animation callback, so quiz
            progress never depends on an animation frame actually firing. */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-display text-2xl leading-tight text-fog-100 sm:text-3xl">
              {current.question}
            </h2>

            <div
              className={cn(
                "mt-8 space-y-3 transition-opacity duration-200",
                locked && "pointer-events-none opacity-60"
              )}
            >
              {current.options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => selectOption(option.value)}
                  className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left transition-all duration-200 hover:border-gold/40 hover:bg-white/[0.05]"
                >
                  <span className="text-sm text-fog-200 group-hover:text-fog-100 sm:text-base">
                    {option.label}
                  </span>
                  <span className="ml-4 h-3 w-3 shrink-0 rounded-full border border-white/20 transition-colors group-hover:border-gold" />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
}
