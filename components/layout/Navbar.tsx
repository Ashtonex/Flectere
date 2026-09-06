"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Logo from "@/components/brand/Logo";

const LINKS = [
  { href: "/solutions", label: "Solutions" },
  { href: "/products", label: "Products" },
  { href: "/method", label: "Method" },
  { href: "/diagnostic", label: "Diagnostic" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-white/10 bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container-flectere flex h-20 items-center justify-between">
        <Logo size={48} />

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-sm font-medium text-fog-300 transition-colors hover:text-fog-100",
                pathname === link.href && "text-fog-100"
              )}
            >
              {link.label}
              {pathname === link.href && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute -bottom-1.5 left-0 h-px w-full bg-bend-gradient"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href="/diagnostic" size="md">
            Start the Diagnostic
          </Button>
        </div>

        <button
          aria-label="Toggle menu"
          className="text-fog-100 lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/10 bg-ink-950/95 backdrop-blur-xl lg:hidden"
          >
            <div className="container-flectere flex flex-col gap-1 py-6">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-3 text-base font-medium text-fog-200 transition-colors hover:bg-white/5 hover:text-fog-100"
                >
                  {link.label}
                </Link>
              ))}
              <Button href="/diagnostic" className="mt-3 w-full justify-center">
                Start the Diagnostic
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
