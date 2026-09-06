import { createClient } from "@/lib/supabase/server";
import {
  armRevenueRows,
  openPipelineValue,
  sumRevenue,
  weightedPipeline,
} from "@/lib/hub/crm";
import type {
  BusinessArm,
  Client,
  CrmActivity,
  CrmOpportunity,
  Invoice,
  Lead,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";
import { ExecutiveDashboardClient } from "./ExecutiveDashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: clients },
    { data: leads },
    { data: arms },
    { data: services },
    { data: opportunities },
    { data: activities },
    { data: revenue },
    { data: invoices },
  ] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("business_arms").select("*").order("name"),
    supabase.from("services").select("*").order("name"),
    supabase.from("crm_opportunities").select("*").order("updated_at", { ascending: false }),
    supabase.from("crm_activities").select("*").order("activity_date", { ascending: false }).limit(20),
    supabase.from("revenue_records").select("*").order("recorded_on", { ascending: false }),
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
  ]);

  const clientList = (clients ?? []) as Client[];
  const leadList = (leads ?? []) as Lead[];
  const armList = (arms ?? []) as BusinessArm[];
  const serviceList = (services ?? []) as Service[];
  const opportunityList = (opportunities ?? []) as CrmOpportunity[];
  const activityList = (activities ?? []) as CrmActivity[];
  const revenueList = (revenue ?? []) as RevenueRecord[];
  const invoiceList = (invoices ?? []) as Invoice[];

  const receivedRevenue = sumRevenue(revenueList, ["received"]);
  const bookedRevenue = sumRevenue(revenueList, ["received", "invoiced"]);
  const expectedRevenue = sumRevenue(revenueList, ["expected", "invoiced"]);
  const pipeline = openPipelineValue(opportunityList);
  const weighted = weightedPipeline(opportunityList);
  const unpaidInvoices = invoiceList
    .filter((invoice) => ["sent", "overdue"].includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.total), 0);

  const armRows = armRevenueRows(
    armList,
    serviceList,
    clientList,
    leadList,
    opportunityList,
    activityList,
    revenueList
  );

  return (
    <ExecutiveDashboardClient
      initialClients={clientList}
      initialLeads={leadList}
      initialArms={armList}
      initialServices={serviceList}
      initialOpportunities={opportunityList}
      initialActivities={activityList}
      initialRevenue={revenueList}
      initialInvoices={invoiceList}
      initialArmRows={armRows}
      receivedRevenue={receivedRevenue}
      bookedRevenue={bookedRevenue}
      expectedRevenue={expectedRevenue}
      pipeline={pipeline}
      weighted={weighted}
      unpaidInvoices={unpaidInvoices}
    />
  );
}

