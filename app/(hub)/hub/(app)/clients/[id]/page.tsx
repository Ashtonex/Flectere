import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  computeAccountAnalytics,
  computePortfolioTotals,
  formatCurrency,
  formatPercent,
} from "@/lib/hub/analytics";
import { armName, labelize, serviceName, sumRevenue, weightedPipeline } from "@/lib/hub/crm";
import { documentTypes } from "@/lib/hub/invoices";
import type {
  BusinessArm,
  Client,
  ClientDocument,
  CrmActivity,
  CrmOpportunity,
  Expense,
  PerformanceEntry,
  RevenueRecord,
  Service,
  TradingAccount,
  Withdrawal,
} from "@/lib/hub/types";
import {
  addWithdrawalAction,
  createClientPortalLoginAction,
  updateClientAction,
} from "../actions";
import { ClientDocumentsGrouped } from "./ClientDocumentsGrouped";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-ink-900 px-4 py-2 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold hover:text-ink-950";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ portal?: string }> | { portal?: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const clientId = resolvedParams.id;

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) notFound();

  const { data: accounts } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("client_id", clientId);
  const accountList = (accounts ?? []) as TradingAccount[];
  const accountIds = accountList.map((a) => a.id);

  const [
    { data: entries },
    { data: expenses },
    { data: withdrawals },
    { data: documents },
    { data: arms },
    { data: services },
    { data: opportunities },
    { data: activities },
    { data: revenue },
  ] = await Promise.all([
    accountIds.length > 0
      ? supabase.from("performance_entries").select("*").in("account_id", accountIds)
      : Promise.resolve({ data: [] }),
    accountIds.length > 0
      ? supabase.from("expenses").select("*").in("account_id", accountIds)
      : Promise.resolve({ data: [] }),
    accountIds.length > 0
      ? supabase.from("withdrawals").select("*").in("account_id", accountIds)
      : Promise.resolve({ data: [] }),
    supabase.from("documents").select("*").eq("client_id", clientId).order("uploaded_at", { ascending: false }),
    supabase.from("business_arms").select("*").order("name"),
    supabase.from("services").select("*").order("name"),
    supabase.from("crm_opportunities").select("*").eq("client_id", clientId).order("updated_at", { ascending: false }),
    supabase.from("crm_activities").select("*").eq("client_id", clientId).order("activity_date", { ascending: false }),
    supabase.from("revenue_records").select("*").eq("client_id", clientId).order("recorded_on", { ascending: false }),
  ]);

  const entryList = (entries ?? []) as PerformanceEntry[];
  const expenseList = (expenses ?? []) as Expense[];
  const withdrawalList = (withdrawals ?? []) as Withdrawal[];
  const documentList = (documents ?? []) as ClientDocument[];
  const armList = (arms ?? []) as BusinessArm[];
  const serviceList = (services ?? []) as Service[];
  const opportunityList = (opportunities ?? []) as CrmOpportunity[];
  const activityList = (activities ?? []) as CrmActivity[];
  const revenueList = (revenue ?? []) as RevenueRecord[];

  const analytics = accountList.map((account) =>
    computeAccountAnalytics(
      account,
      entryList.filter((e) => e.account_id === account.id),
      expenseList.filter((e) => e.account_id === account.id),
      withdrawalList.filter((w) => w.account_id === account.id)
    )
  );
  const totals = computePortfolioTotals(analytics);
  const serviceRevenue = sumRevenue(revenueList, ["received"]);
  const bookedRevenue = sumRevenue(revenueList, ["received", "invoiced"]);
  const pipelineValue = weightedPipeline(opportunityList);
  const portalStatus = resolvedSearchParams?.portal;
  const portalMessage =
    portalStatus === "login-ready"
      ? "Client portal login is ready. Share the temporary password securely."
      : portalStatus === "invalid"
        ? "Enter a client email and a temporary password with at least 8 characters."
        : portalStatus === "unauthorized"
          ? "Only internal users can manage client portal access."
          : portalStatus === "error"
            ? "Could not create or update the client portal login."
            : null;

  const documentsWithUrls = await Promise.all(
    documentList.map(async (doc) => {
      const { data } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return { ...doc, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-fog-100">{(client as Client).name}</h1>
        <p className="mt-1 text-sm text-fog-500">Client profile, accounts, and documents.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold">Service Revenue</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(serviceRevenue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Booked Revenue</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(bookedRevenue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Weighted Pipeline</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(pipelineValue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Activities</p>
          <p className="mt-2 font-display text-xl text-fog-100">{activityList.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Value</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(totals.totalValue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Spend</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(totals.totalSpend)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Extracted</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(totals.totalExtracted)}</p>
        </div>
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold">ROI</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatPercent(totals.roi)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
              <tr>
                <th className="px-4 py-3">Opportunity</th>
                <th className="px-4 py-3">Arm</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {opportunityList.map((opportunity) => (
                <tr key={opportunity.id}>
                  <td className="px-4 py-3 text-fog-100">{opportunity.title}</td>
                  <td className="px-4 py-3 text-fog-400">{armName(opportunity.business_arm_id, armList)}</td>
                  <td className="px-4 py-3 text-fog-400">{labelize(opportunity.stage)}</td>
                  <td className="px-4 py-3 text-fog-200">{formatCurrency(opportunity.value)}</td>
                </tr>
              ))}
              {opportunityList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-fog-600">
                    No CRM opportunities for this client yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Recent CRM Activity</h2>
          <ul className="mt-4 divide-y divide-white/5">
            {activityList.slice(0, 6).map((activity) => (
              <li key={activity.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-fog-100">{activity.subject}</p>
                  <span className="shrink-0 text-xs text-fog-600">
                    {new Date(activity.activity_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fog-500">
                  {labelize(activity.activity_type)} · {armName(activity.business_arm_id, armList)}
                </p>
                {activity.next_step && <p className="mt-1 text-xs text-gold">Next: {activity.next_step}</p>}
              </li>
            ))}
            {activityList.length === 0 && (
              <li className="py-3 text-sm text-fog-600">No activity logged yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Arm</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {revenueList.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3 text-fog-100">{formatCurrency(record.amount)}</td>
                <td className="px-4 py-3 text-fog-400">{armName(record.business_arm_id, armList)}</td>
                <td className="px-4 py-3 text-fog-400">{serviceName(record.service_id, serviceList)}</td>
                <td className="px-4 py-3 text-fog-400">{labelize(record.status)}</td>
                <td className="px-4 py-3 text-fog-500">
                  {new Date(record.recorded_on).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {revenueList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-fog-600">
                  No CRM revenue recorded for this client yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Contact Info</h2>
          {portalMessage && (
            <p
              className={[
                "mt-3 rounded-lg border px-3 py-2 text-xs",
                portalStatus === "login-ready"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300",
              ].join(" ")}
            >
              {portalMessage}
            </p>
          )}
          <form action={updateClientAction} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={(client as Client).id} />
            <div>
              <label className={labelClasses}>Name</label>
              <input name="name" required defaultValue={(client as Client).name} className={inputClasses} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  name="contact_email"
                  type="email"
                  defaultValue={(client as Client).contact_email ?? ""}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={(client as Client).phone ?? ""}
                  className={inputClasses}
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Notes</label>
              <textarea
                name="notes"
                rows={4}
                defaultValue={(client as Client).notes ?? ""}
                className={inputClasses}
              />
            </div>
            <button type="submit" className={submitClasses}>
              Save
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Client Portal Access</h2>
          <p className="mt-1 text-xs text-fog-500">
            Create or reset this client&apos;s login for the portal.
          </p>
          <form action={createClientPortalLoginAction} className="mt-4 space-y-4">
            <input type="hidden" name="client_id" value={(client as Client).id} />
            <div>
              <label className={labelClasses}>Full Name</label>
              <input
                name="full_name"
                defaultValue={(client as Client).name}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Login Email</label>
              <input
                name="email"
                type="email"
                required
                defaultValue={(client as Client).contact_email ?? ""}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Temporary Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClasses}
              />
              <p className="mt-1 text-xs text-fog-600">
                Use a fresh temporary password and send it through a secure channel.
              </p>
            </div>
            <button type="submit" className={submitClasses}>
              Create / Reset Portal Login
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Record a Withdrawal</h2>
          <p className="mt-1 text-xs text-fog-500">
            Money paid out of one of this client&apos;s accounts — payouts, profit splits, live
            withdrawals. This is what &quot;extracted value&quot; is built from.
          </p>
          <form action={addWithdrawalAction} className="mt-4 space-y-4">
            <input type="hidden" name="client_id" value={(client as Client).id} />
            <div>
              <label className={labelClasses}>Account</label>
              <select name="account_id" required className={inputClasses}>
                {accountList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Amount</label>
                <input name="amount" type="number" step="0.01" required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Date</label>
                <input name="withdrawn_on" type="date" required className={inputClasses} />
              </div>
            </div>
            <button type="submit" className={submitClasses} disabled={accountList.length === 0}>
              Record Withdrawal
            </button>
            {accountList.length === 0 && (
              <p className="text-xs text-fog-600">Add an account for this client first, from Trading.</p>
            )}
          </form>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Equity</th>
              <th className="px-4 py-3">Extracted</th>
              <th className="px-4 py-3">Total Value</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {accountList.map((account) => {
              const a = analytics.find((x) => x.accountId === account.id)!;
              return (
                <tr key={account.id}>
                  <td className="px-4 py-3 text-fog-100">{account.label}</td>
                  <td className="px-4 py-3 capitalize text-fog-400">{account.account_type}</td>
                  <td className="px-4 py-3 text-fog-400">
                    {formatCurrency(a.latestEquity ?? a.latestBalance)}
                  </td>
                  <td className="px-4 py-3 text-fog-400">{formatCurrency(a.extractedValue)}</td>
                  <td className="px-4 py-3 text-fog-200">{formatCurrency(a.totalValue)}</td>
                  <td className="px-4 py-3 text-fog-200">{formatPercent(a.roi)}</td>
                </tr>
              );
            })}
            {accountList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-fog-600">
                  No accounts linked to this client yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Categorized Document Vault */}
      <ClientDocumentsGrouped
        client={client as Client}
        documents={documentsWithUrls}
      />
    </div>
  );
}
