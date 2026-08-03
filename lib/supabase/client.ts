"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton browser client — safe to call repeatedly, @supabase/ssr
// reuses the same underlying client per the recommended pattern.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
