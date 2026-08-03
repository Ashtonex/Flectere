import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { articles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Thinking on business flexibility, systems, growth, and where constraints actually hide — from the team at Flectēre.",
};

export default function InsightsPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title={
          <>
            Thinking on flexibility,{" "}
            <span className="text-gradient">systems, and growth.</span>
          </>
        }
        description="Short, opinionated essays on why businesses get rigid — and what it takes to make them adaptable again."
      />

      <section className="bg-ink-950 py-8 pb-28 md:pb-36">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {articles.map((article, i) => (
              <RevealOnScroll key={article.slug} delay={(i % 2) * 0.08}>
                <Link
                  href={`/insights/${article.slug}`}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/[0.04]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="eyebrow text-gold">{article.category}</span>
                      <ArrowUpRight className="h-4 w-4 text-fog-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                    </div>
                    <h2 className="mt-4 font-display text-2xl leading-snug text-fog-100">
                      {article.title}
                    </h2>
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
    </>
  );
}
