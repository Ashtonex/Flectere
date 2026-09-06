import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SiteAura from "@/components/layout/SiteAura";
import ScrollSigilReveal from "@/components/visuals/ScrollSigilReveal";

export const metadata: Metadata = {
  title: {
    default: "Flectēre — Bend before you break.",
    template: "%s | Flectēre",
  },
  description:
    "Flectēre helps ambitious companies redesign strategy, operations, technology, and growth systems so they can adapt faster than the market changes.",
  metadataBase: new URL("https://flectere.com"),
  openGraph: {
    title: "Flectēre — Bend before you break.",
    description:
      "Flectēre helps ambitious companies redesign strategy, operations, technology, and growth systems so they can adapt faster than the market changes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteAura />
      <ScrollSigilReveal />
      <div className="vignette-overlay" />
      <div className="patina-overlay" />
      <div className="noise-overlay" />
      <Navbar />
      <main className="relative z-10">{children}</main>
      <Footer />
    </>
  );
}
