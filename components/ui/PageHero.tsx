import Container from "@/components/ui/Container";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-ink-950 pb-20 pt-40 md:pb-28 md:pt-48">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="orbit-sigil pointer-events-none absolute -right-28 top-24 h-80 w-80 rounded-full border border-gold/10 bg-[conic-gradient(from_160deg,rgba(198,161,89,0.02),rgba(198,161,89,0.22),rgba(155,161,168,0.05),rgba(198,161,89,0.02))] blur-[0.2px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <Container className="relative">
        <RevealOnScroll>
          <p className="eyebrow mb-6">{eyebrow}</p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.05] text-engraved sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-fog-400 sm:text-lg">
              {description}
            </p>
          )}
          {children && <div className="mt-9">{children}</div>}
        </RevealOnScroll>
      </Container>
    </section>
  );
}
