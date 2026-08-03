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
  const supabase = createClient();
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
          { href: "/hub/leads", label: "Leads" },
          { href: "/hub/clients", label: "Clients" },
          { href: "/hub/trading", label: "Trading" },
        ]
      : [{ href: "/hub/portal", label: "Portfolio" }];

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size={32} wordmarkClassName="text-base" href="/hub" />
          <nav className="hidden items-center gap-6 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-fog-300 transition-colors hover:text-fog-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
