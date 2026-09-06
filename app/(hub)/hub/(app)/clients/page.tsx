import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  computeAccountAnalytics,
  computePortfolioTotals,
  formatCurrency,
  formatPercent,
} from "@/lib/hub/analytics";
import { sumRevenue, weightedPipeline } from "@/lib/hub/crm";
import type {
  Client,
  CrmOpportunity,
  Expense,
  PerformanceEntry,
  RevenueRecord,
  TradingAccount,
  Withdrawal,
} from "@/lib/hub/types";
import { createClientAction } from "./actions";

export default async function ClientsPage() {
  const supabase = await createClient();

  const [
    { data: clients },
    { data: accounts },
    { data: entries },
    { data: expenses },
    { data: withdrawals },
    { data: opportunities },
    { data: revenue },
  ] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("trading_accounts").select("*"),
    supabase.from("performance_entries").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("withdrawals").select("*"),
    supabase.from("crm_opportunities").select("*"),
    supabase.from("revenue_records").select("*"),
  ]);

  const clientList = (clients ?? []) as Client[];
  const accountList = (accounts ?? []) as TradingAccount[];
  const entryList = (entries ?? []) as PerformanceEntry[];
  const expenseList = (expenses ?? []) as Expense[];
  const withdrawalList = (withdrawals ?? []) as Withdrawal[];
  const opportunityList = (opportunities ?? []) as CrmOpportunity[];
  const revenueList = (revenue ?? []) as RevenueRecord[];

  const rows = clientList.map((client) => {
    const clientAccounts = accountList.filter((a) => a.client_id === client.id);
    const clientOpportunities = opportunityList.filter((opportunity) => opportunity.client_id === client.id);
    const clientRevenue = revenueList.filter((record) => record.client_id === client.id);
    const analytics = clientAccounts.map((account) =>
      computeAccountAnalytics(
        account,
        entryList.filter((e) => e.account_id === account.id),
        expenseList.filter((e) => e.account_id === account.id),
        withdrawalList.filter((w) => w.account_id === account.id)
      )
    );
    return {
      client,
      accountCount: clientAccounts.length,
      serviceRevenue: sumRevenue(clientRevenue, ["received"]),
      pipelineValue: weightedPipeline(clientOpportunities),
      totals: computePortfolioTotals(analytics),
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-fog-100">Clients & Portfolios</h1>
          <p className="mt-1 text-sm text-fog-400">
            Manage your client companies, contracts, trading accounts, and portal logins.
          </p>
        </div>

        <details className="group relative">
          <summary className="flex cursor-pointer items-center gap-2 rounded-lg border border-gold/50 bg-gold px-4 py-2 text-sm font-semibold text-ink-950 shadow transition-all hover:bg-gold-light">
            <span>+ Add New Client</span>
          </summary>
          <div className="absolute right-0 top-12 z-20 w-96 rounded-xl border border-white/10 bg-ink-950/95 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="font-display text-base font-semibold text-fog-100">Register New Client</h3>
            <p className="mt-1 text-xs text-fog-400">
              Create an account record to track contracts, billing, and portal access.
            </p>
            <form action={createClientAction} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                  Client / Company Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Apex Global Logistics"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                  Contact Email
                </label>
                <input
                  name="contact_email"
                  type="email"
                  placeholder="e.g. billing@apex.com"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                  Phone Number
                </label>
                <input
                  name="phone"
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                  Notes / Mandate
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Initial scope, sector, or operating notes..."
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg border border-gold/50 bg-gold py-2 text-sm font-semibold text-ink-950 hover:bg-gold-light"
              >
                Create Client Profile
              </button>
            </form>
          </div>
        </details>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Clients</p>
          <p className="mt-1 font-display text-2xl text-fog-100">{clientList.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Revenue</p>
          <p className="mt-1 font-display text-2xl text-gold">
            {formatCurrency(rows.reduce((sum, r) => sum + r.serviceRevenue, 0))}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Weighted Pipeline</p>
          <p className="mt-1 font-display text-2xl text-fog-100">
            {formatCurrency(rows.reduce((sum, r) => sum + r.pipelineValue, 0))}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Trading Accounts</p>
          <p className="mt-1 font-display text-2xl text-fog-100">{accountList.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-950/60 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-widest2 text-fog-400">
            <tr>
              <th className="px-5 py-3.5">Client Entity</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Service Revenue</th>
              <th className="px-5 py-3.5">Pipeline</th>
              <th className="px-5 py-3.5">Trading Desk</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(({ client, accountCount, serviceRevenue, pipelineValue, totals }) => (
              <tr key={client.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <Link
                    href={`/hub/clients/${client.id}`}
                    className="font-medium text-fog-100 transition-colors hover:text-gold"
                  >
                    {client.name}
                  </Link>
                  {client.notes && (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-fog-500">{client.notes}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-fog-300">
                  {client.contact_email ? (
                    <a href={`mailto:${client.contact_email}`} className="hover:underline">
                      {client.contact_email}
                    </a>
                  ) : (
                    <span className="text-fog-600">—</span>
                  )}
                  {client.phone && (
                    <span className="block text-xs text-fog-500">{client.phone}</span>
                  )}
                </td>
                <td className="px-5 py-4 font-semibold text-fog-100">
                  {formatCurrency(serviceRevenue)}
                </td>
                <td className="px-5 py-4 text-fog-300">
                  {pipelineValue > 0 ? formatCurrency(pipelineValue) : "—"}
                </td>
                <td className="px-5 py-4 text-fog-300">
                  {accountCount > 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="rounded bg-gold/10 px-2 py-0.5 text-xs text-gold">
                        {accountCount} {accountCount === 1 ? "Account" : "Accounts"}
                      </span>
                      <span className="text-xs text-fog-400">{formatCurrency(totals.totalValue)}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-fog-600">None</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/hub/clients/${client.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-fog-200 transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    Open Profile →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-fog-500">
                  <p className="font-display text-base text-fog-300">No client companies registered yet.</p>
                  <p className="mt-1 text-xs text-fog-500">
                    Click &quot;+ Add New Client&quot; above to onboard your first enterprise client.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
