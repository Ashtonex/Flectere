import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/brand/Logo";
import SignOutButton from "@/components/hub/SignOutButton";

type JwtClaims = {
  app_metadata?: { role?: string };
};

export default async function HubAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as JwtClaims | undefined;

  // Belt and suspenders: middleware.ts already redirects unauthenticated
  // requests before they reach here, but a Server Component shouldn't
  // assume that held true by the time it rendered.
  if (!claims) {
    redirect("/hub/login");
  }

  const role = claims.app_metadata?.role;

  const links =
    role === "internal"
      ? [
          { href: "/hub/dashboard", label: "Dashboard" },
          { href: "/hub/universe", label: "Universe" },
          { href: "/hub/crm", label: "CRM" },
          { href: "/hub/invoices", label: "Invoices" },
          { href: "/hub/leads", label: "Leads" },
          { href: "/hub/clients", label: "Clients" },
          { href: "/hub/arms", label: "Arms" },
          { href: "/hub/trading", label: "Trading" },
          { href: "/hub/settings", label: "Settings" },
        ]
      : [{ href: "/hub/portal", label: "Portfolio" }];

  return (
    <div className="min-h-screen bg-ink-950 text-fog-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between px-6 lg:px-10 py-4">
          <Logo size={32} wordmarkClassName="text-base" href="/hub" />
          <nav className="hidden items-center gap-6 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-fog-300 transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1720px] px-6 lg:px-10 py-8">{children}</main>
    </div>
  );
}
