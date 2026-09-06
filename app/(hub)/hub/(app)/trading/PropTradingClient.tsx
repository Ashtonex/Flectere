"use client";

import { useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/hub/analytics";
import type {
  Expense,
  PerformanceEntry,
  TradingAccount,
  Withdrawal,
} from "@/lib/hub/types";
import {
  createPropAccountAction,
  updatePropAccountAction,
  deletePropAccountAction,
  addPerformanceEntryAction,
  updatePerformanceEntryAction,
  deletePerformanceEntryAction,
  addPropPayoutAction,
  deletePropPayoutAction,
  addDeskExpenseAction,
  deleteDeskExpenseAction,
} from "./actions";

interface AccountStats {
  account: TradingAccount;
  latestEquity: number;
  latestBalance: number;
  totalPayouts: number;
  totalFees: number;
  netPnl: number;
  netProfitCash: number;
  payoutRoi: number | null;
  entryCount: number;
}

interface PropTradingClientProps {
  accounts: TradingAccount[];
  entries: PerformanceEntry[];
  expenses: Expense[];
  withdrawals: Withdrawal[];
}

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500 font-medium";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-gold px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-bright cursor-pointer";

export function PropTradingClient({
  accounts,
  entries,
  expenses,
  withdrawals,
}: PropTradingClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    accounts[0]?.id ?? null
  );
  const [activeTab, setActiveTab] = useState<"performance" | "payouts" | "expenses">("performance");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isAddPayoutOpen, setIsAddPayoutOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  const [editingEntry, setEditingEntry] = useState<PerformanceEntry | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Compute stats for every individual account
  const accountStats: AccountStats[] = accounts.map((account) => {
    const accEntries = entries
      .filter((e) => e.account_id === account.id)
      .sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));

    const latest = accEntries[0];
    const latestEquity = Number(latest?.equity ?? latest?.balance ?? account.starting_balance ?? 0);
    const latestBalance = Number(latest?.balance ?? account.starting_balance ?? 0);

    const accPayouts = withdrawals
      .filter((w) => w.account_id === account.id)
      .reduce((sum, w) => sum + Number(w.amount), 0);

    const accExpenses = expenses
      .filter((e) => e.account_id === account.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const cost = Number(account.challenge_cost ?? 0);
    const totalFees = accExpenses > 0 ? accExpenses : cost;

    const netProfitCash = accPayouts - totalFees;
    const payoutRoi = totalFees > 0 ? netProfitCash / totalFees : null;

    const netPnl =
      latestEquity - Number(account.starting_balance ?? 0) + accPayouts;

    return {
      account,
      latestEquity,
      latestBalance,
      totalPayouts: accPayouts,
      totalFees,
      netPnl,
      netProfitCash,
      payoutRoi,
      entryCount: accEntries.length,
    };
  });

  // Filtered accounts list
  const filteredAccountStats = accountStats.filter((item) => {
    if (filterType !== "all") {
      if (filterType === "funded" && item.account.account_type !== "funded") return false;
      if (filterType === "challenge" && item.account.account_type !== "challenge") return false;
      if (filterType === "live" && item.account.account_type !== "live") return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = item.account.label.toLowerCase().includes(q);
      const matchBroker = (item.account.broker_or_prop_firm ?? "").toLowerCase().includes(q);
      if (!matchLabel && !matchBroker) return false;
    }
    return true;
  });

  const selectedStats =
    accountStats.find((s) => s.account.id === selectedAccountId) ?? accountStats[0] ?? null;

  const selectedAccount = selectedStats?.account ?? null;

  // Entries, payouts, and expenses for selected account
  const selectedEntries = entries
    .filter((e) => e.account_id === selectedAccountId)
    .sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));

  const selectedPayouts = withdrawals
    .filter((w) => w.account_id === selectedAccountId)
    .sort((a, b) => (a.withdrawn_on < b.withdrawn_on ? 1 : -1));

  const selectedExpenses = expenses
    .filter((e) => e.account_id === selectedAccountId)
    .sort((a, b) => (a.incurred_on < b.incurred_on ? 1 : -1));

  // Desk portfolio aggregated metrics
  const totalDeskBalance = accountStats.reduce((sum, s) => sum + s.latestBalance, 0);
  const totalDeskEquity = accountStats.reduce((sum, s) => sum + s.latestEquity, 0);
  const totalDeskPayouts = accountStats.reduce((sum, s) => sum + s.totalPayouts, 0);
  const totalDeskFees = accountStats.reduce((sum, s) => sum + s.totalFees, 0);
  const netDeskCash = totalDeskPayouts - totalDeskFees;

  return (
    <div className="space-y-6">
      {/* Portfolio Top Cockpit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">Total Liquid Equity</p>
          <p className="mt-2 font-display text-2xl text-fog-100 font-mono">
            {formatCurrency(totalDeskEquity)}
          </p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">Balance: {formatCurrency(totalDeskBalance)}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">Prop Firm Payouts</p>
          <p className="mt-2 font-display text-2xl text-emerald-400 font-mono font-bold">
            {formatCurrency(totalDeskPayouts)}
          </p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">Realized cash in bank</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">Evaluation Fees Spent</p>
          <p className="mt-2 font-display text-2xl text-fog-100 font-mono">
            {formatCurrency(totalDeskFees)}
          </p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">Prop challenge amortisation</p>
        </div>

        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold font-bold">Net Realized Cash Profit</p>
          <p className="mt-2 font-display text-2xl text-fog-100 font-bold font-mono">
            {formatCurrency(netDeskCash)}
          </p>
          <p className="text-[10px] text-gold font-mono mt-1">
            Net ROI: {totalDeskFees > 0 ? formatPercent(netDeskCash / totalDeskFees) : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">Active Accounts</p>
          <p className="mt-2 font-display text-2xl text-fog-100 font-mono">
            {accounts.length}
          </p>
          <p className="text-[10px] text-fog-400 mt-1 font-mono">
            {accounts.filter((a) => a.account_type === "funded").length} Funded • {accounts.filter((a) => a.account_type === "challenge").length} Challenge
          </p>
        </div>
      </div>

      {/* Main Two-Column Master/Detail Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start">
        {/* Left Column: Account Directory & Switcher */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-fog-100">Trading Accounts</h2>
              <p className="text-xs text-fog-500">Prop challenges & personal capital</p>
            </div>
            <button
              onClick={() => setIsAddAccountOpen(true)}
              className="rounded-lg border border-gold/50 bg-gold px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
            >
              + Add Account
            </button>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search account label or firm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-fog-100 placeholder-fog-600 focus:border-gold/50 outline-none"
            />
            <div className="flex gap-1.5 text-xs">
              {["all", "funded", "challenge", "live"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`flex-1 rounded-md py-1 text-[11px] font-medium capitalize transition cursor-pointer ${
                    filterType === t
                      ? "bg-gold text-ink-950 font-bold"
                      : "bg-white/[0.03] text-fog-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Account Cards List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredAccountStats.map((item) => {
              const isSelected = item.account.id === selectedAccountId;
              return (
                <div
                  key={item.account.id}
                  onClick={() => setSelectedAccountId(item.account.id)}
                  className={`rounded-xl border p-3.5 space-y-2 cursor-pointer transition ${
                    isSelected
                      ? "border-gold bg-gold/5 shadow-[0_0_20px_rgba(198,161,89,0.15)]"
                      : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-xs font-bold leading-snug ${isSelected ? "text-gold" : "text-fog-100"}`}>
                        {item.account.label}
                      </h3>
                      <p className="text-[11px] text-fog-500">
                        {item.account.broker_or_prop_firm ?? "Self-Managed Desk"}
                      </p>
                    </div>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        item.account.account_type === "funded"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : item.account.account_type === "live"
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {item.account.phase ? item.account.phase.replace("_", " ") : item.account.account_type}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-fog-500 block">Current Equity</span>
                      <span className="font-mono font-bold text-white">
                        {formatCurrency(item.latestEquity)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-fog-500 block">Cash Payouts</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(item.totalPayouts)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAccountStats.length === 0 && (
              <div className="py-8 text-center text-xs text-fog-600">
                No accounts match &quot;{searchQuery || filterType}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Individual Account Detail Inspector */}
        {selectedStats ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
            {/* Account Header Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded bg-gold/20 text-gold border border-gold/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {selectedAccount?.account_type} ACCOUNT
                  </span>
                  <span className="text-xs text-fog-400">
                    Prop Firm / Broker: <strong className="text-fog-200">{selectedAccount?.broker_or_prop_firm ?? "Independent"}</strong>
                  </span>
                  {selectedAccount?.fee_refunded && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                      FEE REFUNDED
                    </span>
                  )}
                </div>

                <h2 className="font-display text-2xl text-fog-100 mt-1">
                  {selectedAccount?.label}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddEntryOpen(true)}
                  className="rounded-lg border border-gold/50 bg-gold px-3.5 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                >
                  + Log Entry
                </button>
                <button
                  onClick={() => setIsAddPayoutOpen(true)}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                >
                  + Record Payout
                </button>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-fog-200 hover:bg-white/[0.06] transition cursor-pointer"
                >
                  + Fee / Expense
                </button>
                <button
                  onClick={() => setEditingAccount(selectedAccount)}
                  className="rounded-lg border border-white/10 p-1.5 text-xs text-fog-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                  title="Edit Account Settings"
                >
                  ⚙️ Edit
                </button>
              </div>
            </div>

            {/* Account Specific Accounting Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <span className="text-[10px] uppercase text-fog-500 font-bold block">Latest Equity</span>
                <p className="font-mono text-xl font-bold text-white mt-1">
                  {formatCurrency(selectedStats.latestEquity)}
                </p>
                <span className="text-[10px] text-fog-500 font-mono">
                  Starting: {formatCurrency(Number(selectedAccount?.starting_balance ?? 0))}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <span className="text-[10px] uppercase text-fog-500 font-bold block">Gross Payouts</span>
                <p className="font-mono text-xl font-bold text-emerald-400 mt-1">
                  {formatCurrency(selectedStats.totalPayouts)}
                </p>
                <span className="text-[10px] text-fog-500 font-mono">
                  {selectedPayouts.length} profit withdrawal{selectedPayouts.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <span className="text-[10px] uppercase text-fog-500 font-bold block">Challenge Cost</span>
                <p className="font-mono text-xl font-bold text-fog-200 mt-1">
                  {formatCurrency(selectedStats.totalFees)}
                </p>
                <span className="text-[10px] text-fog-500 font-mono">
                  {selectedAccount?.fee_refunded ? "Evaluation recovered" : "Risk amortised"}
                </span>
              </div>

              <div className="rounded-xl border border-gold/25 bg-gold/5 p-4">
                <span className="text-[10px] uppercase text-gold font-bold block">Net Cash Extracted</span>
                <p className="font-mono text-xl font-bold text-fog-100 mt-1">
                  {formatCurrency(selectedStats.netProfitCash)}
                </p>
                <span className="text-[10px] text-gold font-mono font-semibold">
                  ROI: {selectedStats.payoutRoi !== null ? formatPercent(selectedStats.payoutRoi) : "—"}
                </span>
              </div>
            </div>

            {/* Tab Navigation: Performance Ledger vs Payouts vs Expenses */}
            <div className="border-b border-white/10 flex gap-4">
              <button
                onClick={() => setActiveTab("performance")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-[1px] ${
                  activeTab === "performance"
                    ? "border-gold text-gold"
                    : "border-transparent text-fog-400 hover:text-white"
                }`}
              >
                Performance Journal ({selectedEntries.length})
              </button>
              <button
                onClick={() => setActiveTab("payouts")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-[1px] ${
                  activeTab === "payouts"
                    ? "border-gold text-gold"
                    : "border-transparent text-fog-400 hover:text-white"
                }`}
              >
                Profit Payouts ({selectedPayouts.length})
              </button>
              <button
                onClick={() => setActiveTab("expenses")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-[1px] ${
                  activeTab === "expenses"
                    ? "border-gold text-gold"
                    : "border-transparent text-fog-400 hover:text-white"
                }`}
              >
                Evaluation Fees & Expenses ({selectedExpenses.length})
              </button>
            </div>

            {/* TAB 1: PERFORMANCE JOURNAL LEDGER */}
            {activeTab === "performance" && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Balance</th>
                        <th className="px-4 py-3">Equity</th>
                        <th className="px-4 py-3">P&amp;L</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {selectedEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-fog-200">
                            {new Date(entry.entry_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-fog-300">
                            {formatCurrency(entry.balance)}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            {formatCurrency(entry.equity)}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            {entry.pnl !== null ? (
                              <span className={entry.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                {entry.pnl >= 0 ? "+" : ""}
                                {formatCurrency(entry.pnl)}
                              </span>
                            ) : (
                              <span className="text-fog-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-sans text-fog-400 text-xs max-w-xs truncate">
                            {entry.notes ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-sans">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingEntry(entry)}
                                className="text-gold hover:underline text-xs cursor-pointer"
                              >
                                Edit
                              </button>
                              <form action={deletePerformanceEntryAction}>
                                <input type="hidden" name="id" value={entry.id} />
                                <button
                                  type="submit"
                                  onClick={(e) => {
                                    if (!confirm("Delete this performance entry?")) e.preventDefault();
                                  }}
                                  className="text-fog-500 hover:text-rose-400 text-xs cursor-pointer"
                                >
                                  Delete
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {selectedEntries.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-fog-600 font-sans">
                            No performance records for this account yet. Click &quot;+ Log Entry&quot; above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: PAYOUTS LEDGER */}
            {activeTab === "payouts" && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
                      <tr>
                        <th className="px-4 py-3">Date Disbursed</th>
                        <th className="px-4 py-3">Payout Amount</th>
                        <th className="px-4 py-3">Notes & Reference</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {selectedPayouts.map((w) => (
                        <tr key={w.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-fog-200">
                            {new Date(w.withdrawn_on).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-400 text-sm">
                            +{formatCurrency(w.amount)}
                          </td>
                          <td className="px-4 py-3 font-sans text-fog-400">
                            {w.notes ?? "Profit Share Payout"}
                          </td>
                          <td className="px-4 py-3 font-sans">
                            <form action={deletePropPayoutAction}>
                              <input type="hidden" name="id" value={w.id} />
                              <button
                                type="submit"
                                onClick={(e) => {
                                  if (!confirm("Delete this recorded payout?")) e.preventDefault();
                                }}
                                className="text-fog-500 hover:text-rose-400 text-xs cursor-pointer"
                              >
                                Delete
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                      {selectedPayouts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-fog-600 font-sans">
                            No payouts logged yet for this account. Click &quot;+ Record Payout&quot; once funds clear.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: FEES & EXPENSES LEDGER */}
            {activeTab === "expenses" && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
                      <tr>
                        <th className="px-4 py-3">Date Incurred</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Cost Amount</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {selectedExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-fog-200">
                            {new Date(exp.incurred_on).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 capitalize text-fog-300">
                            {exp.category.replace("_", " ")}
                          </td>
                          <td className="px-4 py-3 font-bold text-rose-400">
                            -{formatCurrency(exp.amount, exp.currency)}
                          </td>
                          <td className="px-4 py-3 font-sans text-fog-400">
                            {exp.notes ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-sans">
                            <form action={deleteDeskExpenseAction}>
                              <input type="hidden" name="id" value={exp.id} />
                              <button
                                type="submit"
                                onClick={(e) => {
                                  if (!confirm("Delete this expense record?")) e.preventDefault();
                                }}
                                className="text-fog-500 hover:text-rose-400 text-xs cursor-pointer"
                              >
                                Delete
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                      {selectedExpenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-fog-600 font-sans">
                            No specific expenses recorded for this account.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-fog-500 space-y-3">
            <p className="text-base font-medium text-fog-300">No Trading Accounts Found</p>
            <p className="text-xs max-w-sm mx-auto">
              Add your first proprietary firm account or live capital trading portfolio to begin tracking live performance.
            </p>
            <button
              onClick={() => setIsAddAccountOpen(true)}
              className={submitClasses}
            >
              + Create First Account
            </button>
          </div>
        )}
      </div>

      {/* MODAL: ADD ACCOUNT */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-lg text-fog-100">Add Proprietary Account</h3>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await createPropAccountAction(formData);
                setIsAddAccountOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className={labelClasses}>Account Label *</label>
                <input
                  name="label"
                  required
                  className={inputClasses}
                  placeholder="e.g. Apex 150K Static #1, FTMO 100K Swing"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Prop Firm / Broker</label>
                  <input
                    name="broker_or_prop_firm"
                    className={inputClasses}
                    placeholder="e.g. Apex, Topstep, FTMO, TradeLocker"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Account Type</label>
                  <select name="account_type" defaultValue="challenge" className={inputClasses}>
                    <option value="challenge">Prop Challenge / Evaluation</option>
                    <option value="funded">Funded Account (PA / Master)</option>
                    <option value="live">Personal Live Capital</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Current Phase</label>
                  <select name="phase" defaultValue="phase_1" className={inputClasses}>
                    <option value="phase_1">Phase 1 / Evaluation</option>
                    <option value="phase_2">Phase 2 / Verification</option>
                    <option value="funded">Funded / PA</option>
                    <option value="live">Live Capital</option>
                    <option value="blown">Blown / Inactive</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Allocation Size / Starting Balance ($)</label>
                  <input
                    name="starting_balance"
                    type="number"
                    step="0.01"
                    className={inputClasses}
                    placeholder="e.g. 100000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Evaluation Fee / Challenge Cost ($)</label>
                  <input
                    name="challenge_cost"
                    type="number"
                    step="0.01"
                    className={inputClasses}
                    placeholder="e.g. 299"
                  />
                </div>
                <div className="flex flex-col justify-center pt-5">
                  <label className="text-xs font-medium text-fog-200 flex items-center gap-2 cursor-pointer">
                    <input
                      name="fee_refunded"
                      type="checkbox"
                      value="true"
                      className="rounded border-white/20 text-gold focus:ring-gold"
                    />
                    Fee already refunded by firm?
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ACCOUNT */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-lg text-fog-100">Edit Account Settings</h3>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await updatePropAccountAction(formData);
                setEditingAccount(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingAccount.id} />

              <div>
                <label className={labelClasses}>Account Label *</label>
                <input
                  name="label"
                  required
                  defaultValue={editingAccount.label}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Prop Firm / Broker</label>
                  <input
                    name="broker_or_prop_firm"
                    defaultValue={editingAccount.broker_or_prop_firm ?? ""}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Account Type</label>
                  <select name="account_type" defaultValue={editingAccount.account_type} className={inputClasses}>
                    <option value="challenge">Prop Challenge / Evaluation</option>
                    <option value="funded">Funded Account (PA / Master)</option>
                    <option value="live">Personal Live Capital</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Current Phase</label>
                  <select name="phase" defaultValue={editingAccount.phase ?? "funded"} className={inputClasses}>
                    <option value="phase_1">Phase 1 / Evaluation</option>
                    <option value="phase_2">Phase 2 / Verification</option>
                    <option value="funded">Funded / PA</option>
                    <option value="live">Live Capital</option>
                    <option value="blown">Blown / Inactive</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Starting Balance ($)</label>
                  <input
                    name="starting_balance"
                    type="number"
                    step="0.01"
                    defaultValue={editingAccount.starting_balance ?? ""}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Evaluation Fee ($)</label>
                  <input
                    name="challenge_cost"
                    type="number"
                    step="0.01"
                    defaultValue={editingAccount.challenge_cost ?? ""}
                    className={inputClasses}
                  />
                </div>
                <div className="flex flex-col justify-center pt-5">
                  <label className="text-xs font-medium text-fog-200 flex items-center gap-2 cursor-pointer">
                    <input
                      name="fee_refunded"
                      type="checkbox"
                      value="true"
                      defaultChecked={editingAccount.fee_refunded}
                      className="rounded border-white/20 text-gold focus:ring-gold"
                    />
                    Fee refunded by firm?
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to permanently delete this trading account and all its logs?")) {
                      const formData = new FormData();
                      formData.append("id", editingAccount.id);
                      await deletePropAccountAction(formData);
                      setEditingAccount(null);
                    }
                  }}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                >
                  Delete Account
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className={submitClasses}>
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG PERFORMANCE ENTRY */}
      {isAddEntryOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="font-display text-lg text-fog-100">Log Daily Performance</h3>
                <p className="text-xs text-fog-500">{selectedAccount.label}</p>
              </div>
              <button
                onClick={() => setIsAddEntryOpen(false)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await addPerformanceEntryAction(formData);
                setIsAddEntryOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="account_id" value={selectedAccount.id} />

              <div>
                <label className={labelClasses}>Trading Date *</label>
                <input name="entry_date" type="date" required defaultValue={today} className={inputClasses} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Current Equity ($) *</label>
                  <input
                    name="equity"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={selectedStats?.latestEquity ?? ""}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Current Balance ($)</label>
                  <input
                    name="balance"
                    type="number"
                    step="0.01"
                    defaultValue={selectedStats?.latestBalance ?? ""}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Session Day P&amp;L ($)</label>
                <input
                  name="pnl"
                  type="number"
                  step="0.01"
                  placeholder="e.g. +1450 or -320"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Trading Notes / Strategy Setup</label>
                <textarea
                  name="notes"
                  rows={2}
                  className={inputClasses}
                  placeholder="e.g. NQ London open expansion, closed before CPI news..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddEntryOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PERFORMANCE ENTRY */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-lg text-fog-100">Edit Performance Entry</h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await updatePerformanceEntryAction(formData);
                setEditingEntry(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingEntry.id} />

              <div>
                <label className={labelClasses}>Trading Date *</label>
                <input
                  name="entry_date"
                  type="date"
                  required
                  defaultValue={editingEntry.entry_date}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Equity ($)</label>
                  <input
                    name="equity"
                    type="number"
                    step="0.01"
                    defaultValue={editingEntry.equity ?? ""}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Balance ($)</label>
                  <input
                    name="balance"
                    type="number"
                    step="0.01"
                    defaultValue={editingEntry.balance ?? ""}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Session Day P&amp;L ($)</label>
                <input
                  name="pnl"
                  type="number"
                  step="0.01"
                  defaultValue={editingEntry.pnl ?? ""}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Trading Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingEntry.notes ?? ""}
                  className={inputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYOUT */}
      {isAddPayoutOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="font-display text-lg text-fog-100">Record Prop Payout</h3>
                <p className="text-xs text-fog-500">{selectedAccount.label}</p>
              </div>
              <button
                onClick={() => setIsAddPayoutOpen(false)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await addPropPayoutAction(formData);
                setIsAddPayoutOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="account_id" value={selectedAccount.id} />

              <div>
                <label className={labelClasses}>Payout Amount ($) *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4250"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Date Disbursed *</label>
                <input name="withdrawn_on" type="date" required defaultValue={today} className={inputClasses} />
              </div>

              <div>
                <label className={labelClasses}>Payout Reference / Wire Details</label>
                <input
                  name="notes"
                  className={inputClasses}
                  placeholder="e.g. Deel contract payout #4, wire confirmed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddPayoutOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-500/50 bg-emerald-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-emerald-400 cursor-pointer"
                >
                  Record Cash Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD EXPENSE */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-lg text-fog-100">Record Fee / Desk Expense</h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await addDeskExpenseAction(formData);
                setIsAddExpenseOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className={labelClasses}>Apply to Account</label>
                <select
                  name="account_id"
                  defaultValue={selectedAccountId ?? ""}
                  className={inputClasses}
                >
                  <option value="">— General Desk Expense —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} ({a.broker_or_prop_firm ?? "Desk"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Category</label>
                  <select name="category" defaultValue="prop_fee" className={inputClasses}>
                    <option value="prop_fee">Prop Evaluation Fee</option>
                    <option value="deposit">Live Capital Deposit</option>
                    <option value="other">Platform / VPS / Data</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Amount ($) *</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 150"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Date Incurred *</label>
                <input name="incurred_on" type="date" required defaultValue={today} className={inputClasses} />
              </div>

              <div>
                <label className={labelClasses}>Notes / Description</label>
                <input
                  name="notes"
                  className={inputClasses}
                  placeholder="e.g. TradingView Premium, Rithmic feed fee"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Record Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
