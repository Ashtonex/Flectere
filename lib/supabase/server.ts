import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Route Handler client — reads cookies from the
// incoming request. Token refresh is handled by middleware.ts, so writes
// here are best-effort (they no-op harmlessly when called from a Server
// Component, which can't set cookies directly).
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore since
            // middleware.ts refreshes the session on every request.
          }
        },
      },
    }
  );
}

// Admin client — full database access, bypasses RLS. Server-only, and
// only for actions that genuinely need it (e.g. creating a client login).
// Never import this from a Client Component.
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client is never used to manage a user session.
        },
      },
    }
  );
}
