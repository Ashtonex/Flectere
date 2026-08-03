import { Gauge, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import RadialGauge from "@/components/diagnostic/RadialGauge";

export default function ScoreTeaser() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-ink-900 py-28 md:py-36">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <Container className="relative grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <RevealOnScroll>
          <p className="eyebrow mb-6">Free Interactive Tool</p>
          <h2 className="font-display text-3xl leading-[1.1] tracking-tight text-fog-100 sm:text-4xl md:text-5xl">
            What&apos;s your{" "}
            <span className="text-gradient">Business Flexibility Score?</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-fog-400 sm:text-lg">
            Answer 8 quick questions about your strategy, operations, and
            data. In under three minutes, you&apos;ll get a 0–100 flexibility
            score, your strongest and weakest areas, and a recommended next
            step.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href="/diagnostic" size="lg">
              Get My Score
            </Button>
            <span className="flex items-center gap-1.5 text-sm text-fog-500">
              <Gauge className="h-4 w-4" /> Takes about 3 minutes
            </span>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1} className="flex justify-center lg:justify-end">
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-10 backdrop-blur-sm">
            <div className="pointer-events-none absolute -inset-px rounded-3xl bg-bend-gradient-soft opacity-40" />
            <div className="relative flex flex-col items-center">
              <RadialGauge score={68} label="Flexibility" />
              <div className="mt-6 grid w-full grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-widest2 text-gold">
                    Strongest
                  </p>
                  <p className="mt-1 text-sm text-fog-200">Strategy Clarity</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-widest2 text-graphite-bright">
                    Weakest
                  </p>
                  <p className="mt-1 text-sm text-fog-200">Automation</p>
                </div>
              </div>
              <p className="mt-5 flex items-center gap-1.5 text-xs text-fog-500">
                Illustrative example <ArrowRight className="h-3 w-3" /> your
                score will differ
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
