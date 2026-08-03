import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { methodSteps } from "@/lib/content";

export default function MethodDetailGrid() {
  return (
    <section className="relative border-t border-white/5 bg-ink-900 py-28 md:py-36">
      <Container>
        <SectionHeading
          eyebrow="In Detail"
          title="Every engagement moves through the same four stages."
          description="The sequence stays the same. What changes is the depth — a single team gets a fast pass, a full transformation gets months inside each stage."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {methodSteps.map((step, i) => (
            <RevealOnScroll
              key={step.key}
              delay={i * 0.08}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-8"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl text-gradient">{step.number}</span>
                <h3 className="font-display text-2xl text-fog-100">{step.title}</h3>
              </div>
              <p className="mt-2 text-sm font-medium text-fog-400">{step.tagline}</p>
              <p className="mt-4 text-sm leading-relaxed text-fog-500">{step.description}</p>
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-5">
                {step.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-fog-400">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                    {d}
                  </li>
                ))}
              </ul>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
