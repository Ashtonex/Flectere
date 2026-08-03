import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import BendDivider from "@/components/visuals/BendDivider";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-ink-950 py-28 md:py-40">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.1]" />
      <Container className="relative flex flex-col items-center text-center">
        <RevealOnScroll>
          <p className="eyebrow mb-6">Start Here</p>
          <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[1.08] tracking-tight text-fog-100 sm:text-5xl md:text-6xl">
            Find the constraint holding your business back.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-fog-400 sm:text-lg">
            Start with a focused diagnostic. We&apos;ll help you see where the
            business is rigid, where opportunity is trapped, and what to
            reshape first.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button href="/diagnostic" size="lg">
              Start the Diagnostic
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Book a Call Instead
            </Button>
          </div>
        </RevealOnScroll>
        <BendDivider className="mt-20 max-w-2xl" />
      </Container>
    </section>
  );
}
