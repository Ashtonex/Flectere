import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Button from "@/components/ui/Button";
import { articles } from "@/lib/content";

export default function InsightsPreview() {
  return (
    <section className="relative border-t border-white/5 bg-ink-950 py-28 md:py-36">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Insights"
            title="Thinking on flexibility, systems, and growth."
            className="max-w-2xl"
          />
          <Button href="/insights" variant="secondary" className="shrink-0">
            All insights
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {articles.map((article, i) => (
            <RevealOnScroll key={article.slug} delay={i * 0.06}>
              <Link
                href={`/insights/${article.slug}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/[0.04]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-gold">{article.category}</span>
                    <ArrowUpRight className="h-4 w-4 text-fog-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                  </div>
                  <h3 className="mt-4 font-display text-xl leading-snug text-fog-100 sm:text-2xl">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-fog-500">
                    {article.excerpt}
                  </p>
                </div>
                <p className="mt-6 text-xs text-fog-600">{article.readTime}</p>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
