import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent } from "@/lib/hub/analytics";
import { armRevenueRows, labelize } from "@/lib/hub/crm";
import type {
  BusinessArm,
  Client,
  CrmActivity,
  CrmOpportunity,
  Lead,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";
import { createBusinessArmAction, createServiceAction } from "../crm/actions";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-ink-900 px-4 py-2 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold hover:text-ink-950";

export default async function BusinessArmsPage() {
  const supabase = await createClient();

  const [
    { data: arms },
    { data: services },
    { data: clients },
    { data: leads },
    { data: opportunities },
    { data: activities },
    { data: revenue },
  ] = await Promise.all([
    supabase.from("business_arms").select("*").order("name"),
    supabase.from("services").select("*").order("name"),
    supabase.from("clients").select("*").order("name"),
    supabase.from("leads").select("*"),
    supabase.from("crm_opportunities").select("*"),
    supabase.from("crm_activities").select("*"),
    supabase.from("revenue_records").select("*"),
  ]);

  const armList = (arms ?? []) as BusinessArm[];
  const serviceList = (services ?? []) as Service[];
  const rows = armRevenueRows(
    armList,
    serviceList,
    (clients ?? []) as Client[],
    (leads ?? []) as Lead[],
    (opportunities ?? []) as CrmOpportunity[],
    (activities ?? []) as CrmActivity[],
    (revenue ?? []) as RevenueRecord[]
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-fog-100">Business Arms</h1>
        <p className="mt-1 text-sm text-fog-500">
          Define Flectere divisions, sectors, and services while keeping central reporting intact.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Add Business Arm</h2>
          <form action={createBusinessArmAction} className="mt-4 space-y-4">
            <div>
              <label className={labelClasses}>Name</label>
              <input name="name" required className={inputClasses} placeholder="e.g. Flectere Capital" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Sector</label>
                <input name="sector" required className={inputClasses} placeholder="Finance, logistics, tech" />
              </div>
              <div>
                <label className={labelClasses}>Status</label>
                <select name="status" className={inputClasses}>
                  <option value="active">Active</option>
                  <option value="planned">Planned</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClasses}>Target Revenue</label>
              <input name="target_revenue" type="number" step="0.01" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Description</label>
              <textarea name="description" rows={3} className={inputClasses} />
            </div>
            <button type="submit" className={submitClasses}>
              Add Arm
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Add Service</h2>
          <form action={createServiceAction} className="mt-4 space-y-4">
            <div>
              <label className={labelClasses}>Business Arm</label>
              <select name="business_arm_id" required className={inputClasses}>
                {armList.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Service Name</label>
                <input name="name" required className={inputClasses} placeholder="e.g. Operating System Audit" />
              </div>
              <div>
                <label className={labelClasses}>Default Price</label>
                <input name="default_price" type="number" step="0.01" className={inputClasses} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Description</label>
              <textarea name="description" rows={3} className={inputClasses} />
            </div>
            <button type="submit" className={submitClasses} disabled={armList.length === 0}>
              Add Service
            </button>
            {armList.length === 0 && (
              <p className="text-xs text-fog-600">Create a business arm first.</p>
            )}
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((row) => {
          const armServices = serviceList.filter((service) => service.business_arm_id === row.arm.id);
          return (
            <section key={row.arm.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest2 text-gold">{row.arm.sector}</p>
                  <h2 className="mt-2 font-display text-xl text-fog-100">{row.arm.name}</h2>
                  <p className="mt-1 text-sm capitalize text-fog-500">{labelize(row.arm.status)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest2 text-fog-500">Revenue</p>
                  <p className="mt-1 font-display text-xl text-fog-100">
                    {formatCurrency(row.receivedRevenue)}
                  </p>
                </div>
              </div>

              {row.arm.description && (
                <p className="mt-4 text-sm leading-6 text-fog-400">{row.arm.description}</p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-fog-500">Clients</p>
                  <p className="mt-1 text-fog-100">{row.clientCount}</p>
                </div>
                <div>
                  <p className="text-xs text-fog-500">Pipeline</p>
                  <p className="mt-1 text-fog-100">{formatCurrency(row.pipelineValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-fog-500">Booked</p>
                  <p className="mt-1 text-fog-100">{formatCurrency(row.bookedRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-fog-500">Target</p>
                  <p className="mt-1 text-fog-100">{formatPercent(row.progress)}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-widest2 text-fog-500">Services</p>
                <ul className="mt-3 divide-y divide-white/5">
                  {armServices.map((service) => (
                    <li key={service.id} className="flex items-center justify-between gap-4 py-2">
                      <span className="text-sm text-fog-200">{service.name}</span>
                      <span className="text-xs text-fog-500">
                        {service.default_price ? formatCurrency(service.default_price) : labelize(service.status)}
                      </span>
                    </li>
                  ))}
                  {armServices.length === 0 && (
                    <li className="py-2 text-sm text-fog-600">No services linked yet.</li>
                  )}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
