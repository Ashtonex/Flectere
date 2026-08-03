import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "../globals.css";

// Same brand fonts as the marketing site (via the same CSS variable
// names), but this root layout carries none of the public site's chrome
// — no Navbar/Footer, no noise/vignette overlays, no 3D. This is a tool.
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
    default: "Hub | Flectēre",
    template: "%s | Flectēre Hub",
  },
  robots: { index: false, follow: false },
};

export default function HubRootLayout({
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
