import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/hub/analytics";
import {
  activityTypes,
  armName,
  calculateLeadValuation,
  clientName,
  computeContractExtraction,
  labelize,
  leadName,
  opportunityStages,
  revenueStatuses,
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
import {
  createActivityAction,
  createOpportunityAction,
  createRevenueRecordAction,
} from "./actions";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-ink-900 px-4 py-2 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold hover:text-ink-950";

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
  const today = new Date().toISOString().slice(0, 10);

  const openOpportunities = opportunityList.filter((item) => !["won", "lost"].includes(item.stage));
  const receivedRevenue = sumRevenue(revenueList, ["received"]);
  const bookedRevenue = sumRevenue(revenueList, ["received", "invoiced"]);
  const weighted = weightedPipeline(opportunityList);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-fog-100">CRM</h1>
          <p className="mt-1 text-sm text-fog-500">
            Record Flectere activity, pipeline, and revenue across every business arm.
          </p>
        </div>
        <Link
          href="/hub/clients"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-200 transition-colors hover:border-gold/40 hover:text-gold"
        >
          View Clients
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold">Revenue Received</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(receivedRevenue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Booked Revenue</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(bookedRevenue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Weighted Pipeline</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(weighted)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Add Opportunity</h2>
          <form action={createOpportunityAction} className="mt-4 space-y-4">
            <div>
              <label className={labelClasses}>Title</label>
              <input name="title" required className={inputClasses} placeholder="e.g. Systems audit retainer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Client</label>
                <select name="client_id" className={inputClasses}>
                  <option value="">Unassigned</option>
                  {clientList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Lead</label>
                <select name="lead_id" className={inputClasses}>
                  <option value="">No lead</option>
                  {leadList.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `- ${lead.company}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Business Arm</label>
                <select name="business_arm_id" className={inputClasses}>
                  <option value="">No arm</option>
                  {armList.map((arm) => (
                    <option key={arm.id} value={arm.id}>
                      {arm.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Service</label>
                <select name="service_id" className={inputClasses}>
                  <option value="">No service</option>
                  {serviceList.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Stage</label>
                <select name="stage" className={inputClasses}>
                  {opportunityStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {labelize(stage)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Value</label>
                <input name="value" type="number" step="0.01" className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Probability</label>
                <input name="probability" type="number" min="0" max="100" defaultValue="25" className={inputClasses} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Expected Close</label>
              <input name="expected_close_on" type="date" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Notes</label>
              <textarea name="notes" rows={3} className={inputClasses} />
            </div>
            <button type="submit" className={submitClasses}>
              Add Opportunity
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Record Activity</h2>
          <form action={createActivityAction} className="mt-4 space-y-4">
            <div>
              <label className={labelClasses}>Subject</label>
              <input name="subject" required className={inputClasses} placeholder="e.g. Discovery call completed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Type</label>
                <select name="activity_type" className={inputClasses}>
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {labelize(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Date</label>
                <input name="activity_date" type="date" required defaultValue={today} className={inputClasses} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Client</label>
                <select name="client_id" className={inputClasses}>
                  <option value="">Unassigned</option>
                  {clientList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Opportunity</label>
                <select name="opportunity_id" className={inputClasses}>
                  <option value="">No opportunity</option>
                  {opportunityList.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClasses}>Business Arm</label>
              <select name="business_arm_id" className={inputClasses}>
                <option value="">No arm</option>
                {armList.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Outcome</label>
              <textarea name="outcome" rows={2} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Next Step</label>
              <input name="next_step" className={inputClasses} placeholder="e.g. Send proposal Friday" />
            </div>
            <button type="submit" className={submitClasses}>
              Record Activity
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Record Revenue</h2>
          <form action={createRevenueRecordAction} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Amount</label>
                <input name="amount" type="number" step="0.01" required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Date</label>
                <input name="recorded_on" type="date" required defaultValue={today} className={inputClasses} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Client</label>
                <select name="client_id" className={inputClasses}>
                  <option value="">Unassigned</option>
                  {clientList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Business Arm</label>
                <select name="business_arm_id" className={inputClasses}>
                  <option value="">No arm</option>
                  {armList.map((arm) => (
                    <option key={arm.id} value={arm.id}>
                      {arm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Service</label>
                <select name="service_id" className={inputClasses}>
                  <option value="">No service</option>
                  {serviceList.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Opportunity</label>
                <select name="opportunity_id" className={inputClasses}>
                  <option value="">No opportunity</option>
                  {opportunityList.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Category</label>
                <select name="category" className={inputClasses}>
                  <option value="service_fee">Service Fee</option>
                  <option value="retainer">Retainer</option>
                  <option value="commission">Commission</option>
                  <option value="subscription">Subscription</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Status</label>
                <select name="status" className={inputClasses}>
                  {revenueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {labelize(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClasses}>Notes</label>
              <textarea name="notes" rows={3} className={inputClasses} />
            </div>
            <button type="submit" className={submitClasses}>
              Record Revenue
            </button>
          </form>
        </div>
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
