import type { Expense, PerformanceEntry, TradingAccount, Withdrawal } from "./types";

export type AccountAnalytics = {
  accountId: string;
  latestBalance: number | null;
  latestEquity: number | null;
  totalSpend: number;
  extractedValue: number;
  totalValue: number | null;
  netReturn: number | null;
  roi: number | null;
};

function latestEntry(entries: PerformanceEntry[]): PerformanceEntry | null {
  if (entries.length === 0) return null;
  return [...entries].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1))[0];
}

export function computeAccountAnalytics(
  account: TradingAccount,
  entries: PerformanceEntry[],
  expenses: Expense[],
  withdrawals: Withdrawal[] = []
): AccountAnalytics {
  const latest = latestEntry(entries);
  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const extractedValue = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  const latestValue = latest?.equity ?? latest?.balance ?? null;

  // "Total value" is what the relationship is actually worth: what's still
  // sitting in the account, plus what's already been paid out of it. It's
  // null (not 0) when there's genuinely no data yet, so the UI can show
  // "—" instead of a misleading zero.
  const totalValue =
    latestValue !== null || extractedValue > 0 ? (latestValue ?? 0) + extractedValue : null;

  const netReturn =
    totalValue !== null && account.starting_balance !== null
      ? totalValue - Number(account.starting_balance)
      : null;

  const roi = netReturn !== null && totalSpend > 0 ? netReturn / totalSpend : null;

  return {
    accountId: account.id,
    latestBalance: latest?.balance ?? null,
    latestEquity: latest?.equity ?? null,
    totalSpend,
    extractedValue,
    totalValue,
    netReturn,
    roi,
  };
}

export function computePortfolioTotals(analytics: AccountAnalytics[]) {
  const totalSpend = analytics.reduce((sum, a) => sum + a.totalSpend, 0);
  const totalExtracted = analytics.reduce((sum, a) => sum + a.extractedValue, 0);
  const totalValue = analytics.reduce((sum, a) => sum + (a.totalValue ?? 0), 0);
  const totalReturn = analytics.reduce((sum, a) => sum + (a.netReturn ?? 0), 0);
  const roi = totalSpend > 0 ? totalReturn / totalSpend : null;
  return { totalSpend, totalExtracted, totalValue, totalReturn, roi };
}

export function formatCurrency(value: number | null, currency = "USD") {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}
