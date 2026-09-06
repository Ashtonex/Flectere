import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const display = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-ink-950 font-sans text-fog-100 antialiased">
        {children}
      </body>
    </html>
  );
}
