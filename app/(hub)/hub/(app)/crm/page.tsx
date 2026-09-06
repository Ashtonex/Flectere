import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/hub/analytics";
import {
  armName,
  calculateLeadValuation,
  clientName,
  computeContractExtraction,
  labelize,
  leadName,
  serviceName,
  sumRevenue,
  weightedPipeline,
} from "@/lib/hub/crm";
import type {
  BusinessArm,
  Client,
  CrmActivity,
  CrmOpportunity,
  Lead,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";
import { PipelineBoard } from "./PipelineBoard";

export default async function CrmPage() {
  const supabase = await createClient();

  const [
    { data: clients },
    { data: leads },
    { data: arms },
    { data: services },
    { data: opportunities },
    { data: activities },
    { data: revenue },
  ] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("business_arms").select("*").order("name"),
    supabase.from("services").select("*").order("name"),
    supabase.from("crm_opportunities").select("*").order("updated_at", { ascending: false }),
    supabase.from("crm_activities").select("*").order("activity_date", { ascending: false }),
    supabase.from("revenue_records").select("*").order("recorded_on", { ascending: false }),
  ]);

  const clientList = (clients ?? []) as Client[];
  const leadList = (leads ?? []) as Lead[];
  const armList = (arms ?? []) as BusinessArm[];
  const serviceList = (services ?? []) as Service[];
  const opportunityList = (opportunities ?? []) as CrmOpportunity[];
  const activityList = (activities ?? []) as CrmActivity[];
  const revenueList = (revenue ?? []) as RevenueRecord[];

  const openOpportunities = opportunityList.filter((item) => !["won", "lost"].includes(item.stage));
  const receivedRevenue = sumRevenue(revenueList, ["received"]);
  const bookedRevenue = sumRevenue(revenueList, ["received", "invoiced"]);
  const weighted = weightedPipeline(opportunityList);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-fog-100 tracking-tight">
            Pipeline & CRM Command
          </h1>
          <p className="mt-1 text-sm text-fog-500">
            Real-time pipeline staging, client engagements, and direct revenue ledger across all business arms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/hub/leads"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-200 transition-colors hover:border-gold/40 hover:text-gold"
          >
            Manage Leads ({leadList.length})
          </Link>
          <Link
            href="/hub/clients"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-200 transition-colors hover:border-gold/40 hover:text-gold"
          >
            Manage Clients ({clientList.length})
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold">Revenue Received</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(receivedRevenue)}</p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">Actual collected cash</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Booked Revenue</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(bookedRevenue)}</p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">Received + Invoiced</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Weighted Pipeline</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(weighted)}</p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">Adjusted for win probability</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Active Pipeline Deals</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{openOpportunities.length}</p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">{opportunityList.length} total opportunities</p>
        </div>
      </div>

      {/* Visual Kanban Pipeline Board */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wider text-fog-400 font-bold">Deal Pipeline Stages</h2>
          <span className="text-xs text-fog-500">Move deals between stages or add new opportunities</span>
        </div>
        <PipelineBoard
          initialOpportunities={opportunityList}
          clients={clientList}
          leads={leadList}
          arms={armList}
          services={serviceList}
          revenueRecords={revenueList}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Opportunity</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Arm</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Contract Structure</th>
              <th className="px-4 py-3">Close</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {openOpportunities.map((opportunity) => {
              const extraction = computeContractExtraction(opportunity);
              return (
                <tr key={opportunity.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <p className="text-fog-100 font-medium">{opportunity.title}</p>
                    {opportunity.stage === "won" && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {extraction.extractionPercent}% Extracted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fog-400">{clientName(opportunity.client_id, clientList)}</td>
                  <td className="px-4 py-3 text-fog-400">{armName(opportunity.business_arm_id, armList)}</td>
                  <td className="px-4 py-3 text-fog-400">{serviceName(opportunity.service_id, serviceList)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        opportunity.stage === "won"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : opportunity.stage === "negotiation"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-white/5 text-fog-300 border border-white/10"
                      }`}
                    >
                      {labelize(opportunity.stage)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fog-200">
                    <p className="font-mono font-bold text-white">
                      {formatCurrency(extraction.totalContractValue, opportunity.currency)}
                    </p>
                    <p className="text-[10px] text-fog-500">
                      {formatCurrency(extraction.setupFee)} + {formatCurrency(extraction.monthlyRecurring)}/mo
                    </p>
                  </td>
                  <td className="px-4 py-3 text-fog-500">
                    {opportunity.expected_close_on
                      ? new Date(opportunity.expected_close_on).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {openOpportunities.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fog-600">
                  No active opportunities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Activity Timeline</h2>
          <ul className="mt-4 divide-y divide-white/5">
            {activityList.slice(0, 12).map((activity) => (
              <li key={activity.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-fog-100">{activity.subject}</p>
                  <span className="shrink-0 text-xs text-fog-600">
                    {new Date(activity.activity_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fog-500">
                  {labelize(activity.activity_type)} · {clientName(activity.client_id, clientList)} ·{" "}
                  {armName(activity.business_arm_id, armList)}
                </p>
                {activity.next_step && <p className="mt-1 text-xs text-gold">Next: {activity.next_step}</p>}
              </li>
            ))}
            {activityList.length === 0 && (
              <li className="py-3 text-sm text-fog-600">No activity logged yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Revenue Ledger</h2>
          <ul className="mt-4 divide-y divide-white/5">
            {revenueList.slice(0, 12).map((record) => (
              <li key={record.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-fog-100">{formatCurrency(record.amount)}</p>
                  <span className="shrink-0 text-xs text-fog-600">
                    {new Date(record.recorded_on).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fog-500">
                  {labelize(record.status)} · {clientName(record.client_id, clientList)} ·{" "}
                  {armName(record.business_arm_id, armList)}
                </p>
              </li>
            ))}
            {revenueList.length === 0 && (
              <li className="py-3 text-sm text-fog-600">No revenue recorded yet.</li>
            )}
          </ul>
        </div>
      </div>

      {leadList.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg text-fog-100">Lead Source Pool & Predictive Valuations</h2>
              <p className="text-xs text-fog-500">Automated deal sizing calculated from diagnostic bottlenecks and sector matching.</p>
            </div>
            <span className="text-[10px] bg-gold/10 text-gold px-2.5 py-1 rounded-full font-mono font-bold">
              ALG-VALUATION ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leadList.slice(0, 6).map((lead) => {
              const val = calculateLeadValuation(lead);
              return (
                <div key={lead.id} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-fog-100">{leadName(lead.id, leadList)}</p>
                      <p className="text-xs text-fog-500">{lead.email}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded">
                      {formatCurrency(val.yearOneValue)} Y1
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-fog-400">
                    <div>
                      <span className="text-fog-600 block text-[9px] uppercase">Target Arm:</span>
                      <span className="text-gold font-semibold">{val.suggestedArm}</span>
                    </div>
                    <div>
                      <span className="text-fog-600 block text-[9px] uppercase">Est. Structure:</span>
                      <span>{formatCurrency(val.estimatedSetup)} + {formatCurrency(val.estimatedMrr)}/mo</span>
                    </div>
                  </div>

                  {lead.message && (
                    <p className="text-[11px] text-fog-400 italic line-clamp-2 pt-1">
                      &quot;{lead.message}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
