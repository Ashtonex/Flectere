import { createClient } from "@/lib/supabase/server";
import { SECTOR_ORBS, type SectorOrb } from "@/components/visuals/UniverseConstellationScene";
import { openPipelineValue, sumRevenue } from "@/lib/hub/crm";
import type {
  BusinessArm,
  Client,
  CrmOpportunity,
  Invoice,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";
import { UniverseClient } from "./UniverseClient";

export default async function UniversePage() {
  const supabase = await createClient();

  const [
    { data: arms },
    { data: clients },
    { data: opportunities },
    { data: services },
    { data: revenue },
    { data: invoices },
  ] = await Promise.all([
    supabase.from("business_arms").select("*").order("name"),
    supabase.from("clients").select("*").order("name"),
    supabase.from("crm_opportunities").select("*").order("updated_at", { ascending: false }),
    supabase.from("services").select("*").order("name"),
    supabase.from("revenue_records").select("*").order("recorded_on", { ascending: false }),
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
  ]);

  const armList = (arms ?? []) as BusinessArm[];
  const clientList = (clients ?? []) as Client[];
  const opportunityList = (opportunities ?? []) as CrmOpportunity[];
  const serviceList = (services ?? []) as Service[];
  const revenueList = (revenue ?? []) as RevenueRecord[];
  const invoiceList = (invoices ?? []) as Invoice[];

  // Merge authentic database metrics into SECTOR_ORBS
  const realOrbs: SectorOrb[] = SECTOR_ORBS.map((baseOrb) => {
    const matchedArm = armList.find(
      (a) => a.slug === baseOrb.key || a.name.toLowerCase() === baseOrb.key.toLowerCase()
    );

    let realMrr = 0;
    let realTenants = 0;

    if (matchedArm) {
      // Direct revenue recorded for this arm
      const armRevenue = revenueList.filter((r) => r.business_arm_id === matchedArm.id);
      realMrr = sumRevenue(armRevenue, ["received"]);

      // Count clients that have active opportunities or revenue in this arm
      const armOppClients = opportunityList
        .filter((o) => o.business_arm_id === matchedArm.id && o.client_id)
        .map((o) => o.client_id);
      const armRevClients = armRevenue.map((r) => r.client_id).filter(Boolean);
      const uniqueClientIds = new Set([...armOppClients, ...armRevClients]);
      realTenants = uniqueClientIds.size;
    }

    return {
      ...baseOrb,
      mrr: realMrr,
      tenants: realTenants,
      health: "nominal",
    };
  });

  const totalReceived = sumRevenue(revenueList, ["received"]);
  const totalPipeline = openPipelineValue(opportunityList);

  return (
    <UniverseClient
      orbs={realOrbs}
      arms={armList}
      clients={clientList}
      opportunities={opportunityList}
      services={serviceList}
      invoices={invoiceList}
      revenueRecords={revenueList}
      totalReceived={totalReceived}
      totalPipeline={totalPipeline}
    />
  );
}

