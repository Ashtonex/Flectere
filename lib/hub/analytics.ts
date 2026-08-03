import type { Expense, PerformanceEntry, TradingAccount } from "./types";

export type AccountAnalytics = {
  accountId: string;
  latestBalance: number | null;
  latestEquity: number | null;
  totalSpend: number;
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
  expenses: Expense[]
): AccountAnalytics {
  const latest = latestEntry(entries);
  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const latestValue = latest?.equity ?? latest?.balance ?? null;
  const netReturn =
    latestValue !== null && account.starting_balance !== null
      ? latestValue - Number(account.starting_balance)
      : null;

  const roi = netReturn !== null && totalSpend > 0 ? netReturn / totalSpend : null;

  return {
    accountId: account.id,
    latestBalance: latest?.balance ?? null,
    latestEquity: latest?.equity ?? null,
    totalSpend,
    netReturn,
    roi,
  };
}

export function computePortfolioTotals(analytics: AccountAnalytics[]) {
  const totalSpend = analytics.reduce((sum, a) => sum + a.totalSpend, 0);
  const totalReturn = analytics.reduce((sum, a) => sum + (a.netReturn ?? 0), 0);
  const roi = totalSpend > 0 ? totalReturn / totalSpend : null;
  return { totalSpend, totalReturn, roi };
}

export function formatCurrency(value: number | null, currency = "USD") {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}
