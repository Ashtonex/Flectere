import { createClient } from "@/lib/supabase/server";
import type { BusinessArm, CrmActivity, Lead } from "@/lib/hub/types";
import { LeadsManager } from "./LeadsManager";

export default async function LeadsPage() {
  const supabase = await createClient();

  const [
    { data: leads, error },
    { data: activities },
    { data: arms },
  ] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_activities").select("*").order("activity_date", { ascending: false }),
    supabase.from("business_arms").select("*").order("name"),
  ]);

  const leadList = (leads ?? []) as Lead[];
  const activityList = (activities ?? []) as CrmActivity[];
  const armList = (arms ?? []) as BusinessArm[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-fog-100">Leads & Inbound Signals</h1>
        <p className="mt-1 text-sm text-fog-400">
          Prospects captured through the Business Diagnostic quiz, contact inquiries, and outbound calls.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Couldn&apos;t load leads: {error.message}
        </div>
      )}

      <LeadsManager
        initialLeads={leadList}
        activities={activityList}
        arms={armList}
      />
    </div>
  );
}
