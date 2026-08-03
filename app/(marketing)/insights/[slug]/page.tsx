import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import BendDivider from "@/components/visuals/BendDivider";
import { articles } from "@/lib/content";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) notFound();

  return (
    <article className="relative bg-ink-950 pb-28 pt-40 md:pt-48">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <Container className="relative max-w-3xl">
        <RevealOnScroll>
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest2 text-fog-500">
            <span className="text-gold">{article.category}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
          <h1 className="mt-5 font-display text-3xl leading-[1.1] tracking-tight text-fog-100 sm:text-4xl md:text-5xl">
            {article.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-fog-400">
            {article.excerpt}
          </p>
        </RevealOnScroll>

        <BendDivider className="my-12" />

        <RevealOnScroll className="space-y-6">
          {article.body.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-fog-300">
              {paragraph}
            </p>
          ))}
        </RevealOnScroll>

        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="font-display text-xl text-fog-100">
            See where this shows up in your business.
          </p>
          <p className="mt-2 text-sm text-fog-500">
            Get your Business Flexibility Score in under three minutes.
          </p>
          <Button href="/diagnostic" className="mt-6">
            Start the Diagnostic
          </Button>
        </div>
      </Container>
    </article>
  );
}
