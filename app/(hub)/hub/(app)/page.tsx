import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type JwtClaims = {
  app_metadata?: { role?: string };
};

export default async function HubIndexPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as JwtClaims | undefined;
  const role = claims?.app_metadata?.role;

  if (role === "internal") redirect("/hub/leads");
  if (role === "client") redirect("/hub/portal");
  redirect("/hub/login");
}
