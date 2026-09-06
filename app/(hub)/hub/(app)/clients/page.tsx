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
    <div>
      <h1 className="font-display text-2xl text-fog-100">Clients</h1>
      <p className="mt-1 text-sm text-fog-500">
        Everyone you&apos;re working with, and what they&apos;re worth.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Service Revenue</th>
              <th className="px-4 py-3">Pipeline</th>
              <th className="px-4 py-3">Accounts</th>
              <th className="px-4 py-3">Total Value</th>
              <th className="px-4 py-3">Extracted</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(({ client, accountCount, serviceRevenue, pipelineValue, totals }) => (
              <tr key={client.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/hub/clients/${client.id}`}
                    className="text-fog-100 transition-colors hover:text-gold"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-fog-400">
                  {client.contact_email ?? "—"}
                  {client.phone && (
                    <span className="block text-xs text-fog-600">{client.phone}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-fog-200">{formatCurrency(serviceRevenue)}</td>
                <td className="px-4 py-3 text-fog-400">{formatCurrency(pipelineValue)}</td>
                <td className="px-4 py-3 text-fog-400">{accountCount}</td>
                <td className="px-4 py-3 text-fog-200">{formatCurrency(totals.totalValue)}</td>
                <td className="px-4 py-3 text-fog-400">{formatCurrency(totals.totalExtracted)}</td>
                <td className="px-4 py-3 text-fog-200">{formatPercent(totals.roi)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-fog-600">
                  No clients yet — add one from Trading.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
