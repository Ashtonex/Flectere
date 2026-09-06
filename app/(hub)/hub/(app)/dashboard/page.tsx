import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/hub/analytics";
import {
  armName,
  armRevenueRows,
  clientName,
  labelize,
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
    supabase.from("crm_activities").select("*").order("activity_date", { ascending: false }).limit(8),
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
  const activeOpportunities = opportunityList.filter((item) => !["won", "lost"].includes(item.stage));
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

  const stats = [
    { label: "Revenue Received", value: formatCurrency(receivedRevenue), sub: "Actual cash collected", tone: "gold" },
    { label: "Booked Revenue", value: formatCurrency(bookedRevenue), sub: "Received + Invoiced", tone: "default" },
    { label: "Weighted Pipeline", value: formatCurrency(weighted), sub: "Probability adjusted", tone: "default" },
    { label: "Unpaid Invoices", value: formatCurrency(unpaidInvoices), sub: `${invoiceList.filter((i) => ["sent", "overdue"].includes(i.status)).length} open invoices`, tone: "default" },
    { label: "Open Pipeline", value: formatCurrency(pipeline), sub: `${activeOpportunities.length} active deals`, tone: "default" },
    { label: "Active Clients", value: String(clientList.length), sub: "Enterprise accounts", tone: "default" },
    { label: "Inbound Leads", value: String(leadList.length), sub: "Diagnostic / Contact", tone: "default" },
    { label: "Business Arms", value: String(armList.length), sub: "Platform divisions", tone: "default" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-fog-100 tracking-tight">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-fog-500">
            Real-time telemetry across revenue, pipeline, arm performance, and enterprise client operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Dual-Engine Cockpit Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs">
            <span className="rounded-lg bg-gold px-3 py-1.5 font-bold text-ink-950 shadow">
              📊 Executive Grid
            </span>
            <Link
              href="/hub/universe"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-fog-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>🌌 3D Universe</span>
            </Link>
          </div>

          <Link
            href="/hub/crm"
            className="rounded-lg border border-gold/50 bg-gold px-4 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-bright"
          >
            Pipeline CRM
          </Link>
          <Link
            href="/hub/arms"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-200 transition-colors hover:border-gold/40 hover:text-gold"
          >
            Business Arms
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={
              stat.tone === "gold"
                ? "rounded-xl border border-gold/25 bg-gold/5 p-5"
                : "rounded-xl border border-white/10 bg-white/[0.02] p-5"
            }
          >
            <p className={stat.tone === "gold" ? "text-xs uppercase tracking-widest2 text-gold font-bold" : "text-xs uppercase tracking-widest2 text-fog-500"}>
              {stat.label}
            </p>
            <p className="mt-2 font-display text-2xl text-fog-100">{stat.value}</p>
            <p className="mt-1 text-[10px] text-fog-500 font-mono">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
              <tr>
                <th className="px-4 py-3">Business Arm</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Clients</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {armRows.map((row) => (
                <tr key={row.arm.id}>
                  <td className="px-4 py-3 text-fog-100">{row.arm.name}</td>
                  <td className="px-4 py-3 text-fog-400">{row.arm.sector}</td>
                  <td className="px-4 py-3 text-fog-400">{row.clientCount}</td>
                  <td className="px-4 py-3 text-fog-400">{row.serviceCount}</td>
                  <td className="px-4 py-3 text-fog-200">{formatCurrency(row.receivedRevenue)}</td>
                  <td className="px-4 py-3 text-fog-200">{formatCurrency(row.pipelineValue)}</td>
                </tr>
              ))}
              {armRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-fog-600">
                    Add a business arm to start central reporting.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Recent Activity</h2>
          <ul className="mt-4 divide-y divide-white/5">
            {activityList.map((activity) => (
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
              </li>
            ))}
            {activityList.length === 0 && (
              <li className="py-4 text-sm text-fog-600">No activity recorded yet.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Pending Invoices & Payment Action Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm uppercase tracking-wider text-fog-400 font-bold">Pending & Overdue Invoices</h2>
            <p className="text-xs text-fog-500">Live invoices awaiting client wire transfers or confirmation</p>
          </div>
          <Link
            href="/hub/invoices"
            className="text-xs text-gold hover:underline font-medium"
          >
            Manage All Invoices ({invoiceList.length}) ➔
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
              <tr>
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Arm</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount Due</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoiceList
                .filter((inv) => ["sent", "overdue", "draft"].includes(inv.status))
                .slice(0, 6)
                .map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono font-medium text-fog-100">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-fog-300 font-medium">
                      {clientName(invoice.client_id, clientList)}
                    </td>
                    <td className="px-4 py-3 text-fog-400">{armName(invoice.business_arm_id, armList)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          invoice.status === "overdue"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : invoice.status === "sent"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "bg-white/5 text-fog-400 border border-white/10"
                        }`}
                      >
                        {labelize(invoice.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-fog-500 text-xs">
                      {invoice.due_on ? new Date(invoice.due_on).toLocaleDateString() : "Immediate"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href="/hub/invoices"
                        className="rounded bg-gold/10 hover:bg-gold hover:text-ink-950 text-gold text-xs font-semibold px-2.5 py-1 transition border border-gold/30"
                      >
                        Validate ➔
                      </Link>
                    </td>
                  </tr>
                ))}
              {invoiceList.filter((inv) => ["sent", "overdue", "draft"].includes(inv.status)).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-fog-600">
                    Zero open or overdue invoices pending payment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Opportunity</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Arm</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Probability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {activeOpportunities.slice(0, 8).map((opportunity) => (
              <tr key={opportunity.id}>
                <td className="px-4 py-3 text-fog-100">{opportunity.title}</td>
                <td className="px-4 py-3 text-fog-400">{clientName(opportunity.client_id, clientList)}</td>
                <td className="px-4 py-3 text-fog-400">{armName(opportunity.business_arm_id, armList)}</td>
                <td className="px-4 py-3 capitalize text-fog-400">{labelize(opportunity.stage)}</td>
                <td className="px-4 py-3 text-fog-200">{formatCurrency(opportunity.value)}</td>
                <td className="px-4 py-3 text-fog-400">{opportunity.probability}%</td>
              </tr>
            ))}
            {activeOpportunities.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-fog-600">
                  No open opportunities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
