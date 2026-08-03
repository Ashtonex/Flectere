import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/brand/Logo";
import { mottos } from "@/lib/content";

const columns = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/method", label: "Method" },
      { href: "/insights", label: "Insights" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Capabilities",
    links: [
      { href: "/solutions", label: "Strategy & Positioning" },
      { href: "/solutions", label: "Business Systems & Operations" },
      { href: "/solutions", label: "AI & Automation" },
      { href: "/solutions", label: "Growth & Market Expansion" },
    ],
  },
  {
    title: "Start Here",
    links: [
      { href: "/diagnostic", label: "Business Flexibility Score" },
      { href: "/contact", label: "Book a Diagnostic Call" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-ink-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-bend-gradient opacity-60" />
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size={56} href={null} wordmarkClassName="text-2xl" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fog-500">
              Bend before you break. We help ambitious companies redesign how
              they operate, grow, and adapt.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4 text-fog-500">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link, i) => (
                  <li key={col.title + link.label + i}>
                    <Link
                      href={link.href}
                      className="text-sm text-fog-400 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-fog-500 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Flectēre. All rights reserved.</p>
          <p className="tracking-widest2 uppercase text-fog-600">
            {mottos.map((m) => m.latin).join(" · ")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
