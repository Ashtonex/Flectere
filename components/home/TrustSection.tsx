import { Quote, ShieldCheck } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import {
  founderStory,
  credibilityPoints,
  testimonials,
  partnerLogos,
} from "@/lib/content";

export default function TrustSection() {
  const initials = founderStory.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="relative border-t border-white/5 bg-ink-900 py-28 md:py-36">
      <Container>
        <SectionHeading
          eyebrow="Why Flectēre"
          title="Built by operators, not slide-deck strategists."
        />

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <RevealOnScroll className="alive-panel premium-panel rounded-xl p-8 md:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bend-gradient text-sm font-semibold text-ink-950">
              {initials}
            </div>
            <p className="mt-6 text-base leading-relaxed text-fog-300">
              {founderStory.bio}
            </p>
            <div className="mt-6">
              <p className="font-display text-fog-100">{founderStory.name}</p>
              <p className="text-sm text-fog-500">{founderStory.role}</p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1} className="alive-panel rounded-xl border border-white/10 bg-white/[0.02] p-8 transition-colors duration-500 hover:border-gold/30 md:p-10">
            <div className="mb-5 flex items-center gap-2 text-gold">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
              <p className="eyebrow text-gold">Methodology Credibility</p>
            </div>
            <ul className="space-y-4">
              {credibilityPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-fog-300 sm:text-base">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {point}
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <RevealOnScroll
              key={t.name + i}
              delay={i * 0.08}
              className="alive-panel relative flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/25"
            >
              <Quote className="h-5 w-5 text-graphite-bright" strokeWidth={1.75} />
              {t.placeholder && (
                <span className="mt-4 w-fit rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest2 text-gold">
                  Placeholder
                </span>
              )}
              <p className="mt-4 flex-1 text-sm leading-relaxed text-fog-300">
                {t.placeholder ? t.quote : <>&ldquo;{t.quote}&rdquo;</>}
              </p>
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-fog-100">{t.name}</p>
                <p className="text-xs text-fog-500">{t.role}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-16 border-t border-white/10 pt-10">
          <p className="eyebrow mb-6 text-fog-500">
            Tools & Platforms We Work Across
          </p>
          <div className="overflow-hidden">
            <div className="flex w-max animate-marquee gap-16">
              {[...partnerLogos, ...partnerLogos].map((logo, i) => (
                <span
                  key={logo + i}
                  className="whitespace-nowrap font-display text-lg text-fog-600"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
