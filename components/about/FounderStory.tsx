import Container from "@/components/ui/Container";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { founderStory } from "@/lib/content";

export default function FounderStory() {
  return (
    <section className="relative border-t border-white/5 bg-ink-950 py-28 md:py-36">
      <Container className="max-w-3xl">
        <RevealOnScroll className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-12">
          {founderStory.placeholder && (
            <span className="absolute right-6 top-6 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-medium uppercase tracking-widest2 text-gold">
              Placeholder
            </span>
          )}
          <p className="eyebrow mb-6">Founder Story</p>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bend-gradient text-base font-semibold text-ink-950">
            FN
          </div>
          <p className="mt-7 text-lg leading-relaxed text-fog-200">
            {founderStory.bio}
          </p>
          <div className="mt-7 border-t border-white/10 pt-6">
            <p className="font-display text-fog-100">{founderStory.name}</p>
            <p className="text-sm text-fog-500">{founderStory.role}</p>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
