import { createClient } from "@/lib/supabase/server";
import {
  computeAccountAnalytics,
  computePortfolioTotals,
  formatCurrency,
  formatPercent,
} from "@/lib/hub/analytics";
import type { ClientDocument, Expense, PerformanceEntry, TradingAccount, Withdrawal } from "@/lib/hub/types";

// No explicit client_id filtering here — RLS does that automatically.
// The "clients can read their own trading_accounts" policy (and the
// matching policies on performance_entries/expenses/withdrawals/documents)
// means every query below only ever returns rows belonging to the
// signed-in client's own client_id, using the exact same query an
// internal user would run.
export default async function PortalPage() {
  const supabase = createClient();

  const [{ data: accounts }, { data: entries }, { data: expenses }, { data: withdrawals }, { data: documents }] =
    await Promise.all([
      supabase.from("trading_accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("performance_entries").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("withdrawals").select("*"),
      supabase.from("documents").select("*").order("uploaded_at", { ascending: false }),
    ]);

  const accountList = (accounts ?? []) as TradingAccount[];
  const entryList = (entries ?? []) as PerformanceEntry[];
  const expenseList = (expenses ?? []) as Expense[];
  const withdrawalList = (withdrawals ?? []) as Withdrawal[];
  const documentList = (documents ?? []) as ClientDocument[];

  const analytics = accountList.map((account) =>
    computeAccountAnalytics(
      account,
      entryList.filter((e) => e.account_id === account.id),
      expenseList.filter((e) => e.account_id === account.id),
      withdrawalList.filter((w) => w.account_id === account.id)
    )
  );
  const portfolio = computePortfolioTotals(analytics);

  const documentsWithUrls = await Promise.all(
    documentList.map(async (doc) => {
      const { data } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return { ...doc, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-2xl text-fog-100">Your Portfolio</h1>
        <p className="mt-1 text-sm text-fog-500">
          A live view of your accounts with Flectēre.
        </p>
      </div>

      {accountList.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Value</p>
            <p className="mt-2 font-display text-2xl text-fog-100">
              {formatCurrency(portfolio.totalValue)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Spend</p>
            <p className="mt-2 font-display text-2xl text-fog-100">
              {formatCurrency(portfolio.totalSpend)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-widest2 text-fog-500">Extracted</p>
            <p className="mt-2 font-display text-2xl text-fog-100">
              {formatCurrency(portfolio.totalExtracted)}
            </p>
          </div>
          <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
            <p className="text-xs uppercase tracking-widest2 text-gold">ROI</p>
            <p className="mt-2 font-display text-2xl text-fog-100">
              {formatPercent(portfolio.roi)}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {accountList.map((account) => {
          const a = analytics.find((x) => x.accountId === account.id)!;
          return (
            <div key={account.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg text-fog-100">{account.label}</h2>
                <span className="text-xs uppercase tracking-widest2 text-fog-500">
                  {account.account_type} · {account.broker_or_prop_firm ?? "—"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div>
                  <p className="text-xs text-fog-500">Balance</p>
                  <p className="mt-1 text-fog-200">{formatCurrency(a.latestBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-fog-500">Equity</p>
                  <p className="mt-1 text-fog-200">{formatCurrency(a.latestEquity)}</p>
                </div>
                <div>
                  <p className="text-xs text-fog-500">Extracted</p>
                  <p className="mt-1 text-fog-200">{formatCurrency(a.extractedValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-fog-500">Total Value</p>
                  <p className="mt-1 text-fog-200">{formatCurrency(a.totalValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-fog-500">ROI</p>
                  <p className="mt-1 text-fog-200">{formatPercent(a.roi)}</p>
                </div>
              </div>
            </div>
          );
        })}

        {accountList.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-fog-500">
            No accounts linked to your profile yet. Reach out if you think
            this is wrong.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <p className="eyebrow mb-4 text-fog-500">Documents</p>
        <ul className="divide-y divide-white/5">
          {documentsWithUrls.map((doc) => (
            <li key={doc.id} className="py-3">
              {doc.url ? (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-fog-100 underline decoration-white/20 underline-offset-4 hover:text-gold"
                >
                  {doc.label}
                </a>
              ) : (
                <span className="text-sm text-fog-400">{doc.label}</span>
              )}
              <p className="text-xs text-fog-600">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
            </li>
          ))}
          {documentsWithUrls.length === 0 && (
            <li className="py-3 text-sm text-fog-600">Nothing shared with you yet.</li>
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <p className="eyebrow mb-2 text-fog-500">Engagement Status</p>
        <p className="text-sm text-fog-500">
          This section is a placeholder — once we know what you want visible
          here (Sense/Shape/Shift/Scale progress, next steps), it&apos;ll show
          up in this space.
        </p>
      </div>
    </div>
  );
}
