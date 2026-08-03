import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Fraunces + Inter is the pairing you'll see across a lot of premium
// consulting/finance-adjacent brands: a serif with enough editorial
// gravitas to read as "we know what we're doing," paired with a clean,
// unmistakably professional sans for body copy and UI.
const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Flectēre — Bend before you break.",
    template: "%s | Flectēre",
  },
  description:
    "Flectēre helps ambitious companies redesign strategy, operations, technology, and growth systems so they can adapt faster than the market changes.",
  metadataBase: new URL("https://flectere.example.com"),
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
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <div className="vignette-overlay" />
        <div className="noise-overlay" />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
