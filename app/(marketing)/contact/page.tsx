import type { Metadata } from "next";
import { Mail, Clock, MapPin } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a Flectēre Diagnostic call, or send us a note about the constraint you're trying to solve.",
};

export default function ContactPage({
  searchParams,
}: {
  searchParams: { source?: string; score?: string; focus?: string };
}) {
  const fromDiagnostic = searchParams.source === "diagnostic";
  const contextNote = fromDiagnostic
    ? `You completed the Flectēre Diagnostic${
        searchParams.score ? ` and scored ${searchParams.score}/100` : ""
      }${
        searchParams.focus
          ? `, with ${searchParams.focus} as your weakest area`
          : ""
      }. We'll come prepared to talk about that.`
    : undefined;

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Let&apos;s find what&apos;s{" "}
            <span className="text-gradient">holding you back.</span>
          </>
        }
        description="Tell us where the business feels rigid. We'll come back with how the Sense stage would actually apply to your situation."
      />

      <section className="relative bg-ink-950 pb-28 md:pb-36">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <RevealOnScroll>
            <ContactForm
              contextNote={contextNote}
              source={searchParams.source}
              diagnosticScore={searchParams.score}
              diagnosticFocus={searchParams.focus}
            />
          </RevealOnScroll>

          <RevealOnScroll delay={0.1} className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="flex items-center gap-2 text-gold">
                <Clock className="h-4 w-4" />
                <p className="eyebrow text-gold">What Happens Next</p>
              </div>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-fog-400">
                <li>1. We review what you shared, in under one business day.</li>
                <li>2. You get a short reply proposing a 30-minute diagnostic call.</li>
                <li>3. On the call, we go straight into the Sense stage — no generic pitch.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="flex items-center gap-2 text-graphite-bright">
                <Mail className="h-4 w-4" />
                <p className="eyebrow text-graphite-bright">Direct</p>
              </div>
              <p className="mt-4 text-sm text-fog-400">
                Prefer email?{" "}
                <a href="mailto:hello@flectere.com" className="text-fog-100 underline decoration-white/20 underline-offset-4 hover:text-gold">
                  hello@flectere.com
                </a>
              </p>
              <p className="mt-1 text-xs text-fog-600">
                (Placeholder address — update with your real inbox.)
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="flex items-center gap-2 text-gold">
                <MapPin className="h-4 w-4" />
                <p className="eyebrow text-gold">Based</p>
              </div>
              <p className="mt-4 text-sm text-fog-400">
                Working with clients remotely and on-site, wherever the
                constraint needs us.
              </p>
            </div>
          </RevealOnScroll>
        </Container>
      </section>
    </>
  );
}
