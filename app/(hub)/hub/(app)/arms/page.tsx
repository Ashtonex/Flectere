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
import { BusinessArmsClient } from "./BusinessArmsClient";

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

      <BusinessArmsClient
        rows={rows}
        armList={armList}
        serviceList={serviceList}
        clientList={(clients ?? []) as Client[]}
        leadList={(leads ?? []) as Lead[]}
        opportunityList={(opportunities ?? []) as CrmOpportunity[]}
        activityList={(activities ?? []) as CrmActivity[]}
        revenueList={(revenue ?? []) as RevenueRecord[]}
      />
    </div>
  );
}

