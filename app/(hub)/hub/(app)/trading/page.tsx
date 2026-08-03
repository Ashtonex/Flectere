import { createClient } from "@/lib/supabase/server";
import {
  computeAccountAnalytics,
  computePortfolioTotals,
  formatCurrency,
  formatPercent,
} from "@/lib/hub/analytics";
import type { Client, Expense, PerformanceEntry, TradingAccount } from "@/lib/hub/types";
import {
  addExpenseAction,
  addPerformanceEntryAction,
  createAccountAction,
  createClientAction,
} from "./actions";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-ink-900 px-4 py-2 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold hover:text-ink-950";

export default async function TradingPage() {
  const supabase = createClient();

  const [{ data: accounts }, { data: entries }, { data: expenses }, { data: clients }] =
    await Promise.all([
      supabase.from("trading_accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("performance_entries").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("clients").select("*").order("name"),
    ]);

  const accountList = (accounts ?? []) as TradingAccount[];
  const entryList = (entries ?? []) as PerformanceEntry[];
  const expenseList = (expenses ?? []) as Expense[];
  const clientList = (clients ?? []) as Client[];

  const analytics = accountList.map((account) =>
    computeAccountAnalytics(
      account,
      entryList.filter((e) => e.account_id === account.id),
      expenseList.filter((e) => e.account_id === account.id)
    )
  );
  const portfolio = computePortfolioTotals(analytics);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-2xl text-fog-100">Trading</h1>
        <p className="mt-1 text-sm text-fog-500">
          Funded accounts, spend, and performance in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Spend</p>
          <p className="mt-2 font-display text-2xl text-fog-100">
            {formatCurrency(portfolio.totalSpend)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Return</p>
          <p className="mt-2 font-display text-2xl text-fog-100">
            {formatCurrency(portfolio.totalReturn)}
          </p>
        </div>
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold">ROI</p>
          <p className="mt-2 font-display text-2xl text-fog-100">
            {formatPercent(portfolio.roi)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Broker / Prop Firm</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Equity</th>
              <th className="px-4 py-3">Spend</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {accountList.map((account) => {
              const a = analytics.find((x) => x.accountId === account.id)!;
              const client = clientList.find((c) => c.id === account.client_id);
              return (
                <tr key={account.id}>
                  <td className="px-4 py-3 text-fog-100">{account.label}</td>
                  <td className="px-4 py-3 text-fog-400">{account.broker_or_prop_firm ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-fog-400">{account.account_type}</td>
                  <td className="px-4 py-3 text-fog-400">{client?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-fog-200">
                    {formatCurrency(a.latestEquity ?? a.latestBalance)}
                  </td>
                  <td className="px-4 py-3 text-fog-400">{formatCurrency(a.totalSpend)}</td>
                  <td className="px-4 py-3 text-fog-200">{formatPercent(a.roi)}</td>
                </tr>
              );
            })}
            {accountList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fog-600">
                  No accounts yet — add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Add Client</h2>
          <form action={createClientAction} className="mt-4 space-y-4">
            <div>
              <label className={labelClasses}>Name</label>
              <input name="name" required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Contact Email</label>
              <input name="contact_email" type="email" className={inputClasses} />
            </div>
            <button type="submit" className={submitClasses}>
              Add Client
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Add Account</h2>
          <form action={createAccountAction} className="mt-4 space-y-4">
            <div>
              <label className={labelClasses}>Label</label>
              <input name="label" required className={inputClasses} placeholder="e.g. FTMO 100K #1" />
            </div>
            <div>
              <label className={labelClasses}>Broker / Prop Firm</label>
              <input name="broker_or_prop_firm" className={inputClasses} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Type</label>
                <select name="account_type" className={inputClasses}>
                  <option value="challenge">Challenge</option>
                  <option value="funded">Funded</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Starting Balance</label>
                <input name="starting_balance" type="number" step="0.01" className={inputClasses} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Client (optional)</label>
              <select name="client_id" className={inputClasses}>
                <option value="">— Internal / unassigned —</option>
                {clientList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={submitClasses}>
              Add Account
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Add Performance Entry</h2>
          <form action={addPerformanceEntryAction} className="mt-4 space-y-4">
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
            <div>
              <label className={labelClasses}>Date</label>
              <input name="entry_date" type="date" required className={inputClasses} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Balance</label>
                <input name="balance" type="number" step="0.01" className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Equity</label>
                <input name="equity" type="number" step="0.01" className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>P&amp;L</label>
                <input name="pnl" type="number" step="0.01" className={inputClasses} />
              </div>
            </div>
            <button type="submit" className={submitClasses}>
              Add Entry
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Add Expense</h2>
          <form action={addExpenseAction} className="mt-4 space-y-4">
            <div>
              <label className={labelClasses}>Account (optional)</label>
              <select name="account_id" className={inputClasses}>
                <option value="">— Not tied to an account —</option>
                {accountList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Category</label>
                <select name="category" className={inputClasses}>
                  <option value="prop_fee">Prop Firm Fee</option>
                  <option value="deposit">Live Deposit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Amount</label>
                <input name="amount" type="number" step="0.01" required className={inputClasses} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Date Incurred</label>
              <input name="incurred_on" type="date" required className={inputClasses} />
            </div>
            <button type="submit" className={submitClasses}>
              Add Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
